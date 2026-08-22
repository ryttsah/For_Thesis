from typing import Literal

from pydantic import BaseModel, Field

UserRole = Literal["officer", "farmer", "admin"]


class LoginRequest(BaseModel):
    id: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    role: UserRole


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
