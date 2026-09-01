from dataclasses import dataclass
from typing import Literal

UserRole = Literal["officer", "farmer", "admin"]


@dataclass(frozen=True)
class SeedUser:
    id: str
    password_hash: str
    role: UserRole


# Initial system account. Additional users should come from the database.
SEED_USERS: tuple[SeedUser, ...] = (
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
