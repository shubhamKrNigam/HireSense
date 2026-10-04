from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class UserBase(BaseModel):
    name: str
    email: EmailStr


class CompanyRegistration(BaseModel):
    name: str = Field(..., min_length=1)
    industry: str | None = None
    location: str | None = None
    website: HttpUrl | None = None


class UserCreate(UserBase):
    role: Literal["candidate", "recruiter"]
    password: str

    # -----------------------------------------------------
    # Recruiter-specific registration fields
    # -----------------------------------------------------

    position: str | None = None
    company: CompanyRegistration | None = None


class UserResponse(UserBase):
    id: int
    role: str
    position: str | None = None
    approval_status: str

    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True