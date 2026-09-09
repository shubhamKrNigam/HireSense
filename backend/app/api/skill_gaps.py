from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.services.skill_gap import (
    build_candidate_skill_gap_overview,
    build_job_skill_gap,
)


router = APIRouter(
    prefix="/skill-gaps",
    tags=["Skill Gap Intelligence"],
)


@router.get("/candidate")
def get_candidate_skill_gap_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("candidate")),
):
    """Return skill-development priorities across the candidate's strongest eligible roles."""

    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    return build_candidate_skill_gap_overview(
        candidate_id=candidate.id,
        db=db,
    )


@router.get("/candidate/job/{job_id}")
def get_candidate_job_skill_gap(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("candidate")),
):
    """Return explainable skill readiness and gaps for one job."""

    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found.",
        )

    report = build_job_skill_gap(
        candidate_id=candidate.id,
        job_id=job_id,
        db=db,
    )

    if not report.get("exists") and report.get("job_title") is None:
        raise HTTPException(
            status_code=404,
            detail="Job not found.",
        )

    return report
