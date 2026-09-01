from datetime import UTC, datetime
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.farmer_registration import FarmerRegistration
from app.services.brgy import brgy_match, normalize_brgy_label
from app.services.user_accounts import default_officer_password, ensure_user
from app.models.domain import (
    BookedSlot,
    Farm,
    FarmerNotification,
    FarmerSubmission,
    Officer,
    PriorityVisit,
    ScheduledVisit,
    Survey,
    ValidationQueueItem,
)
from app.models.user import User
from app.schemas.domain import (
    AdminBootstrap,
    BookedSlotOut,
    FarmOut,
    FarmerBootstrap,
    FarmerNotificationCreate,
    FarmerNotificationOut,
    FarmerProfileOut,
    FarmerSubmissionCreate,
    FarmerSubmissionOut,
    OfficerAssignRequest,
    OfficerBootstrap,
    OfficerCreateRequest,
    OfficerCreateResponse,
    OfficerOut,
    PriorityVisitOut,
    QueueItemOut,
    ScheduleVisitRequest,
    ScheduledVisitOut,
    SurveyOut,
)

SECTOR_LABELS = {
    "A": "A (North)",
    "B": "B (South)",
    "C": "C (East)",
    "D": "D (West)",
}

TAG_CLASS_TO_FARM_STATUS = {
    "green": "healthy",
    "orange": "caution",
    "red": "risk",
}


def _external_id(prefix: str) -> str:
    return f"{prefix}{uuid4().hex[:12]}"


def _count_farms_in_brgy(db: Session, brgy: str) -> int:
    if brgy in ("Unassigned", "—", ""):
        return 0
    farms = db.scalars(select(Farm.brgy)).all()
    return sum(1 for value in farms if brgy_match(value, brgy))


def _refresh_officer_farm_counts(db: Session, brgy: str | None = None) -> None:
    q = select(Officer)
    if brgy:
        q = q.where(Officer.brgy == brgy)
    for officer in db.scalars(q).all():
        if officer.brgy in ("Unassigned", ""):
            officer.farms_covered = "—"
        else:
            count = _count_farms_in_brgy(db, officer.brgy)
            officer.farms_covered = str(count)
    db.commit()


def _farm_for_farmer(db: Session, farmer_id: str) -> Farm | None:
    reg = db.scalar(select(FarmerRegistration).where(FarmerRegistration.farmer_id == farmer_id))
    if reg is None:
        return None
    farm = db.scalar(select(Farm).where(Farm.external_id == f"farm-reg-{reg.id}"))
    if farm is not None:
        return farm
    farm_name = f"{reg.last_name} Farm"
    return db.scalar(select(Farm).where(Farm.name == farm_name))


def _farmer_profile(db: Session, farmer_id: str) -> FarmerProfileOut | None:
    reg = db.scalar(select(FarmerRegistration).where(FarmerRegistration.farmer_id == farmer_id))
    if reg is None:
        return None
    farm = _farm_for_farmer(db, farmer_id)
    return FarmerProfileOut(
        farmer_id=reg.farmer_id,
        name=" ".join(part for part in [reg.first_name, reg.middle_initial, reg.last_name] if part),
        farm=farm.name if farm is not None else f"{reg.last_name} Farm",
        sector=farm.sector if farm is not None else "— (survey pending)",
        brgy=reg.brgy,
        municipality=reg.municipality,
        phone=reg.phone,
    )


def _officer_name_for_brgy(db: Session, brgy: str) -> str:
    officers = db.scalars(select(Officer).where(Officer.status == "Active")).all()
    for row in officers:
        if brgy_match(row.brgy, brgy):
            return row.name
    return "—"


def list_barangays(db: Session) -> list[str]:
    """Distinct barangay names from farms, registrations, and officer postings."""
    from app.models.farmer_registration import FarmerRegistration

    names: set[str] = set()
    for value in db.scalars(select(Farm.brgy)).all():
        if value and value.strip() not in ("Unassigned", "—"):
            names.add(normalize_brgy_label(value))
    for value in db.scalars(select(FarmerRegistration.brgy)).all():
        if value and value.strip():
            names.add(normalize_brgy_label(value))
    for value in db.scalars(select(Officer.brgy)).all():
        if value and value.strip() not in ("Unassigned", "—"):
            names.add(normalize_brgy_label(value))
    return sorted(names, key=str.casefold)


def farm_to_out(row: Farm, registration: FarmerRegistration | None = None) -> FarmOut:
    return FarmOut(
        farmer_id=registration.farmer_id if registration else None,
        name=row.name,
        owner=row.owner,
        phone=registration.phone if registration else None,
        sector=row.sector,
        brgy=row.brgy,
        trees=row.trees,
        status=row.status,
        last_survey=row.last_survey,
    )


