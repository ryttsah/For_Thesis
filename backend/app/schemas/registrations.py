from typing import Literal

from pydantic import BaseModel, Field

AreaUnit = Literal["ha", "sqm"]
RegistrationStatus = Literal["pending", "approved", "rejected"]


class RegistrationCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=80)
    middle_initial: str = Field(default="", max_length=10)
    last_name: str = Field(min_length=1, max_length=80)
    farm_address: str = Field(default="", max_length=255)
    brgy: str = Field(min_length=1, max_length=120)
    municipality: str = Field(min_length=1, max_length=120)
    province: str = Field(default="Negros Occidental", max_length=120)
    area_hectares: float = Field(gt=0)
    area_input_unit: AreaUnit = "ha"
    area_input_value: float = Field(gt=0)
    farm_status: str = Field(min_length=1, max_length=40)
    phone: str = Field(min_length=1, max_length=40)
    alt_phone: str = Field(default="", max_length=40)
    reg_purpose_type: str = Field(default="registration_only", max_length=40)
    reg_purpose_other_text: str = Field(default="", max_length=255)


class RegistrationResponse(BaseModel):
    id: str
    farmer_id: str
    applied: str
    first_name: str
    middle_initial: str
    last_name: str
    farm_address: str
    brgy: str
    municipality: str
    province: str
    area_hectares: float
    area_input_unit: AreaUnit
    area_input_value: float
    farm_status: str
    phone: str
    alt_phone: str
    reg_purpose_type: str
    reg_purpose_other_text: str
    status: RegistrationStatus


class RegistrationCreateResponse(BaseModel):
    farmer_id: str
    message: str


class ApprovedFarmerResponse(BaseModel):
    name: str
    farmer_id: str
    brgy: str
    approved_date: str
    approved_by: str
    initial_password: str | None = None
    login_note: str | None = None


class RejectedAuditResponse(BaseModel):
    farmer_id: str
    reason: str
    when_label: str


class RejectRegistrationRequest(BaseModel):
    reason: str = Field(min_length=1, max_length=500)
