from sqlalchemy import Column, Integer, String, Text, ForeignKey
from app.db.base import Base


class Experience(Base):
    __tablename__ = "experiences"

    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(
        Integer,
        ForeignKey("candidates.id"),
        nullable=False,
    )

    company_name = Column(String(200), nullable=False)
    job_title = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)