from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_id, require_role
from app.db.session import get_db
from app.models.domain import Officer
from app.schemas.domain import ConditionTrendOut, FarmerSectorStatusOut, PortalNotificationOut, ProvincialStatsOut
from app.services import analytics as analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/trend", response_model=ConditionTrendOut)
def condition_trend(
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("officer", "admin"))],
    brgy: str | None = None,
) -> ConditionTrendOut:
    return ConditionTrendOut(**analytics_service.condition_trend(db, brgy=brgy))


@router.get("/trend/officer", response_model=ConditionTrendOut)
def officer_condition_trend(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    _role: Annotated[str, Depends(require_role("officer"))],
) -> ConditionTrendOut:
    officer = db.get(Officer, user_id)
    brgy = officer.brgy if officer and officer.brgy not in ("Unassigned", "") else None
    return ConditionTrendOut(**analytics_service.condition_trend(db, brgy=brgy))


@router.get("/province", response_model=ProvincialStatsOut)
def provincial_stats(
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("farmer", "officer", "admin"))],
) -> ProvincialStatsOut:
    return ProvincialStatsOut(**analytics_service.provincial_statistics(db))


@router.get("/farmer/sectors", response_model=list[FarmerSectorStatusOut])
def farmer_sectors(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    _role: Annotated[str, Depends(require_role("farmer"))],
) -> list[FarmerSectorStatusOut]:
    rows = analytics_service.farmer_sector_status(db, user_id)
    return [FarmerSectorStatusOut(**r) for r in rows]


@router.get("/notifications", response_model=list[PortalNotificationOut])
def portal_notifications(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    role: Annotated[str, Depends(require_role("officer", "admin"))],
) -> list[PortalNotificationOut]:
    rows = analytics_service.portal_notifications(db, role=role, user_id=user_id)
    return [PortalNotificationOut(**r) for r in rows]
