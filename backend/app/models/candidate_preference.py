from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class CandidatePreference(Base):
    __tablename__ = "candidate_preferences"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id"),
        unique=True,
        nullable=False,
        index=True,
    )

    preferred_roles: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    preferred_locations: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    work_modes: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    employment_types: Mapped[list[str]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    experience_level: Mapped[str | None] = mapped_column(
        nullable=True,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        server_default="CURRENT_TIMESTAMP",
    )