from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.db.base import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(String(500), nullable=True)
    project_url = Column(String(500), nullable=True)