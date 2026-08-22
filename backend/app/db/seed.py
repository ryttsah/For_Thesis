from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.users import SEED_USERS
from app.db.base import Base
from app.db.session import get_engine
from app.models.farmer_registration import FarmerRegistration
from app.models.user import User
DEMO_DISPLAY_NAMES: dict[str, str] = {
    "PCA-2024-0012": "M. Aguilar",
    "FARMER-001": "Juan Espinosa",
    "PCA-ADMIN-001": "PCA Administrator",
}


def seed_demo_users(db: Session) -> int:
    """Insert demo users if missing. Returns number of rows inserted."""
    inserted = 0
    for seed in SEED_USERS:
        exists = db.scalar(select(User.id).where(User.id == seed.id))
        if exists:
            continue
        db.add(
            User(
                id=seed.id,
                password_hash=seed.password_hash,
                role=seed.role,
                display_name=DEMO_DISPLAY_NAMES.get(seed.id),
                is_active=True,
            ),
        )
        inserted += 1
    if inserted:
        db.commit()
    return inserted


PENDING_REGISTRATION_SEEDS: tuple[dict, ...] = (
    {
        "farmer_id": "FARMER-045",
        "first_name": "Maria",
        "middle_initial": "L",
        "last_name": "Santos",
        "farm_address": "Sitio Malihao",
        "brgy": "Brgy. Conception",
        "municipality": "Talisay City",
        "area_hectares": 1.8,
        "area_input_unit": "ha",
        "area_input_value": 1.8,
        "farm_status": "Bearing",
        "phone": "0917 555 0145",
        "reg_purpose_type": "registration_only",
    },
    {
        "farmer_id": "FARMER-046",
        "first_name": "Roberto",
        "middle_initial": "A",
        "last_name": "Lim",
        "farm_address": "Phase 2, Mandalagan ridge",
        "brgy": "Brgy. Mandalagan",
        "municipality": "Bacolod City (Capital)",
        "area_hectares": 0.9,
        "area_input_unit": "ha",
        "area_input_value": 0.9,
        "farm_status": "Bearing",
        "phone": "0926 555 0201",
        "reg_purpose_type": "other",
        "reg_purpose_other_text": "Fertilizer advisory visit",
    },
    {
        "farmer_id": "FARMER-047",
        "first_name": "Ana",
        "middle_initial": "R",
        "last_name": "Reyes",
        "farm_address": "Hda. Granada boundary",
        "brgy": "Brgy. Granada",
        "municipality": "Bago City",
        "area_hectares": 2.1,
        "area_input_unit": "ha",
        "area_input_value": 2.1,
        "farm_status": "Non-bearing",
        "phone": "0998 555 0332",
        "alt_phone": "0998 555 0333",
        "reg_purpose_type": "registration_only",
    },
    {
        "farmer_id": "FARMER-048",
        "first_name": "Carlos",
        "middle_initial": "D",
        "last_name": "Delos Reyes",
        "farm_address": "Upper Alangilan coconut roll",
        "brgy": "Brgy. Alangilan",
        "municipality": "Bago City",
        "area_hectares": 3.4,
        "area_input_unit": "ha",
        "area_input_value": 3.4,
        "farm_status": "Bearing",
        "phone": "0919 555 0408",
        "reg_purpose_type": "other",
        "reg_purpose_other_text": "Neighbor reported beetle activity",
    },
)

APPROVED_REGISTRATION_SEEDS: tuple[dict, ...] = (
    {
        "farmer_id": "FARMER-042",
        "first_name": "Elena",
        "last_name": "Ramos",
        "brgy": "Brgy. Mandalagan",
        "approved_by": "PCA Administrator",
    },
    {
        "farmer_id": "FARMER-043",
        "first_name": "Paolo",
        "last_name": "Mendoza",
        "brgy": "Brgy. Conception",
        "approved_by": "PCA Administrator",
    },
    {
        "farmer_id": "FARMER-044",
        "first_name": "Sofia",
        "last_name": "Cruz",
        "brgy": "Brgy. Granada",
        "approved_by": "PCA Administrator",
    },
)


def seed_demo_registrations(db: Session) -> int:
    inserted = 0
    for item in PENDING_REGISTRATION_SEEDS:
        exists = db.scalar(
            select(FarmerRegistration.farmer_id).where(
                FarmerRegistration.farmer_id == item["farmer_id"],
            ),
        )
        if exists:
            continue
        db.add(
            FarmerRegistration(
                status="pending",
                applied_at=datetime(2026, 5, 7, tzinfo=UTC),
                province="Negros Occidental",
                alt_phone=item.get("alt_phone", ""),
                reg_purpose_other_text=item.get("reg_purpose_other_text", ""),
                reg_purpose_type=item.get("reg_purpose_type", "registration_only"),
                farmer_id=item["farmer_id"],
                first_name=item["first_name"],
                middle_initial=item.get("middle_initial", ""),
                last_name=item["last_name"],
                farm_address=item.get("farm_address", ""),
                brgy=item["brgy"],
                municipality=item["municipality"],
                area_hectares=item["area_hectares"],
                area_input_unit=item.get("area_input_unit", "ha"),
                area_input_value=item["area_input_value"],
                farm_status=item["farm_status"],
                phone=item["phone"],
            ),
        )
        inserted += 1

    for item in APPROVED_REGISTRATION_SEEDS:
        exists = db.scalar(
            select(FarmerRegistration.farmer_id).where(
                FarmerRegistration.farmer_id == item["farmer_id"],
            ),
        )
        if exists:
            continue
        db.add(
            FarmerRegistration(
                status="approved",
                applied_at=datetime(2026, 5, 5, tzinfo=UTC),
                approved_at=datetime(2026, 5, 5, tzinfo=UTC),
                municipality="Negros Occidental",
                province="Negros Occidental",
                farm_address="",
                middle_initial="",
                area_hectares=1.0,
                area_input_unit="ha",
                area_input_value=1.0,
                farm_status="Bearing",
                phone="—",
                reg_purpose_type="registration_only",
                **item,
            ),
        )
        inserted += 1

    if inserted:
        db.commit()
    return inserted


def init_local_database(*, seed_demo_data: bool = False) -> None:
    """Create tables and seed login users. Optional mock domain data for demos."""
    engine = get_engine()
    if engine is None:
        raise RuntimeError("DATABASE_URL is not configured")

    from app.db.session import get_session_factory

    Base.metadata.create_all(bind=engine)
    from app.db.migrate import ensure_sqlite_columns

    ensure_sqlite_columns(engine)
    factory = get_session_factory()
    if factory is None:
        raise RuntimeError("Session factory unavailable")

    with factory() as db:
        seed_demo_users(db)
        if seed_demo_data:
            seed_demo_registrations(db)
            from app.db.seed_domain import seed_domain_data

            seed_domain_data(db)
