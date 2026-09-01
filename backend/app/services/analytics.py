"""Aggregate charts and farmer-facing stats from live DB rows."""

from __future__ import annotations

from collections import defaultdict
from datetime import UTC, datetime
from typing import Literal

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.domain import Farm, FarmerSubmission, Survey, ValidationQueueItem
from app.models.farmer_registration import FarmerRegistration

ConditionKey = Literal["healthy", "yellowing", "scale", "beetle"]

MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

TAG_TO_CONDITION: dict[str, ConditionKey] = {
    "rhinoceros beetle": "beetle",
    "rhino beetle": "beetle",
    "bagangan": "beetle",
    "coconut scale insect": "scale",
    "scale insect": "scale",
    "cocolisap": "scale",
    "lisap": "scale",
    "csi": "scale",
    "yellowing": "yellowing",
    "pagkadilaw": "yellowing",
    "nagdilaw": "yellowing",
    "dilaw": "yellowing",
    "healthy": "healthy",
    "maayo": "healthy",
}


def _month_key(dt: datetime) -> tuple[int, int]:
    return (dt.year, dt.month)


def _last_six_month_keys() -> list[tuple[int, int]]:
    now = datetime.now(UTC)
    keys: list[tuple[int, int]] = []
    y, m = now.year, now.month
    for _ in range(6):
        keys.append((y, m))
        m -= 1
        if m < 1:
            m = 12
            y -= 1
    return keys


def _label_for_key(key: tuple[int, int]) -> str:
    y, m = key
    return f"{MONTH_LABELS[m - 1]} {y}"


def _classify_tag(tag: str) -> ConditionKey:
    lower = tag.strip().lower()
    for needle, key in TAG_TO_CONDITION.items():
        if needle in lower:
            return key
    return "healthy"


def _empty_buckets() -> dict[ConditionKey, list[int]]:
    return {"healthy": [], "yellowing": [], "scale": [], "beetle": []}


def condition_trend(
    db: Session,
    *,
    brgy: str | None = None,
) -> dict:
    keys = _last_six_month_keys()
    labels = [_label_for_key(k) for k in keys]
    counts: dict[tuple[int, int], dict[ConditionKey, int]] = {
        k: {"healthy": 0, "yellowing": 0, "scale": 0, "beetle": 0} for k in keys
    }

    surveys = db.scalars(select(Survey).order_by(Survey.id)).all()
    for row in surveys:
        if brgy and row.brgy != brgy:
            continue
        try:
            parsed = datetime.strptime(row.survey_date[:10], "%Y-%m-%d")
        except ValueError:
            parsed = datetime.now(UTC)
        key = _month_key(parsed)
        if key not in counts:
            continue
        cond = _classify_tag(row.ai_result)
        counts[key][cond] += 1

    healthy: list[int] = []
    yellowing: list[int] = []
    scale: list[int] = []
    beetle: list[int] = []

    for key in keys:
        bucket = counts[key]
        total = sum(bucket.values()) or 1
        healthy.append(round(bucket["healthy"] / total * 100))
        yellowing.append(round(bucket["yellowing"] / total * 100))
        scale.append(round(bucket["scale"] / total * 100))
        beetle.append(round(bucket["beetle"] / total * 100))

    return {
        "labels": labels,
        "healthy": healthy,
        "yellowing": yellowing,
        "scale": scale,
        "beetle": beetle,
        "scope": "barangay" if brgy else "province",
        "brgy": brgy,
    }


def provincial_statistics(db: Session) -> dict:
    surveys = db.scalars(select(Survey)).all()
    if not surveys:
        return {
            "healthy_pct": 0,
            "yellowing_pct": 0,
            "pest_pct": 0,
            "labels": {
                "healthy": "Healthy palms (province)",
                "yellowing": "Yellowing / nutrient stress",
                "pest": "Pest damage (CSI + rhino beetle)",
            },
            "sample_size": 0,
        }

    buckets = {"healthy": 0, "yellowing": 0, "pest": 0}
    for row in surveys:
        cond = _classify_tag(row.ai_result)
        if cond == "healthy":
            buckets["healthy"] += 1
        elif cond == "yellowing":
            buckets["yellowing"] += 1
        else:
            buckets["pest"] += 1

    total = len(surveys)
    return {
        "healthy_pct": round(buckets["healthy"] / total * 100),
        "yellowing_pct": round(buckets["yellowing"] / total * 100),
        "pest_pct": round(buckets["pest"] / total * 100),
        "labels": {
            "healthy": "Healthy palms (province)",
            "yellowing": "Yellowing / nutrient stress",
            "pest": "Pest damage (CSI + rhino beetle)",
        },
        "sample_size": total,
    }


