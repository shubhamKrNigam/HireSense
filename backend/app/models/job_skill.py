from sqlalchemy import Column, Float, ForeignKey, Integer

from app.db.base import Base


class JobSkill(Base):
    __tablename__ = "job_skills"

    id = Column(Integer, primary_key=True, index=True)

    job_id = Column(
        Integer,
        ForeignKey("jobs.id"),
        nullable=False,
    )

    skill_id = Column(
        Integer,
        ForeignKey("skills.id"),
        nullable=False,
    )

    importance = Column(
        Float,
        default=1.0,
        nullable=True,
    )

    required = Column(
        Integer,
        default=0,
        nullable=True,
    )