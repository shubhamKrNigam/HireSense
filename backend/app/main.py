from fastapi import FastAPI

from app.db.base import Base
from app.db.session import engine

# Import all models so SQLAlchemy registers their tables
from app.models.user import User
from app.models.candidate import Candidate
from app.models.company import Company
from app.models.job import Job
from app.models.skill import Skill
from app.models.candidate_skill import CandidateSkill
from app.models.job_skill import JobSkill
from app.models.education import Education
from app.models.experience import Experience
from app.models.project import Project
from app.models.application import Application

app = FastAPI(
    title="HireSense API",
    description="AI-powered recruitment and job matching platform",
    version="0.1.0",
)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "Welcome to HireSense API"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }