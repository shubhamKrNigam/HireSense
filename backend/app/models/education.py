from sqlalchemy import Column, Integer, String, ForeignKey
from app.db.base import Base


class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    institution = Column(String(200), nullable=False)
    degree = Column(String(150), nullable=True)
    field_of_study = Column(String(150), nullable=True)
    start_year = Column(Integer, nullable=True)
    end_year = Column(Integer, nullable=True)
    grade = Column(String(50), nullable=True)