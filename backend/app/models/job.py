from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from app.db.base import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(
        Integer,
        ForeignKey("companies.id"),
        nullable=False
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    location = Column(String(200), nullable=True)
    employment_type = Column(String(50), nullable=True)
    work_mode = Column(String(30), nullable=True)

    experience_min = Column(Float, nullable=True)
    experience_max = Column(Float, nullable=True)
    experience_level = Column(String(50), nullable=True)

    salary_min = Column(Float, nullable=True)
    salary_max = Column(Float, nullable=True)

    application_url = Column(String(500), nullable=True)

    # Education requirements
    minimum_degree = Column(String(100), nullable=True)
    required_field_of_study = Column(String(200), nullable=True)
    minimum_grade = Column(Float, nullable=True)

    # Job lifecycle
    status = Column(
        String(30),
        nullable=False,
        default="open"
    )

    posted_at = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime,
        server_default="CURRENT_TIMESTAMP"
    )
