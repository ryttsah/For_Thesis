from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_authenticated_user
from app.core.security import create_access_token, verify_password
from app.data.users import find_user as find_seed_user
from app.db.session import get_db, get_optional_db
from app.models.domain import Officer
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.users import find_user, user_password_hash, user_public_id, user_public_role

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(
    body: LoginRequest,
    db: Annotated[Session | None, Depends(get_optional_db)],
) -> LoginResponse:
    user = find_user(db, body.id, body.role)
    if user is None or not verify_password(body.password, user_password_hash(user)):
        seed_user = find_seed_user(body.id, body.role)
        if seed_user is not None and verify_password(body.password, seed_user.password_hash):
            user = seed_user
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="That ID or password doesn't match. Check and try again.",
            )

    user_id = user_public_id(user)
    role = user_public_role(user)
    token = create_access_token(subject=user_id, role=role)
    return LoginResponse(access_token=token, role=role, user_id=user_id)


@router.get("/me")
def me(
    user: Annotated[User, Depends(get_authenticated_user)],
    db: Annotated[Session, Depends(get_db)],
) -> dict[str, str | None]:
    payload: dict[str, str | None] = {
        "user_id": user.id,
        "role": user.role,
        "display_name": user.display_name or user.id,
        "assigned_brgy": None,
    }
    if user.role == "officer":
        officer = db.get(Officer, user.id)
        if officer and officer.brgy not in ("Unassigned", "—", ""):
            payload["assigned_brgy"] = officer.brgy
    return payload
