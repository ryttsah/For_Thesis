from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_user, require_role
from app.db.session import get_db
from app.models.user import User
from app.schemas.registrations import (
    ApprovedFarmerResponse,
    RegistrationCreate,
    RegistrationCreateResponse,
    RegistrationResponse,
    RejectRegistrationRequest,
    RejectedAuditResponse,
)
from app.services import registrations as reg_service

router = APIRouter(prefix="/registrations", tags=["registrations"])


@router.post("", response_model=RegistrationCreateResponse, status_code=status.HTTP_201_CREATED)
def submit_registration(
    body: RegistrationCreate,
    db: Annotated[Session, Depends(get_db)],
) -> RegistrationCreateResponse:
    try:
        row = reg_service.create_registration(db, body)
    except ValueError as exc:
        if str(exc) == "duplicate_registration":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Duplicate registration is not allowed. This farmer or phone number already has a pending or approved registration.",
            ) from exc
        raise
    return RegistrationCreateResponse(
        farmer_id=row.farmer_id,
        message="Registration submitted for PCA review.",
    )


@router.get("/pending", response_model=list[RegistrationResponse])
def list_pending(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[str, Depends(require_role("admin"))],
) -> list[RegistrationResponse]:
    return reg_service.list_pending(db)


@router.get("/approved", response_model=list[ApprovedFarmerResponse])
def list_approved(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[str, Depends(require_role("admin"))],
) -> list[ApprovedFarmerResponse]:
    return reg_service.list_approved(db)


@router.get("/rejected", response_model=list[RejectedAuditResponse])
def list_rejected(
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[str, Depends(require_role("admin"))],
) -> list[RejectedAuditResponse]:
    return reg_service.list_rejected(db)


@router.post("/{registration_id}/approve", response_model=ApprovedFarmerResponse)
def approve_registration(
    registration_id: int,
    db: Annotated[Session, Depends(get_db)],
    admin: Annotated[User, Depends(get_authenticated_user)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> ApprovedFarmerResponse:
    try:
        row, initial_password = reg_service.approve_registration(
            db,
            registration_id,
            approved_by=admin.display_name or admin.id,
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending registration not found") from None

    return ApprovedFarmerResponse(
        name=reg_service.full_name(row),
        farmer_id=row.farmer_id,
        brgy=row.brgy,
        approved_date=reg_service.format_display_date(row.approved_at or row.applied_at),
        approved_by=row.approved_by or "PCA Administrator",
        initial_password=initial_password,
        login_note=(
            f"Share with the farmer: ID {row.farmer_id} / temporary password {initial_password}. "
            "They should change it after first login."
        ),
    )


@router.post("/{registration_id}/reject", response_model=RejectedAuditResponse)
def reject_registration(
    registration_id: int,
    body: RejectRegistrationRequest,
    db: Annotated[Session, Depends(get_db)],
    _admin: Annotated[User, Depends(get_authenticated_user)],
    _role: Annotated[str, Depends(require_role("admin"))],
) -> RejectedAuditResponse:
    try:
        row = reg_service.reject_registration(db, registration_id, body.reason)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pending registration not found") from None

    return RejectedAuditResponse(
        farmer_id=row.farmer_id,
        reason=row.rejection_reason or body.reason,
        when_label=reg_service.format_display_date(row.rejected_at or row.applied_at),
    )
