from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.experience import Experience
from app.models.user import User
from app.schemas.experience import (
    ExperienceCreate,
    ExperienceResponse,
    ExperienceUpdate,
)


router = APIRouter(
    prefix="/experiences",
    tags=["Experiences"],
)


def get_current_candidate(
    current_user: User,
    db: Session,
) -> Candidate:
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


def validate_dates(
    start_date: str | None,
    end_date: str | None,
):
    if start_date and end_date and end_date.lower() != "present":
        if end_date < start_date:
            raise HTTPException(
                status_code=400,
                detail="End date cannot be before start date",
            )


@router.post(
    "/",
    response_model=ExperienceResponse,
    status_code=201,
)
def create_experience(
    experience: ExperienceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(current_user, db)

    if candidate.id != experience.candidate_id:
        raise HTTPException(
            status_code=403,
            detail="You can only add experience to your own candidate profile",
        )

    if not experience.company_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Company name is required",
        )

    if not experience.job_title.strip():
        raise HTTPException(
            status_code=400,
            detail="Job title is required",
        )

    validate_dates(
        experience.start_date,
        experience.end_date,
    )

    new_experience = Experience(
        candidate_id=candidate.id,
        company_name=experience.company_name.strip(),
        job_title=experience.job_title.strip(),
        employment_type=experience.employment_type,
        location=experience.location,
        start_date=experience.start_date,
        end_date=experience.end_date,
        description=experience.description,
    )

    db.add(new_experience)
    db.commit()
    db.refresh(new_experience)

    return new_experience


@router.get(
    "/me",
    response_model=list[ExperienceResponse],
)
def get_my_experiences(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(current_user, db)

    experiences = (
        db.query(Experience)
        .filter(Experience.candidate_id == candidate.id)
        .order_by(
            Experience.start_date.desc(),
            Experience.id.desc(),
        )
        .all()
    )

    return experiences


@router.put(
    "/{experience_id}",
    response_model=ExperienceResponse,
)
def update_experience(
    experience_id: int,
    experience: ExperienceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(current_user, db)

    existing_experience = (
        db.query(Experience)
        .filter(
            Experience.id == experience_id,
            Experience.candidate_id == candidate.id,
        )
        .first()
    )

    if not existing_experience:
        raise HTTPException(
            status_code=404,
            detail="Experience not found",
        )

    new_company_name = (
        experience.company_name
        if experience.company_name is not None
        else existing_experience.company_name
    )

    new_job_title = (
        experience.job_title
        if experience.job_title is not None
        else existing_experience.job_title
    )

    new_start_date = (
        experience.start_date
        if experience.start_date is not None
        else existing_experience.start_date
    )

    new_end_date = (
        experience.end_date
        if experience.end_date is not None
        else existing_experience.end_date
    )

    if not new_company_name.strip():
        raise HTTPException(
            status_code=400,
            detail="Company name is required",
        )

    if not new_job_title.strip():
        raise HTTPException(
            status_code=400,
            detail="Job title is required",
        )

    validate_dates(
        new_start_date,
        new_end_date,
    )

    update_data = experience.model_dump(exclude_unset=True)

    if "company_name" in update_data:
        update_data["company_name"] = update_data["company_name"].strip()

    if "job_title" in update_data:
        update_data["job_title"] = update_data["job_title"].strip()

    for field, value in update_data.items():
        setattr(existing_experience, field, value)

    db.commit()
    db.refresh(existing_experience)

    return existing_experience


@router.delete(
    "/{experience_id}",
)
def delete_experience(
    experience_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(current_user, db)

    existing_experience = (
        db.query(Experience)
        .filter(
            Experience.id == experience_id,
            Experience.candidate_id == candidate.id,
        )
        .first()
    )

    if not existing_experience:
        raise HTTPException(
            status_code=404,
            detail="Experience not found",
        )

    db.delete(existing_experience)
    db.commit()

    return {
        "message": "Experience deleted successfully"
    }