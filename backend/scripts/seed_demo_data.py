"""Add HTML-mockup demo rows to an existing database (optional).

Usage: python scripts/seed_demo_data.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.db.seed import seed_demo_registrations, seed_demo_users
from app.db.seed_domain import seed_domain_data
from app.db.session import get_session_factory


def main() -> None:
    factory = get_session_factory()
    if factory is None:
        print("Set DATABASE_URL in backend/.env first.")
        raise SystemExit(1)

    with factory() as db:
        users = seed_demo_users(db)
        registrations = seed_demo_registrations(db)
        domain_rows = seed_domain_data(db)

    print(
        f"Demo data added: {users} user(s), {registrations} registration(s), "
        f"{domain_rows} domain row(s).",
    )


if __name__ == "__main__":
    main()
