from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FarmerRegistration(Base):
    __tablename__ = "farmer_registrations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    farmer_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending", index=True)
    applied_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    first_name: Mapped[str] = mapped_column(String(80), nullable=False)
    middle_initial: Mapped[str] = mapped_column(String(10), nullable=False, default="")
    last_name: Mapped[str] = mapped_column(String(80), nullable=False)
    farm_address: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    brgy: Mapped[str] = mapped_column(String(120), nullable=False)
    municipality: Mapped[str] = mapped_column(String(120), nullable=False)
    province: Mapped[str] = mapped_column(String(120), nullable=False, default="Negros Occidental")
    area_hectares: Mapped[float] = mapped_column(Float, nullable=False)
    area_input_unit: Mapped[str] = mapped_column(String(8), nullable=False, default="ha")
    area_input_value: Mapped[float] = mapped_column(Float, nullable=False)
    farm_status: Mapped[str] = mapped_column(String(40), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    alt_phone: Mapped[str] = mapped_column(String(40), nullable=False, default="")
    reg_purpose_type: Mapped[str] = mapped_column(String(40), nullable=False, default="registration_only")
    reg_purpose_other_text: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(120), nullable=True)
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
