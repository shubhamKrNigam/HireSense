from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.services.recommendations import recommend_jobs_for_candidate


router = APIRouter(
    prefix="/recommendations",
    tags=["Recommendations"],
)


@router.get("/jobs")
def get_recommended_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    recommendations = recommend_jobs_for_candidate(
        candidate_id=candidate.id,
        db=db,
    )

    return {
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "recommendation_count": len(recommendations),
        "model_version": "skill-text-experience-education-v4",
        "recommendations": recommendations,
    }