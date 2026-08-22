from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_user, get_current_user_id, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.domain import (
    AdminBootstrap,
    FarmerBootstrap,
    FarmerNotificationCreate,
    FarmerNotificationOut,
    FarmerSubmissionCreate,
    FarmerSubmissionOut,
    OfficerAssignRequest,
    OfficerBootstrap,
    OfficerCreateRequest,
    OfficerCreateResponse,
    OfficerOut,
    OfficerUpdateRequest,
    PriorityVisitOut,
    QueueItemOut,
    ScheduleVisitRequest,
    ScheduledVisitOut,
)
from app.services import domain as domain_service

router = APIRouter(tags=["domain"])


@router.get("/meta/barangays", response_model=list[str])
def list_barangays(
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(get_authenticated_user)],
) -> list[str]:
    return domain_service.list_barangays(db)


@router.get("/bootstrap/officer", response_model=OfficerBootstrap)
def bootstrap_officer(
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("officer", "admin"))],
) -> OfficerBootstrap:
    return domain_service.officer_bootstrap(db)


@router.get("/bootstrap/admin", response_model=AdminBootstrap)
def bootstrap_admin(
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> AdminBootstrap:
    return domain_service.admin_bootstrap(db)


@router.get("/bootstrap/farmer", response_model=FarmerBootstrap)
def bootstrap_farmer(
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    _role: Annotated[str, Depends(require_role("farmer"))],
) -> FarmerBootstrap:
    return domain_service.farmer_bootstrap(db, user_id)


@router.patch("/queue/{item_id}/validate", response_model=QueueItemOut)
def validate_queue(
    item_id: str,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("officer", "admin"))],
) -> QueueItemOut:
    result = domain_service.validate_queue_item(db, item_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Queue item not found")
    return result


@router.post("/visits/scheduled", response_model=ScheduledVisitOut, status_code=status.HTTP_201_CREATED)
def create_scheduled_visit(
    body: ScheduleVisitRequest,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("officer", "admin"))],
) -> ScheduledVisitOut:
    return domain_service.schedule_visit(db, body)


@router.patch("/visits/priority/{visit_id}/complete", response_model=PriorityVisitOut)
def complete_priority(
    visit_id: str,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("officer", "admin"))],
) -> PriorityVisitOut:
    result = domain_service.complete_priority_visit(db, visit_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Priority visit not found")
    return result


@router.patch("/officers/{emp_id}", response_model=OfficerOut)
def update_officer(
    emp_id: str,
    body: OfficerAssignRequest,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> OfficerOut:
    result = domain_service.assign_officer(db, emp_id, body)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Officer not found")
    return result


@router.patch("/officers/{emp_id}/details", response_model=OfficerOut)
def patch_officer_details(
    emp_id: str,
    body: OfficerUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> OfficerOut:
    result = domain_service.update_officer_details(db, emp_id, name=body.name, phone=body.phone)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Officer not found")
    return result


@router.post("/officers", response_model=OfficerCreateResponse, status_code=status.HTTP_201_CREATED)
def create_officer(
    body: OfficerCreateRequest,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> OfficerCreateResponse:
    return domain_service.create_officer(db, body)


@router.delete("/officers/{emp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_officer(
    emp_id: str,
    db: Annotated[Session, Depends(get_db)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> None:
    if not domain_service.remove_officer(db, emp_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Officer not found")


@router.post("/farmers/me/submissions", response_model=FarmerSubmissionOut, status_code=status.HTTP_201_CREATED)
def add_submission(
    body: FarmerSubmissionCreate,
    db: Annotated[Session, Depends(get_db)],
    user_id: Annotated[str, Depends(get_current_user_id)],
    _role: Annotated[str, Depends(require_role("farmer"))],
) -> FarmerSubmissionOut:
    return domain_service.create_farmer_submission(db, user_id, body)


@router.post("/notifications", response_model=FarmerNotificationOut, status_code=status.HTTP_201_CREATED)
def add_notification(
    body: FarmerNotificationCreate,
    db: Annotated[Session, Depends(get_db)],
    _user: Annotated[User, Depends(get_authenticated_user)],
    _role: Annotated[str, Depends(require_role("officer", "admin"))],
) -> FarmerNotificationOut:
    return domain_service.create_farmer_notification(db, body)
