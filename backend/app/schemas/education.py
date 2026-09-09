from pydantic import BaseModel, Field


class EducationBase(BaseModel):
    education_type: str | None = None

    institution: str

    degree: str | None = None

    field_of_study: str | None = None

    score_type: str | None = None

    start_year: int | None = Field(
        default=None,
        ge=1900,
        le=2100,
    )

    end_year: int | None = Field(
        default=None,
        ge=1900,
        le=2100,
    )

    grade: float | None = Field(
        default=None,
        ge=0,
    )


class EducationCreate(EducationBase):
    candidate_id: int


class EducationUpdate(BaseModel):
    education_type: str | None = None

    institution: str | None = None

    degree: str | None = None

    field_of_study: str | None = None

    score_type: str | None = None

    start_year: int | None = Field(
        default=None,
        ge=1900,
        le=2100,
    )

    end_year: int | None = Field(
        default=None,
        ge=1900,
        le=2100,
    )

    grade: float | None = Field(
        default=None,
        ge=0,
    )


class EducationResponse(EducationBase):
    id: int
    candidate_id: int

    class Config:
        from_attributes = True