def queue_to_out(row: ValidationQueueItem) -> QueueItemOut:
    return QueueItemOut(
        id=row.external_id,
        brgy=row.brgy,
        title=row.title,
        sub=row.sub,
        conf=row.conf,
        validated=row.validated,
    )


def survey_to_out(row: Survey) -> SurveyOut:
    return SurveyOut(
        date=row.survey_date,
        farm=row.farm,
        sector=row.sector,
        brgy=row.brgy,
        images=row.images,
        ai_result=row.ai_result,
        officer=row.officer,
        status=row.status,
    )


def visit_to_out(row: ScheduledVisit) -> ScheduledVisitOut:
    return ScheduledVisitOut(
        id=row.external_id,
        farm=row.farm,
        owner=row.owner,
        brgy=row.brgy,
        date=row.visit_date,
        slot=row.slot,  # type: ignore[arg-type]
        scheduled_by=row.scheduled_by,
        purpose=row.purpose,
    )


def booked_to_out(row: BookedSlot) -> BookedSlotOut:
    return BookedSlotOut(date=row.visit_date, slot=row.slot)  # type: ignore[arg-type]


def officer_to_out(row: Officer) -> OfficerOut:
    return OfficerOut(
        emp_id=row.emp_id,
        name=row.name,
        phone=row.phone,
        brgy=row.brgy,
        farms_covered=row.farms_covered,
        status=row.status,
        last_active=row.last_active,
    )


def priority_to_out(row: PriorityVisit) -> PriorityVisitOut:
    return PriorityVisitOut(
        id=row.external_id,
        farm=row.farm,
        desc=row.description,
        level=row.level,  # type: ignore[arg-type]
        due=row.due_label,
        assigned=row.assigned,
        brgy=row.brgy,
        completed=row.completed,
    )


def notification_to_out(row: FarmerNotification) -> FarmerNotificationOut:
    return FarmerNotificationOut(
        id=row.external_id or f"n{row.id}",
        date_line=row.date_line,
        body=row.body,
        dot=row.dot_color,
        is_new=row.is_new,
    )


def submission_to_out(row: FarmerSubmission) -> FarmerSubmissionOut:
    return FarmerSubmissionOut(
        date=row.date_label,
        sector=row.sector,
        tag=row.tag,
        tag_class=row.tag_class,  # type: ignore[arg-type]
        color=row.color,
    )


def officer_bootstrap(db: Session) -> OfficerBootstrap:
    registrations = {
        f"farm-reg-{row.id}": row
        for row in db.scalars(select(FarmerRegistration).where(FarmerRegistration.status == "approved")).all()
    }
    return OfficerBootstrap(
        farms=[farm_to_out(r, registrations.get(r.external_id or "")) for r in db.scalars(select(Farm).order_by(Farm.name)).all()],
        surveys=[survey_to_out(r) for r in db.scalars(select(Survey).order_by(Survey.id.desc())).all()],
        queue=[
            queue_to_out(r)
            for r in db.scalars(select(ValidationQueueItem).order_by(ValidationQueueItem.id)).all()
        ],
        scheduled_visits=[
            visit_to_out(r)
            for r in db.scalars(select(ScheduledVisit).order_by(ScheduledVisit.visit_date)).all()
        ],
        booked_slots=[
            booked_to_out(r) for r in db.scalars(select(BookedSlot).order_by(BookedSlot.visit_date)).all()
        ],
        priority_visits=[
            priority_to_out(r)
            for r in db.scalars(select(PriorityVisit).order_by(PriorityVisit.id)).all()
        ],
        officers=[officer_to_out(r) for r in db.scalars(select(Officer).order_by(Officer.emp_id)).all()],
    )


def admin_bootstrap(db: Session) -> AdminBootstrap:
    registrations = {
        f"farm-reg-{row.id}": row
        for row in db.scalars(select(FarmerRegistration).where(FarmerRegistration.status == "approved")).all()
    }
    return AdminBootstrap(
        farms=[farm_to_out(r, registrations.get(r.external_id or "")) for r in db.scalars(select(Farm).order_by(Farm.name)).all()],
        surveys=[survey_to_out(r) for r in db.scalars(select(Survey).order_by(Survey.id.desc())).all()],
        officers=[officer_to_out(r) for r in db.scalars(select(Officer).order_by(Officer.emp_id)).all()],
        scheduled_visits=[
            visit_to_out(r)
            for r in db.scalars(select(ScheduledVisit).order_by(ScheduledVisit.visit_date.desc())).all()
        ],
    )


