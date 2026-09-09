from datetime import datetime

from pydantic import BaseModel, Field


class CandidateSkillBase(BaseModel):
    candidate_id: int
    skill_id: int | None = None
    skill_name: str | None = None
    proficiency: float | None = Field(
        default=None,
        ge=0,
        le=100,
    )
    years_used: float | None = Field(
        default=None,
        ge=0,
    )
    source: str | None = None


class CandidateSkillCreate(CandidateSkillBase):
    pass


class CandidateSkillResponse(BaseModel):
    id: int
    candidate_id: int
    skill_id: int
    proficiency: float | None = None
    years_used: float | None = None
    source: str | None = None
    created_at: datetime | None = None

    class Config:
        from_attributes = True