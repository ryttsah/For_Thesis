from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data import demo_catalog as catalog
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


def seed_domain_data(db: Session) -> int:
    inserted = 0

    for row in catalog.FARMS:
        if db.scalar(select(Farm.id).where(Farm.external_id == row["external_id"])):
            continue
        db.add(Farm(**row))
        inserted += 1

    for row in catalog.QUEUE:
        if db.scalar(
            select(ValidationQueueItem.id).where(
                ValidationQueueItem.external_id == row["external_id"],
            ),
        ):
            continue
        db.add(ValidationQueueItem(**row))
        inserted += 1

    for row in catalog.SURVEYS:
        if db.scalar(select(Survey.id).where(Survey.external_id == row["external_id"])):
            continue
        db.add(Survey(**row))
        inserted += 1

    for row in catalog.SCHEDULED_VISITS:
        if db.scalar(
            select(ScheduledVisit.id).where(
                ScheduledVisit.external_id == row["external_id"],
            ),
        ):
            continue
        db.add(ScheduledVisit(**row))
        inserted += 1

    for row in catalog.BOOKED_SLOTS:
        exists = db.scalar(
            select(BookedSlot.id).where(
                BookedSlot.visit_date == row["visit_date"],
                BookedSlot.slot == row["slot"],
            ),
        )
        if exists:
            continue
        db.add(BookedSlot(**row))
        inserted += 1

    for row in catalog.OFFICERS:
        if db.get(Officer, row["emp_id"]):
            continue
        db.add(Officer(**row))
        inserted += 1

    for row in catalog.PRIORITY_VISITS:
        if db.scalar(
            select(PriorityVisit.id).where(
                PriorityVisit.external_id == row["external_id"],
            ),
        ):
            continue
        db.add(PriorityVisit(**row))
        inserted += 1

    for row in catalog.FARMER_NOTIFICATIONS:
        if db.scalar(
            select(FarmerNotification.id).where(
                FarmerNotification.external_id == row["external_id"],
            ),
        ):
            continue
        db.add(FarmerNotification(**row))
        inserted += 1

    for row in catalog.FARMER_SUBMISSIONS:
        exists = db.scalar(
            select(FarmerSubmission.id).where(
                FarmerSubmission.farmer_id == row["farmer_id"],
                FarmerSubmission.date_label == row["date_label"],
            ),
        )
        if exists:
            continue
        db.add(FarmerSubmission(**row))
        inserted += 1

    if inserted:
        db.commit()
    return inserted
