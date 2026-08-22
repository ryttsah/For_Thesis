"""Create tables (if needed) and seed demo users. Usage: python scripts/seed_db.py"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.db.base import Base
from app.db.seed import seed_demo_registrations, seed_demo_users
from app.db.seed_domain import seed_domain_data
from app.db.session import get_engine, get_session_factory


def main() -> None:
    engine = get_engine()
    factory = get_session_factory()
    if engine is None or factory is None:
        print("Set DATABASE_URL in backend/.env first.")
        raise SystemExit(1)

    Base.metadata.create_all(bind=engine)
    with factory() as db:
        users = seed_demo_users(db)
        registrations = seed_demo_registrations(db)
        domain_rows = seed_domain_data(db)
    print(
        f"Seed complete. Inserted {users} user(s), {registrations} registration(s), "
        f"{domain_rows} domain row(s).",
    )


if __name__ == "__main__":
    main()
