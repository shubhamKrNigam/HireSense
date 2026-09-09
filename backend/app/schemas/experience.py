from pydantic import BaseModel


class ExperienceBase(BaseModel):
    company_name: str
    job_title: str
    employment_type: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class ExperienceCreate(ExperienceBase):
    candidate_id: int


class ExperienceUpdate(BaseModel):
    company_name: str | None = None
    job_title: str | None = None
    employment_type: str | None = None
    location: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class ExperienceResponse(ExperienceBase):
    id: int
    candidate_id: int

    class Config:
        from_attributes = True