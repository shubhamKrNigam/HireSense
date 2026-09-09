from sqlalchemy import Column, ForeignKey, Integer, String, Float

from app.db.base import Base


class Education(Base):
    __tablename__ = "educations"

    id = Column(Integer, primary_key=True, index=True)

    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    education_type = Column(
        String(50),
        nullable=True,
    )

    institution = Column(
        String(255),
        nullable=False,
    )

    degree = Column(
        String(255),
        nullable=True,
    )

    field_of_study = Column(
        String(255),
        nullable=True,
    )

    score_type = Column(
        String(30),
        nullable=True,
    )

    start_year = Column(
        Integer,
        nullable=True,
    )

    end_year = Column(
        Integer,
        nullable=True,
    )

    grade = Column(
        Float,
        nullable=True,
    )