from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.users import SEED_USERS, SeedUser, UserRole, find_user as find_seed_user
from app.models.user import User


def find_user(db: Session | None, user_id: str, role: UserRole) -> User | SeedUser | None:
    normalized = user_id.strip()

    if db is not None:
        row = db.scalar(
            select(User).where(
                User.id == normalized,
                User.role == role,
                User.is_active.is_(True),
            ),
        )
        if row is not None:
            return row

    return find_seed_user(normalized, role)


def user_password_hash(user: User | SeedUser) -> str:
    return user.password_hash


def user_public_id(user: User | SeedUser) -> str:
    return user.id


def user_public_role(user: User | SeedUser) -> UserRole:
    return user.role  # type: ignore[return-value]
