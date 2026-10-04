from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db.base import Base
from app.db.session import engine

# =========================================================
# MODEL IMPORTS
# =========================================================
# Import all models so SQLAlchemy registers their tables

from app.models.user import User
from app.models.candidate import Candidate
from app.models.company import Company
from app.models.job import Job
from app.models.education import Education
from app.models.skill import Skill
from app.models.candidate_skill import CandidateSkill
from app.models.job_skill import JobSkill
from app.models.experience import Experience
from app.models.project import Project
from app.models.resume import Resume
from app.models.application import Application
from app.models.match_result import MatchResult
from app.models.candidate_preference import CandidatePreference
from app.models.notification import Notification


# =========================================================
# API ROUTER IMPORTS
# =========================================================

from app.api.users import router as users_router
from app.api.auth import router as auth_router
from app.api.candidates import router as candidates_router
from app.api.companies import router as companies_router
from app.api.jobs import router as jobs_router
from app.api.skills import router as skills_router
from app.api.candidate_skills import router as candidate_skills_router
from app.api.job_skills import router as job_skills_router
from app.api.applications import router as applications_router
from app.api.educations import router as educations_router
from app.api.experiences import router as experiences_router
from app.api.projects import router as projects_router
from app.api.resumes import router as resumes_router
from app.api.matching import router as matching_router
from app.api.recommendations import router as recommendations_router
from app.api.analytics import router as analytics_router

from app.api.candidate_preferences import (
    router as candidate_preferences_router,
)

from app.api.account import (
    router as account_router,
)

from app.api.skill_gaps import (
    router as skill_gaps_router,
)

from app.api.placement_officer import (
    router as placement_officer_router,
)

from app.api.notifications import (
    router as notifications_router,
)


# =========================================================
# APPLICATION
# =========================================================

app = FastAPI(
    title="HireSense API",
    description="AI-powered recruitment and job matching platform",
    version="0.1.0",
)


# =========================================================
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# API ROUTERS
# =========================================================

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(candidates_router)
app.include_router(companies_router)
app.include_router(jobs_router)
app.include_router(skills_router)
app.include_router(candidate_skills_router)
app.include_router(job_skills_router)
app.include_router(applications_router)
app.include_router(educations_router)
app.include_router(experiences_router)
app.include_router(projects_router)
app.include_router(resumes_router)
app.include_router(matching_router)
app.include_router(recommendations_router)
app.include_router(analytics_router)
app.include_router(candidate_preferences_router)
app.include_router(account_router)
app.include_router(skill_gaps_router)
app.include_router(placement_officer_router)
app.include_router(notifications_router)


# =========================================================
# DATABASE INITIALIZATION
# =========================================================

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)


# =========================================================
# ROOT / HEALTH
# =========================================================

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