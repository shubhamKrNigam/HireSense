from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.candidate_preference import CandidatePreference
from app.schemas.candidate_preference import (
    CandidatePreferenceResponse,
    CandidatePreferenceUpdate,
)


router = APIRouter(
    prefix="/candidate-preferences",
    tags=["Candidate Preferences"],
)


def get_current_candidate(
    current_user,
    db: Session,
):
    return (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )


@router.get(
    "/me",
    response_model=CandidatePreferenceResponse,
)
def get_my_preferences(
    current_user=Depends(require_role("candidate")),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(current_user, db)

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    preferences = (
        db.query(CandidatePreference)
        .filter(
            CandidatePreference.candidate_id == candidate.id
        )
        .first()
    )

    if not preferences:
        preferences = CandidatePreference(
            candidate_id=candidate.id,
            preferred_roles=[],
            preferred_locations=[],
            work_modes=[],
            employment_types=[],
            experience_level=None,
        )

        db.add(preferences)
        db.commit()
        db.refresh(preferences)

    return preferences


@router.put(
    "/me",
    response_model=CandidatePreferenceResponse,
)
def update_my_preferences(
    data: CandidatePreferenceUpdate,
    current_user=Depends(require_role("candidate")),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(current_user, db)

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    preferences = (
        db.query(CandidatePreference)
        .filter(
            CandidatePreference.candidate_id == candidate.id
        )
        .first()
    )

    if not preferences:
        preferences = CandidatePreference(
            candidate_id=candidate.id,
            preferred_roles=[],
            preferred_locations=[],
            work_modes=[],
            employment_types=[],
            experience_level=None,
        )
        db.add(preferences)

    preferences.preferred_roles = data.preferred_roles
    preferences.preferred_locations = data.preferred_locations
    preferences.work_modes = data.work_modes
    preferences.employment_types = data.employment_types
    preferences.experience_level = data.experience_level

    db.commit()
    db.refresh(preferences)

    return preferences