from typing import Literal

from pydantic import BaseModel, Field

SlotType = Literal["AM", "PM"]
PriorityLevel = Literal["urgent", "high", "medium"]


class FarmOut(BaseModel):
    farmer_id: str | None = None
    name: str
    owner: str
    phone: str | None = None
    sector: str
    brgy: str
    trees: int
    status: str
    last_survey: str


class QueueItemOut(BaseModel):
    id: str
    brgy: str
    title: str
    sub: str
    conf: str
    validated: bool = False


class SurveyOut(BaseModel):
    date: str
    farm: str
    sector: str
    brgy: str
    images: int
    ai_result: str
    officer: str
    status: str


class ScheduledVisitOut(BaseModel):
    id: str
    farm: str
    owner: str
    brgy: str
    date: str
    slot: SlotType
    scheduled_by: str
    purpose: str


class BookedSlotOut(BaseModel):
    date: str
    slot: SlotType


class OfficerOut(BaseModel):
    emp_id: str
    name: str
    phone: str
    brgy: str
    farms_covered: str
    status: str
    last_active: str


class PriorityVisitOut(BaseModel):
    id: str
    farm: str
    desc: str
    level: PriorityLevel
    due: str
    assigned: str
    brgy: str
    completed: bool = False


class FarmerNotificationOut(BaseModel):
    id: str
    date_line: str
    body: str
    dot: str
    is_new: bool


class FarmerSubmissionOut(BaseModel):
    date: str
    sector: str
    tag: str
    tag_class: str
    color: str


class FarmerProfileOut(BaseModel):
    farmer_id: str
    name: str
    farm: str
    sector: str
    brgy: str
    municipality: str
    phone: str


class OfficerBootstrap(BaseModel):
    farms: list[FarmOut]
    surveys: list[SurveyOut]
    queue: list[QueueItemOut]
    scheduled_visits: list[ScheduledVisitOut]
    booked_slots: list[BookedSlotOut]
    priority_visits: list[PriorityVisitOut]
    officers: list[OfficerOut]


class AdminBootstrap(BaseModel):
    farms: list[FarmOut]
    surveys: list[SurveyOut]
    officers: list[OfficerOut]
    scheduled_visits: list[ScheduledVisitOut]


class FarmerBootstrap(BaseModel):
    profile: FarmerProfileOut | None = None
    notifications: list[FarmerNotificationOut]
    submissions: list[FarmerSubmissionOut]


class ScheduleVisitRequest(BaseModel):
    farm: str
    owner: str
    brgy: str
    date: str
    slot: SlotType
    scheduled_by: str
    purpose: str = "Registration and field validation"
    notify_farmer_id: str | None = None


class OfficerAssignRequest(BaseModel):
    brgy: str = Field(min_length=1, max_length=120)


class FarmerSubmissionCreate(BaseModel):
    date_label: str
    sector: str
    tag: str
    tag_class: Literal["green", "orange", "red"]
    color: str
    confidence_pct: int = Field(default=0, ge=0, le=100)
    uncertain: bool = False
    image_count: int = Field(default=1, ge=1, le=10)


class OfficerCreateRequest(BaseModel):
    emp_id: str = Field(min_length=3, max_length=32)
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=1, max_length=40)
    brgy: str = Field(default="Unassigned", max_length=120)
    password: str | None = Field(default=None, min_length=4, max_length=64)


class OfficerUpdateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    phone: str = Field(min_length=1, max_length=40)


class OfficerCreateResponse(BaseModel):
    officer: OfficerOut
    initial_password: str
    login_note: str


class PortalNotificationOut(BaseModel):
    id: str
    title: str
    body: str
    href: str = ""
    is_new: bool = True


class ConditionTrendOut(BaseModel):
    labels: list[str]
    healthy: list[int]
    yellowing: list[int]
    scale: list[int]
    beetle: list[int]
    scope: str
    brgy: str | None = None


class ProvincialStatsOut(BaseModel):
    healthy_pct: int
    yellowing_pct: int
    pest_pct: int
    labels: dict[str, str]
    sample_size: int


class FarmerSectorStatusOut(BaseModel):
    code: str
    status: str
    label_en: str
    label_hil: str
    color: str


class FarmerNotificationCreate(BaseModel):
    farmer_id: str
    date_line: str
    body: str
    dot_color: str = "#ea580c"
    is_new: bool = True