def farmer_sector_status(db: Session, farmer_id: str) -> list[dict]:
    """Per-sector summary from this farmer's submissions only."""
    rows = db.scalars(
        select(FarmerSubmission)
        .where(FarmerSubmission.farmer_id == farmer_id)
        .order_by(FarmerSubmission.id.desc()),
    ).all()

    by_sector: dict[str, FarmerSubmission] = {}
    for row in rows:
        code = row.sector.strip().upper()[:1]
        if code not in by_sector:
            by_sector[code] = row

    sectors = ["A", "B", "C", "D"]
    result: list[dict] = []
    for code in sectors:
        row = by_sector.get(code)
        if row is None:
            result.append(
                {
                    "code": code,
                    "status": "no_data",
                    "label_en": "No submission yet",
                    "label_hil": "Wala pa sang report",
                    "color": "#9ca3af",
                },
            )
            continue
        if row.uncertain:
            result.append(
                {
                    "code": code,
                    "status": "review",
                    "label_en": "Needs PCA review",
                    "label_hil": "Kinahanglan review",
                    "color": "#f59e0b",
                },
            )
        elif row.tag_class == "green":
            result.append(
                {
                    "code": code,
                    "status": "healthy",
                    "label_en": "Healthy",
                    "label_hil": "Maayo",
                    "color": "#22a355",
                },
            )
        elif row.tag_class == "orange":
            result.append(
                {
                    "code": code,
                    "status": "caution",
                    "label_en": "Caution",
                    "label_hil": "Nagdilaw",
                    "color": "#f59e0b",
                },
            )
        else:
            result.append(
                {
                    "code": code,
                    "status": "risk",
                    "label_en": "At risk",
                    "label_hil": "Bagangan",
                    "color": "#dc2626",
                },
            )
    return result


def portal_notifications(
    db: Session,
    *,
    role: str,
    user_id: str,
) -> list[dict]:
    items: list[dict] = []
    now_label = datetime.now(UTC).strftime("%b %d, %Y")

    if role == "admin":
        pending = db.scalar(
            select(func.count()).select_from(FarmerRegistration).where(
                FarmerRegistration.status == "pending",
            ),
        ) or 0
        if pending:
            items.append(
                {
                    "id": "admin-pending-reg",
                    "title": f"{pending} farmer registration(s) pending",
                    "body": "Review and approve new farms under Approvals.",
                    "href": "/admin/approvals",
                    "is_new": True,
                },
            )

        risk = db.scalar(
            select(func.count()).select_from(Farm).where(Farm.status == "risk"),
        ) or 0
        if risk:
            items.append(
                {
                    "id": "admin-risk-farms",
                    "title": f"{risk} high-risk farm(s)",
                    "body": "Open Farms to monitor province-wide risk status.",
                    "href": "/admin/farms",
                    "is_new": True,
                },
            )

        queue_open = db.scalar(
            select(func.count()).select_from(ValidationQueueItem).where(
                ValidationQueueItem.validated.is_(False),
            ),
        ) or 0
        if queue_open:
            items.append(
                {
                    "id": "admin-open-queue",
                    "title": f"{queue_open} AI survey(s) awaiting validation",
                    "body": "Officers validate farmer CNN submissions in their queue.",
                    "href": "/admin/surveys",
                    "is_new": True,
                },
            )

    if role == "officer":
        from app.models.domain import Officer

        officer = db.get(Officer, user_id)
        brgy = officer.brgy if officer and officer.brgy != "Unassigned" else None

        q = select(ValidationQueueItem).where(ValidationQueueItem.validated.is_(False))
        if brgy:
            q = q.where(ValidationQueueItem.brgy == brgy)
        pending_q = len(db.scalars(q).all())
        if pending_q:
            items.append(
                {
                    "id": "officer-queue",
                    "title": f"{pending_q} survey(s) in your queue",
                    "body": "Validate farmer photo submissions.",
                    "href": "/officer/queue",
                    "is_new": True,
                },
            )

        if brgy:
            farm_risk = db.scalar(
                select(func.count()).select_from(Farm).where(
                    Farm.brgy == brgy,
                    Farm.status == "risk",
                ),
            ) or 0
            if farm_risk:
                items.append(
                    {
                        "id": "officer-risk",
                        "title": f"{farm_risk} at-risk farm(s) in {brgy}",
                        "body": "Schedule a field visit if needed.",
                        "href": "/officer/visits",
                        "is_new": True,
                    },
                )

    if not items:
        items.append(
            {
                "id": f"{role}-ok",
                "title": "No urgent alerts",
                "body": f"You're up to date as of {now_label}.",
                "href": "",
                "is_new": False,
            },
        )

    return items
