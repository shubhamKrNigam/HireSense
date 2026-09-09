from sqlalchemy import Column, ForeignKey, Integer, String, Text
from app.db.base import Base


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    company_name = Column(
        String(255),
        nullable=False,
    )

    job_title = Column(
        String(255),
        nullable=False,
    )

    employment_type = Column(
        String(100),
        nullable=True,
    )

    location = Column(
        String(255),
        nullable=True,
    )

    start_date = Column(
        String(20),
        nullable=True,
    )

    end_date = Column(
        String(20),
        nullable=True,
    )

    description = Column(
        Text,
        nullable=True,
    )