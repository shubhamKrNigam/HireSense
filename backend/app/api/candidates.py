from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.candidate import (
    CandidateCreate,
    CandidateResponse,
    CandidateUpdate,
)

router = APIRouter(
    prefix="/candidates",
    tags=["Candidates"],
)


@router.post(
    "/",
    response_model=CandidateResponse,
    status_code=201,
)
def create_candidate(
    candidate: CandidateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if candidate.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only create a profile for your own user account",
        )

    existing_candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )

    if existing_candidate:
        raise HTTPException(
            status_code=400,
            detail="Candidate profile already exists for this user",
        )

    new_candidate = Candidate(
        user_id=current_user.id,
        full_name=candidate.full_name,
        phone=candidate.phone,
        location=candidate.location,
        summary=candidate.summary,
    )

    db.add(new_candidate)
    db.commit()
    db.refresh(new_candidate)

    return new_candidate


@router.get(
    "/me",
    response_model=CandidateResponse,
)
def get_my_candidate_profile(
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

    return candidate


@router.put(
    "/me",
    response_model=CandidateResponse,
)
def update_my_candidate_profile(
    candidate_data: CandidateUpdate,
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

    if candidate_data.full_name is not None:
        candidate.full_name = candidate_data.full_name

        # Keep the main user account name synchronized
        current_user.name = candidate_data.full_name

    if candidate_data.phone is not None:
        candidate.phone = candidate_data.phone

    if candidate_data.location is not None:
        candidate.location = candidate_data.location

    if candidate_data.summary is not None:
        candidate.summary = candidate_data.summary

    db.commit()
    db.refresh(candidate)

    return candidate


@router.get(
    "/{candidate_id}",
    response_model=CandidateResponse,
)
def get_candidate(
    candidate_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found",
        )

    if candidate.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only access your own candidate profile",
        )

    return candidate