"""Lightweight SQLite column patches (no Alembic)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_sqlite_columns(engine: Engine) -> None:
    if not str(engine.url).startswith("sqlite"):
        return

    patches: dict[str, list[tuple[str, str]]] = {
        "farmer_submissions": [
            ("confidence_pct", "REAL NOT NULL DEFAULT 0"),
            ("uncertain", "BOOLEAN NOT NULL DEFAULT 0"),
            ("image_count", "INTEGER NOT NULL DEFAULT 1"),
        ],
    }

    insp = inspect(engine)
    with engine.begin() as conn:
        for table, columns in patches.items():
            if table not in insp.get_table_names():
                continue
            existing = {c["name"] for c in insp.get_columns(table)}
            for name, ddl in columns:
                if name in existing:
                    continue
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))
