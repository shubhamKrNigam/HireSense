from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String

from app.db.base import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
    )

    overall_score = Column(
        Float,
        nullable=False,
    )

    skill_score = Column(
        Float,
        nullable=True,
    )

    text_similarity_score = Column(
        Float,
        nullable=True,
    )

    experience_score = Column(
        Float,
        nullable=True,
    )

    education_score = Column(
        Float,
        nullable=True,
    )

    created_at = Column(
        DateTime,
        server_default="CURRENT_TIMESTAMP",
    )

    model_version = Column(
        String(100),
        nullable=True,
    )