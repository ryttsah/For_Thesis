from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.domain import Farm
from app.models.farmer_registration import FarmerRegistration
from app.services.user_accounts import default_farmer_password, ensure_user
from app.schemas.registrations import (
    ApprovedFarmerResponse,
    RegistrationCreate,
    RegistrationResponse,
    RejectedAuditResponse,
)


def format_display_date(dt: datetime) -> str:
    return dt.strftime("%b %d, %Y")


def full_name(row: FarmerRegistration) -> str:
    parts = [row.first_name, row.middle_initial, row.last_name]
    return " ".join(p for p in parts if p)


def to_registration_response(row: FarmerRegistration) -> RegistrationResponse:
    return RegistrationResponse(
        id=str(row.id),
        farmer_id=row.farmer_id,
        applied=format_display_date(row.applied_at),
        first_name=row.first_name,
        middle_initial=row.middle_initial,
        last_name=row.last_name,
        farm_address=row.farm_address,
        brgy=row.brgy,
        municipality=row.municipality,
        province=row.province,
        area_hectares=row.area_hectares,
        area_input_unit=row.area_input_unit,  # type: ignore[arg-type]
        area_input_value=row.area_input_value,
        farm_status=row.farm_status,
        phone=row.phone,
        alt_phone=row.alt_phone,
        reg_purpose_type=row.reg_purpose_type,
        reg_purpose_other_text=row.reg_purpose_other_text,
        status=row.status,  # type: ignore[arg-type]
    )


def next_farmer_id(db: Session) -> str:
    result = db.scalar(
        select(func.max(FarmerRegistration.farmer_id)).where(
            FarmerRegistration.farmer_id.like("FARMER-%"),
        ),
    )
    if not result:
        return "FARMER-001"

    try:
        num = int(result.split("-", 1)[1])
    except (IndexError, ValueError):
        num = 0
    return f"FARMER-{num + 1:03d}"


def list_pending(db: Session) -> list[RegistrationResponse]:
    rows = db.scalars(
        select(FarmerRegistration)
        .where(FarmerRegistration.status == "pending")
        .order_by(FarmerRegistration.applied_at.desc()),
    ).all()
    return [to_registration_response(row) for row in rows]


def list_approved(db: Session) -> list[ApprovedFarmerResponse]:
    rows = db.scalars(
        select(FarmerRegistration)
        .where(FarmerRegistration.status == "approved")
        .order_by(FarmerRegistration.approved_at.desc()),
    ).all()
    return [
        ApprovedFarmerResponse(
            name=full_name(row),
            farmer_id=row.farmer_id,
            brgy=row.brgy,
            approved_date=format_display_date(row.approved_at or row.applied_at),
            approved_by=row.approved_by or "PCA Administrator",
        )
        for row in rows
    ]


def list_rejected(db: Session) -> list[RejectedAuditResponse]:
    rows = db.scalars(
        select(FarmerRegistration)
        .where(FarmerRegistration.status == "rejected")
        .order_by(FarmerRegistration.applied_at.desc()),
    ).all()
    return [
        RejectedAuditResponse(
            farmer_id=row.farmer_id,
            reason=row.rejection_reason or "—",
            when_label=format_display_date(row.rejected_at or row.applied_at),
        )
        for row in rows
    ]


def get_registration(db: Session, registration_id: int) -> FarmerRegistration | None:
    return db.get(FarmerRegistration, registration_id)


def create_registration(db: Session, body: RegistrationCreate) -> FarmerRegistration:
    row = FarmerRegistration(
        farmer_id=next_farmer_id(db),
        status="pending",
        first_name=body.first_name.strip(),
        middle_initial=body.middle_initial.strip(),
        last_name=body.last_name.strip(),
        farm_address=body.farm_address.strip(),
        brgy=body.brgy.strip(),
        municipality=body.municipality.strip(),
        province=body.province.strip(),
        area_hectares=body.area_hectares,
        area_input_unit=body.area_input_unit,
        area_input_value=body.area_input_value,
        farm_status=body.farm_status.strip(),
        phone=body.phone.strip(),
        alt_phone=body.alt_phone.strip(),
        reg_purpose_type=body.reg_purpose_type.strip(),
        reg_purpose_other_text=body.reg_purpose_other_text.strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def estimate_tree_count(area_hectares: float) -> int:
    """Rough bearing-palm estimate (~45 palms/ha), minimum 10 for small plots."""
    return max(10, int(round(area_hectares * 45)))


def approve_registration(
    db: Session,
    registration_id: int,
    approved_by: str,
) -> tuple[FarmerRegistration, str]:
    row = get_registration(db, registration_id)
    if row is None or row.status != "pending":
        raise ValueError("not_found_or_not_pending")

    row.status = "approved"
    row.approved_at = datetime.now(UTC)
    row.approved_by = approved_by

    farm_name = f"{row.last_name} Farm"
    existing_farm = db.scalar(select(Farm.id).where(Farm.name == farm_name))
    if not existing_farm:
        db.add(
            Farm(
                external_id=f"farm-reg-{row.id}",
                name=farm_name,
                owner=full_name(row),
                sector="— (survey pending)",
                brgy=row.brgy,
                trees=estimate_tree_count(row.area_hectares),
                status="pending",
                last_survey="—",
            ),
        )

    initial_password = default_farmer_password(row.farmer_id, row.phone)
    ensure_user(
        db,
        user_id=row.farmer_id,
        role="farmer",
        password=initial_password,
        display_name=full_name(row),
    )

    db.commit()
    db.refresh(row)
    return row, initial_password


def reject_registration(
    db: Session,
    registration_id: int,
    reason: str,
) -> FarmerRegistration:
    row = get_registration(db, registration_id)
    if row is None or row.status != "pending":
        raise ValueError("not_found_or_not_pending")

    row.status = "rejected"
    row.rejection_reason = reason.strip()
    row.rejected_at = datetime.now(UTC)
    db.commit()
    db.refresh(row)
    return row
