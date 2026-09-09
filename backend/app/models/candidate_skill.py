from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.db.base import Base


class CandidateSkill(Base):
    __tablename__ = "candidate_skills"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False,
    )

    proficiency = Column(Float, nullable=True)

    years_used = Column(Float, nullable=True)

    source = Column(String(100), nullable=True)

    created_at = Column(
        DateTime,
        server_default="CURRENT_TIMESTAMP",
    )