def farmer_bootstrap(db: Session, farmer_id: str) -> FarmerBootstrap:
    notifications = db.scalars(
        select(FarmerNotification)
        .where(FarmerNotification.farmer_id == farmer_id)
        .order_by(FarmerNotification.id.desc()),
    ).all()
    submissions = db.scalars(
        select(FarmerSubmission)
        .where(FarmerSubmission.farmer_id == farmer_id)
        .order_by(FarmerSubmission.id.desc()),
    ).all()
    return FarmerBootstrap(
        profile=_farmer_profile(db, farmer_id),
        notifications=[notification_to_out(r) for r in notifications],
        submissions=[submission_to_out(r) for r in submissions],
    )


def validate_queue_item(db: Session, external_id: str) -> QueueItemOut | None:
    row = db.scalar(
        select(ValidationQueueItem).where(ValidationQueueItem.external_id == external_id),
    )
    if row is None:
        return None
    row.validated = True
    survey = db.scalar(select(Survey).where(Survey.external_id == external_id))
    if survey is not None:
        survey.status = "validated"
    db.commit()
    db.refresh(row)
    return queue_to_out(row)


def schedule_visit(db: Session, body: ScheduleVisitRequest) -> ScheduledVisitOut:
    now = datetime.now(UTC)
    try:
        visit_day = datetime.strptime(body.date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid visit date") from exc

    if visit_day < now.date():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot schedule a past date.")

    if visit_day == now.date():
        if now.hour >= 18:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Same-day visits cannot be booked after 6:00 PM.",
            )
        if body.slot == "PM" and now.hour >= 18:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Afternoon slot is closed after 6:00 PM.",
            )

    external_id = _external_id("visit")
    visit = ScheduledVisit(
        external_id=external_id,
        farm=body.farm,
        owner=body.owner,
        brgy=body.brgy,
        visit_date=body.date,
        slot=body.slot,
        scheduled_by=body.scheduled_by,
        purpose=body.purpose,
    )
    db.add(visit)

    existing_slot = db.scalar(
        select(BookedSlot).where(
            BookedSlot.visit_date == body.date,
            BookedSlot.slot == body.slot,
        ),
    )
    if existing_slot is None:
        db.add(BookedSlot(visit_date=body.date, slot=body.slot))

    date_disp = datetime.strptime(body.date, "%Y-%m-%d").strftime("%a %b %d, %Y")
    slot_label = "8:00 AM - 11:30 AM" if body.slot == "AM" else "1:00 PM - 4:30 PM"
    if body.notify_farmer_id:
        db.add(
            FarmerNotification(
                external_id=_external_id("n"),
                farmer_id=body.notify_farmer_id,
                date_line=f"{date_disp} | {slot_label}",
                body=(
                    f"Farm visit scheduled by your PCA officer for {body.farm}. "
                    "Please prepare access to the plot."
                ),
                dot_color="#ea580c",
                is_new=True,
            ),
        )

    db.commit()
    db.refresh(visit)
    return visit_to_out(visit)


def complete_priority_visit(db: Session, external_id: str) -> PriorityVisitOut | None:
    row = db.scalar(select(PriorityVisit).where(PriorityVisit.external_id == external_id))
    if row is None:
        return None
    row.completed = True
    db.commit()
    db.refresh(row)
    return priority_to_out(row)


def assign_officer(db: Session, emp_id: str, body: OfficerAssignRequest) -> OfficerOut | None:
    row = db.get(Officer, emp_id)
    if row is None:
        return None
    brgy = body.brgy.strip()
    if brgy in ("__UNASSIGN__", "None", "Unassigned"):
        row.brgy = "Unassigned"
        row.farms_covered = "—"
        row.status = "Inactive"
    else:
        row.brgy = normalize_brgy_label(brgy)
        row.status = "Active"
        row.last_active = datetime.now(UTC).strftime("%b %d, %Y")
    _refresh_officer_farm_counts(db, row.brgy if row.brgy != "Unassigned" else None)
    db.refresh(row)
    return officer_to_out(row)


def update_officer_details(
    db: Session,
    emp_id: str,
    *,
    name: str,
    phone: str,
) -> OfficerOut | None:
    row = db.get(Officer, emp_id)
    if row is None:
        return None
    row.name = name.strip()
    row.phone = phone.strip()
    user = db.get(User, emp_id)
    if user is not None:
        user.display_name = row.name
    db.commit()
    db.refresh(row)
    return officer_to_out(row)


