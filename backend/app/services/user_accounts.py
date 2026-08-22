"""Create login users when admins approve farmers or add officers."""

import re
import secrets

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.user import User


def _digits_from_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    return digits[-6:] if len(digits) >= 6 else ""


def default_farmer_password(farmer_id: str, phone: str) -> str:
    tail = _digits_from_phone(phone)
    if tail:
        return f"Pca{tail}!"
    suffix = farmer_id.split("-")[-1]
    return f"PcaFarmer{suffix}!"


def default_officer_password(emp_id: str) -> str:
    digits = re.sub(r"\D", "", emp_id)
    suffix = digits[-4:].zfill(4) if digits else secrets.token_hex(2)[:4].upper()
    return f"PCAOFFICER{suffix}"


def ensure_user(
    db: Session,
    *,
    user_id: str,
    role: str,
    password: str,
    display_name: str | None = None,
) -> tuple[User, str]:
    """Create user if missing; returns (user, plaintext_password)."""
    existing = db.get(User, user_id)
    if existing is not None:
        return existing, password

    row = User(
        id=user_id,
        password_hash=hash_password(password),
        role=role,
        display_name=display_name,
        is_active=True,
    )
    db.add(row)
    return row, password
