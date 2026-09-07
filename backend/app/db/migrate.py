"""Lightweight column patches (no Alembic)."""

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def ensure_database_columns(engine: Engine) -> None:
    patches: dict[str, list[tuple[str, str]]] = {
        "farmer_submissions": [
            ("external_id", "VARCHAR(32)"),
            ("confidence_pct", "REAL NOT NULL DEFAULT 0"),
            ("uncertain", "BOOLEAN NOT NULL DEFAULT 0"),
            ("image_count", "INTEGER NOT NULL DEFAULT 1"),
            ("majority", "TEXT NOT NULL DEFAULT ''"),
            ("breakdown_json", "TEXT NOT NULL DEFAULT '[]'"),
            ("per_photo_json", "TEXT NOT NULL DEFAULT '[]'"),
            ("recommendation_title", "TEXT NOT NULL DEFAULT ''"),
            ("recommendation_description", "TEXT NOT NULL DEFAULT ''"),
            ("recommendation_heading", "TEXT NOT NULL DEFAULT ''"),
            ("recommendation_text", "TEXT NOT NULL DEFAULT ''"),
        ],
        "surveys": [
            ("confidence_pct", "REAL NOT NULL DEFAULT 0"),
            ("majority", "TEXT NOT NULL DEFAULT ''"),
            ("breakdown_json", "TEXT NOT NULL DEFAULT '[]'"),
            ("per_photo_json", "TEXT NOT NULL DEFAULT '[]'"),
            ("recommendation_title", "TEXT NOT NULL DEFAULT ''"),
            ("recommendation_description", "TEXT NOT NULL DEFAULT ''"),
            ("recommendation_heading", "TEXT NOT NULL DEFAULT ''"),
            ("recommendation_text", "TEXT NOT NULL DEFAULT ''"),
        ],
        "visit_logs": [
            ("farmer_confirmed", "BOOLEAN"),
            ("farmer_rating", "INTEGER"),
            ("farmer_comment", "TEXT NOT NULL DEFAULT ''"),
            ("farmer_report", "TEXT NOT NULL DEFAULT ''"),
            ("admin_feedback", "TEXT NOT NULL DEFAULT ''"),
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


def ensure_sqlite_columns(engine: Engine) -> None:
    ensure_database_columns(engine)
