from dataclasses import dataclass
from typing import Literal

UserRole = Literal["officer", "farmer", "admin"]


@dataclass(frozen=True)
class SeedUser:
    id: str
    password_hash: str
    role: UserRole


# Demo accounts (same as frontend). Used when DATABASE_URL is unset or DB is unreachable.
SEED_USERS: tuple[SeedUser, ...] = (
    SeedUser(
        id="PCA-2024-0012",
        role="officer",
        password_hash="$2b$12$Mfywwt/uIOth0Hx2d2qvouD0Xh6OqkbUGd4PkXFCoX9hfpbW5oATe",
    ),
    SeedUser(
        id="FARMER-001",
        role="farmer",
        password_hash="$2b$12$K4sKoISKg5KPdlop3tbKIudyiRXi0M2wrYgz9czUrk3DbPj8eIi5C",
    ),
    SeedUser(
        id="PCA-ADMIN-001",
        role="admin",
        password_hash="$2b$12$dVJzsvx/Ular7h8mleU2su6XDlGayY1O9GRw0Rlh1fzKTgYEzxwma",
    ),
)


def find_user(user_id: str, role: UserRole) -> SeedUser | None:
    normalized = user_id.strip()
    for user in SEED_USERS:
        if user.id == normalized and user.role == role:
            return user
    return None
