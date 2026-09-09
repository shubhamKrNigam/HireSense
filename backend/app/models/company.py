from sqlalchemy import Column, ForeignKey, Integer, String
from app.db.base import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    industry = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    website = Column(String(500), nullable=True)
    created_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )