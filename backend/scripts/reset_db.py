"""Wipe local DB and reseed login users only (clean system).

Usage (from backend/, venv active):
  python scripts/reset_db.py
"""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from app.core.config import get_settings
from app.db.base import Base
from app.db.seed import seed_demo_users
from app.db.session import get_engine, get_session_factory


def main() -> None:
    settings = get_settings()
    engine = get_engine()
    factory = get_session_factory()
    if engine is None or factory is None:
        print("Set DATABASE_URL in backend/.env first.")
        raise SystemExit(1)

    if not str(settings.database_url or "").startswith("sqlite"):
        print("reset_db.py only supports SQLite. For Supabase, truncate tables manually.")
        raise SystemExit(1)

    db_path = ROOT / "pca_local.db"
    if db_path.is_file():
        db_path.unlink()
        print(f"Removed {db_path}")

    Base.metadata.create_all(bind=engine)
    with factory() as db:
        users = seed_demo_users(db)

    print(f"Clean database ready. Seeded {users} login user(s) (officer, farmer, admin).")
    print("No mock farms, queue, or registrations — data comes from real use.")


if __name__ == "__main__":
    main()