def create_officer(db: Session, body: OfficerCreateRequest) -> OfficerCreateResponse:
    emp_id = body.emp_id.strip().upper()
    if db.get(Officer, emp_id) is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Officer ID already exists.")

    password = body.password or default_officer_password(emp_id)
    ensure_user(
        db,
        user_id=emp_id,
        role="officer",
        password=password,
        display_name=body.name.strip(),
    )

    brgy = normalize_brgy_label(body.brgy.strip()) if body.brgy else "Unassigned"
    if brgy == "Unassigned":
        farms_covered = "—"
        status = "Inactive"
    else:
        farms_covered = str(_count_farms_in_brgy(db, brgy))
        status = "Active"
    row = Officer(
        emp_id=emp_id,
        name=body.name.strip(),
        phone=body.phone.strip(),
        brgy=brgy,
        farms_covered=farms_covered,
        status=status,
        last_active=datetime.now(UTC).strftime("%b %d, %Y"),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return OfficerCreateResponse(
        officer=officer_to_out(row),
        initial_password=password,
        login_note=f"Officer login: ID {emp_id} / password {password}",
    )


def remove_officer(db: Session, emp_id: str) -> bool:
    row = db.get(Officer, emp_id)
    if row is None:
        return False
    user = db.get(User, emp_id)
    if user is not None:
        user.is_active = False
    db.delete(row)
    db.commit()
    return True


def create_farmer_submission(
    db: Session,
    farmer_id: str,
    body: FarmerSubmissionCreate,
) -> FarmerSubmissionOut:
    row = FarmerSubmission(
        farmer_id=farmer_id,
        date_label=body.date_label,
        sector=body.sector,
        tag=body.tag,
        tag_class=body.tag_class,
        color=body.color,
        confidence_pct=body.confidence_pct,
        uncertain=body.uncertain,
        image_count=body.image_count,
    )
    db.add(row)

    reg = db.scalar(select(FarmerRegistration).where(FarmerRegistration.farmer_id == farmer_id))
    brgy = reg.brgy if reg else "—"
    farm = _farm_for_farmer(db, farmer_id)
    farm_name = farm.name if farm else (f"{reg.last_name} Farm" if reg else "Unknown farm")
    owner = farm.owner if farm else (reg and f"{reg.first_name} {reg.last_name}" or farmer_id)

    sector_code = body.sector.strip().upper()[:1]
    sector_label = SECTOR_LABELS.get(sector_code, body.sector)
    today = datetime.now(UTC).strftime("%Y-%m-%d")
    queue_id = _external_id("q")

    conf_label = f"{body.confidence_pct}%" if body.confidence_pct else "—"
    db.add(
        ValidationQueueItem(
            external_id=queue_id,
            brgy=brgy,
            title=f"{farm_name} — {body.tag}",
            sub=f"{farmer_id} · Sector {sector_code} · {body.image_count} photo(s) · {owner}",
            conf=conf_label,
            validated=False,
        ),
    )

    survey_status = "review" if body.uncertain else "pending"
    db.add(
        Survey(
            external_id=queue_id,
            survey_date=today,
            farm=farm_name,
            sector=sector_label,
            brgy=brgy,
            images=body.image_count,
            ai_result=body.tag,
            officer=_officer_name_for_brgy(db, brgy),
            status=survey_status,
        ),
    )

    if farm is not None:
        farm.sector = sector_label
        farm.status = TAG_CLASS_TO_FARM_STATUS.get(body.tag_class, "pending")
        farm.last_survey = datetime.now(UTC).strftime("%b %d, %Y")

    if body.uncertain:
        db.add(
            PriorityVisit(
                external_id=_external_id("pv"),
                farm=farm_name,
                description=f"Low-confidence CNN result ({body.tag}). Officer validation required.",
                level="high",
                due_label="Within 3 days",
                assigned=_officer_name_for_brgy(db, brgy),
                brgy=brgy,
                completed=False,
            ),
        )

    db.add(
        FarmerNotification(
            external_id=_external_id("n"),
            farmer_id=farmer_id,
            date_line=datetime.now(UTC).strftime("%b %d, %Y"),
            body=f"Your report for sector {sector_code} was sent to PCA. Status: {body.tag}.",
            dot_color=body.color,
            is_new=True,
        ),
    )

    db.commit()
    db.refresh(row)
    return submission_to_out(row)


def create_farmer_notification(
    db: Session,
    body: FarmerNotificationCreate,
) -> FarmerNotificationOut:
    row = FarmerNotification(
        external_id=f"n{int(datetime.now(UTC).timestamp())}",
        farmer_id=body.farmer_id,
        date_line=body.date_line,
        body=body.body,
        dot_color=body.dot_color,
        is_new=body.is_new,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return notification_to_out(row)
