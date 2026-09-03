from pydantic import BaseModel


class ApplicationBase(BaseModel):
    candidate_id: int
    job_id: int
    status: str = "applied"


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationResponse(ApplicationBase):
    id: int

    class Config:
        from_attributes = True