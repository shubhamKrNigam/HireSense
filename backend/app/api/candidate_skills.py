from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.skill import Skill
from app.models.user import User
from app.schemas.candidate_skill import (
    CandidateSkillCreate,
    CandidateSkillResponse,
)


router = APIRouter(
    prefix="/candidate-skills",
    tags=["Candidate Skills"],
)


def get_owned_candidate(
    candidate_id: int,
    current_user: User,
    db: Session,
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
            detail="You can only access your own candidate skills",
        )

    return candidate


@router.get(
    "/me",
    response_model=list[CandidateSkillResponse],
)
def get_my_skills(
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

    return (
        db.query(CandidateSkill)
        .filter(
            CandidateSkill.candidate_id == candidate.id
        )
        .all()
    )


@router.post(
    "/",
    response_model=CandidateSkillResponse,
    status_code=201,
)
def create_candidate_skill(
    candidate_skill: CandidateSkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = get_owned_candidate(
        candidate_skill.candidate_id,
        current_user,
        db,
    )

    # ---------------------------------------------------------
    # Find existing skill OR create a new skill
    # ---------------------------------------------------------

    skill = None

    if candidate_skill.skill_id is not None:
        skill = (
            db.query(Skill)
            .filter(Skill.id == candidate_skill.skill_id)
            .first()
        )

        if not skill:
            raise HTTPException(
                status_code=404,
                detail="Skill not found",
            )

    elif candidate_skill.skill_name:
        clean_skill_name = candidate_skill.skill_name.strip()

        if not clean_skill_name:
            raise HTTPException(
                status_code=400,
                detail="Skill name cannot be empty",
            )

        skill = (
            db.query(Skill)
            .filter(
                Skill.name.ilike(clean_skill_name)
            )
            .first()
        )

        if not skill:
            skill = Skill(
                name=clean_skill_name,
                category="Other",
            )

            db.add(skill)
            db.flush()

    else:
        raise HTTPException(
            status_code=400,
            detail="Please select or enter a skill",
        )

    # ---------------------------------------------------------
    # Prevent duplicate candidate skill
    # ---------------------------------------------------------

    existing_mapping = (
        db.query(CandidateSkill)
        .filter(
            CandidateSkill.candidate_id == candidate.id,
            CandidateSkill.skill_id == skill.id,
        )
        .first()
    )

    if existing_mapping:
        raise HTTPException(
            status_code=400,
            detail="Skill already added to your profile",
        )

    # ---------------------------------------------------------
    # Create mapping
    # ---------------------------------------------------------

    new_candidate_skill = CandidateSkill(
        candidate_id=candidate.id,
        skill_id=skill.id,
        proficiency=candidate_skill.proficiency,
        years_used=candidate_skill.years_used,
        source=candidate_skill.source or "manual",
    )

    db.add(new_candidate_skill)
    db.commit()
    db.refresh(new_candidate_skill)

    return new_candidate_skill


@router.delete(
    "/{candidate_skill_id}",
    status_code=204,
)
def delete_candidate_skill(
    candidate_skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate_skill = (
        db.query(CandidateSkill)
        .filter(
            CandidateSkill.id == candidate_skill_id
        )
        .first()
    )

    if not candidate_skill:
        raise HTTPException(
            status_code=404,
            detail="Candidate skill not found",
        )

    get_owned_candidate(
        candidate_skill.candidate_id,
        current_user,
        db,
    )

    db.delete(candidate_skill)
    db.commit()

    return None