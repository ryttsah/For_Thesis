from sqlalchemy import Boolean, Float, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Farm(Base):
    __tablename__ = "farms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    owner: Mapped[str] = mapped_column(String(80), nullable=False)
    sector: Mapped[str] = mapped_column(String(40), nullable=False)
    brgy: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    trees: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="pending")
    last_survey: Mapped[str] = mapped_column(String(40), nullable=False, default="—")


class ValidationQueueItem(Base):
    __tablename__ = "validation_queue"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    brgy: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    sub: Mapped[str] = mapped_column(String(200), nullable=False)
    conf: Mapped[str] = mapped_column(String(16), nullable=False)
    validated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class Survey(Base):
    __tablename__ = "surveys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    survey_date: Mapped[str] = mapped_column(String(40), nullable=False)
    farm: Mapped[str] = mapped_column(String(120), nullable=False)
    sector: Mapped[str] = mapped_column(String(40), nullable=False)
    brgy: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    images: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_result: Mapped[str] = mapped_column(String(120), nullable=False)
    officer: Mapped[str] = mapped_column(String(80), nullable=False, default="—")
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    confidence_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    majority: Mapped[str] = mapped_column(Text, nullable=False, default="")
    breakdown_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    per_photo_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    recommendation_title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation_heading: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation_text: Mapped[str] = mapped_column(Text, nullable=False, default="")


class ScheduledVisit(Base):
    __tablename__ = "scheduled_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    farm: Mapped[str] = mapped_column(String(120), nullable=False)
    owner: Mapped[str] = mapped_column(String(80), nullable=False)
    brgy: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    visit_date: Mapped[str] = mapped_column(String(16), nullable=False)
    slot: Mapped[str] = mapped_column(String(4), nullable=False)
    scheduled_by: Mapped[str] = mapped_column(String(80), nullable=False)
    purpose: Mapped[str] = mapped_column(Text, nullable=False, default="")


class VisitLog(Base):
    """Officer field-visit outcome and the two-way accountability feedback."""

    __tablename__ = "visit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    scheduled_visit_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False, index=True)
    farm: Mapped[str] = mapped_column(String(120), nullable=False)
    brgy: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    officer_id: Mapped[str] = mapped_column(String(32), nullable=False)
    officer_name: Mapped[str] = mapped_column(String(80), nullable=False)
    visited: Mapped[bool] = mapped_column(Boolean, nullable=False)
    officer_comment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    not_visited_reason: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recorded_at: Mapped[str] = mapped_column(String(40), nullable=False)
    farmer_confirmed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    farmer_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)
    farmer_comment: Mapped[str] = mapped_column(Text, nullable=False, default="")
    farmer_report: Mapped[str] = mapped_column(Text, nullable=False, default="")
    admin_feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    admin_rating: Mapped[int | None] = mapped_column(Integer, nullable=True)


class BookedSlot(Base):
    __tablename__ = "booked_slots"
    __table_args__ = (UniqueConstraint("visit_date", "slot", name="uq_booked_slot"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visit_date: Mapped[str] = mapped_column(String(16), nullable=False)
    slot: Mapped[str] = mapped_column(String(4), nullable=False)


class Officer(Base):
    __tablename__ = "officers"

    emp_id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    phone: Mapped[str] = mapped_column(String(40), nullable=False)
    brgy: Mapped[str] = mapped_column(String(120), nullable=False)
    farms_covered: Mapped[str] = mapped_column(String(16), nullable=False, default="—")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Active")
    last_active: Mapped[str] = mapped_column(String(20), nullable=False, default="—")


class PriorityVisit(Base):
    __tablename__ = "priority_visits"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    farm: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    level: Mapped[str] = mapped_column(String(16), nullable=False)
    due_label: Mapped[str] = mapped_column(String(32), nullable=False)
    assigned: Mapped[str] = mapped_column(String(80), nullable=False, default="—")
    brgy: Mapped[str] = mapped_column(String(120), nullable=False, index=True)
    completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class FarmerNotification(Base):
    __tablename__ = "farmer_notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    farmer_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    date_line: Mapped[str] = mapped_column(String(80), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    dot_color: Mapped[str] = mapped_column(String(16), nullable=False, default="#166534")
    is_new: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class FarmerSubmission(Base):
    __tablename__ = "farmer_submissions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    external_id: Mapped[str | None] = mapped_column(String(32), unique=True, nullable=True)
    farmer_id: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    date_label: Mapped[str] = mapped_column(Text, nullable=False)
    sector: Mapped[str] = mapped_column(String(8), nullable=False)
    tag: Mapped[str] = mapped_column(Text, nullable=False)
    tag_class: Mapped[str] = mapped_column(String(16), nullable=False)
    color: Mapped[str] = mapped_column(String(16), nullable=False)
    confidence_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    uncertain: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    image_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    majority: Mapped[str] = mapped_column(Text, nullable=False, default="")
    breakdown_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    per_photo_json: Mapped[str] = mapped_column(Text, nullable=False, default="[]")
    recommendation_title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation_description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation_heading: Mapped[str] = mapped_column(Text, nullable=False, default="")
    recommendation_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
