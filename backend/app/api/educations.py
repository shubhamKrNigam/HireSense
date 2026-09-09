from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.education import Education
from app.models.user import User
from app.schemas.education import (
    EducationCreate,
    EducationUpdate,
    EducationResponse,
)


router = APIRouter(
    prefix="/educations",
    tags=["Educations"],
)


def get_current_candidate(
    current_user: User,
    db: Session,
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


# =========================================================
# CREATE EDUCATION
# =========================================================

@router.post(
    "/",
    response_model=EducationResponse,
    status_code=201,
)
def create_education(
    education: EducationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == education.candidate_id)
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
            detail="You can only add education to your own candidate profile",
        )

    if (
        education.start_year is not None
        and education.end_year is not None
        and education.end_year < education.start_year
    ):
        raise HTTPException(
            status_code=400,
            detail="End year cannot be earlier than start year",
        )

    new_education = Education(
        candidate_id=candidate.id,
        institution=education.institution.strip(),
        degree=education.degree,
        field_of_study=education.field_of_study,
        start_year=education.start_year,
        end_year=education.end_year,
        grade=education.grade,
    )

    db.add(new_education)
    db.commit()
    db.refresh(new_education)

    return new_education


# =========================================================
# GET MY EDUCATION
# =========================================================

@router.get(
    "/me",
    response_model=list[EducationResponse],
)
def get_my_educations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(
        current_user,
        db,
    )

    educations = (
        db.query(Education)
        .filter(
            Education.candidate_id == candidate.id
        )
        .order_by(
            Education.end_year.desc(),
            Education.start_year.desc(),
        )
        .all()
    )

    return educations


# =========================================================
# UPDATE EDUCATION
# =========================================================

@router.put(
    "/{education_id}",
    response_model=EducationResponse,
)
def update_education(
    education_id: int,
    education_update: EducationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(
        current_user,
        db,
    )

    education = (
        db.query(Education)
        .filter(
            Education.id == education_id,
            Education.candidate_id == candidate.id,
        )
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=404,
            detail="Education record not found",
        )

    data = education_update.model_dump(
        exclude_unset=True
    )

    new_start_year = data.get(
        "start_year",
        education.start_year,
    )

    new_end_year = data.get(
        "end_year",
        education.end_year,
    )

    if (
        new_start_year is not None
        and new_end_year is not None
        and new_end_year < new_start_year
    ):
        raise HTTPException(
            status_code=400,
            detail="End year cannot be earlier than start year",
        )

    for field, value in data.items():
        if field == "institution" and value is not None:
            value = value.strip()

        setattr(
            education,
            field,
            value,
        )

    if not education.institution.strip():
        raise HTTPException(
            status_code=400,
            detail="Institution is required",
        )

    db.commit()
    db.refresh(education)

    return education


# =========================================================
# DELETE EDUCATION
# =========================================================

@router.delete(
    "/{education_id}",
)
def delete_education(
    education_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_current_candidate(
        current_user,
        db,
    )

    education = (
        db.query(Education)
        .filter(
            Education.id == education_id,
            Education.candidate_id == candidate.id,
        )
        .first()
    )

    if not education:
        raise HTTPException(
            status_code=404,
            detail="Education record not found",
        )

    db.delete(education)
    db.commit()

    return {
        "message": "Education deleted successfully"
    }