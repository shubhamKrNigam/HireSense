from pydantic import BaseModel, Field


class JobSkillBase(BaseModel):
    job_id: int
    skill_id: int
    importance: float = Field(
        default=1.0,
        ge=0,
    )
    required: bool = False


class JobSkillCreate(JobSkillBase):
    pass


class JobSkillUpdate(BaseModel):
    skill_id: int | None = None
    importance: float | None = Field(
        default=None,
        ge=0,
    )
    required: bool | None = None


class JobSkillResponse(JobSkillBase):
    id: int

    class Config:
        from_attributes = True