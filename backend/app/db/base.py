from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


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