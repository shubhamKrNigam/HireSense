from sqlalchemy import Column, ForeignKey, Integer, String, Text
from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False
    )

    project_name = Column(String(255), nullable=False)
    project_type = Column(String(100), nullable=True)
    technologies = Column(Text, nullable=True)
    project_link = Column(String(500), nullable=True)

    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)

    description = Column(Text, nullable=True)