from pydantic import BaseModel


class CandidateBase(BaseModel):
    full_name: str
    phone: str | None = None
    location: str | None = None
    summary: str | None = None


class CandidateCreate(CandidateBase):
    user_id: int


class CandidateResponse(CandidateBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True