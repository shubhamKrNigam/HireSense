from datetime import datetime
from typing import Literal

from pydantic import BaseModel


ApplicationStatus = Literal[
    "applied",
    "shortlisted",
    "interview",
    "rejected",
    "selected",
]


class ApplicationCreate(BaseModel):
    job_id: int


class ApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    job_id: int
    status: ApplicationStatus
    applied_at: datetime | None = None
    company_name: str | None = None


class ApplicationStatusUpdate(BaseModel):
    status: ApplicationStatus


class RecruiterApplicationResponse(BaseModel):
    id: int
    candidate_id: int
    candidate_name: str
    job_id: int
    job_title: str
    company_name: str | None = None
    status: ApplicationStatus
    applied_at: datetime | None = None

    match_score: float
    eligible: bool
    eligibility_reasons: list[str]

    skill_score: float
    text_similarity_score: float
    experience_score: float
    education_score: float
    candidate_experience_years: float

    matched_skills: list[str]
    missing_skills: list[str]
    missing_required_skills: list[str]
