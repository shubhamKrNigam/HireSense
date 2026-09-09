from datetime import datetime

from pydantic import BaseModel


class MatchResultResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    overall_score: float
    skill_score: float | None = None
    text_similarity_score: float | None = None
    experience_score: float | None = None
    education_score: float | None = None
    created_at: datetime | None = None
    model_version: str | None = None

    class Config:
        from_attributes = True