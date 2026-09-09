from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, model_validator


WorkMode = Literal["On-site", "Hybrid", "Remote"]


class JobBase(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    description: str = Field(..., min_length=10)

    location: str | None = None
    employment_type: str | None = None
    work_mode: WorkMode | None = None

    experience_min: float | None = Field(default=None, ge=0)
    experience_max: float | None = Field(default=None, ge=0)
    experience_level: str | None = None

    salary_min: float | None = Field(default=None, ge=0)
    salary_max: float | None = Field(default=None, ge=0)

    application_url: HttpUrl | None = None

    # Education requirements
    minimum_degree: str | None = None
    required_field_of_study: str | None = None
    minimum_grade: float | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_ranges(self):
        if (
            self.experience_min is not None
            and self.experience_max is not None
            and self.experience_max < self.experience_min
        ):
            raise ValueError(
                "Maximum experience cannot be less than minimum experience"
            )

        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError(
                "Maximum salary cannot be less than minimum salary"
            )

        return self


class JobCreate(JobBase):
    company_id: int


class JobUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    description: str | None = Field(default=None, min_length=10)

    location: str | None = None
    employment_type: str | None = None
    work_mode: WorkMode | None = None

    experience_min: float | None = Field(default=None, ge=0)
    experience_max: float | None = Field(default=None, ge=0)
    experience_level: str | None = None

    salary_min: float | None = Field(default=None, ge=0)
    salary_max: float | None = Field(default=None, ge=0)

    application_url: HttpUrl | None = None

    minimum_degree: str | None = None
    required_field_of_study: str | None = None
    minimum_grade: float | None = Field(default=None, ge=0)

    status: str | None = None

    @model_validator(mode="after")
    def validate_ranges(self):
        if (
            self.experience_min is not None
            and self.experience_max is not None
            and self.experience_max < self.experience_min
        ):
            raise ValueError(
                "Maximum experience cannot be less than minimum experience"
            )

        if (
            self.salary_min is not None
            and self.salary_max is not None
            and self.salary_max < self.salary_min
        ):
            raise ValueError(
                "Maximum salary cannot be less than minimum salary"
            )

        if self.status is not None and self.status not in {
            "open",
            "closed",
            "draft",
        }:
            raise ValueError(
                "Status must be open, closed, or draft"
            )

        return self


class JobResponse(JobBase):
    id: int
    company_id: int
    status: str
    posted_at: datetime | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True
