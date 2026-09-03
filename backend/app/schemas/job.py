from pydantic import BaseModel, HttpUrl


class JobBase(BaseModel):
    title: str
    description: str | None = None
    location: str | None = None
    employment_type: str | None = None
    experience_level: str | None = None
    salary_min: float | None = None
    salary_max: float | None = None
    application_url: HttpUrl | None = None


class JobCreate(JobBase):
    company_id: int


class JobResponse(JobBase):
    id: int
    company_id: int

    class Config:
        from_attributes = True