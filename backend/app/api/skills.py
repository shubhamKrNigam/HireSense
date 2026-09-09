from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db
from app.models.skill import Skill
from app.models.user import User
from app.schemas.skill import SkillCreate, SkillResponse


router = APIRouter(
    prefix="/skills",
    tags=["Skills"],
)


@router.post(
    "/",
    response_model=SkillResponse,
    status_code=201,
)
def create_skill(
    skill: SkillCreate,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    clean_name = skill.name.strip()

    if not clean_name:
        raise HTTPException(
            status_code=400,
            detail="Skill name cannot be empty",
        )

    existing_skill = (
        db.query(Skill)
        .filter(Skill.name.ilike(clean_name))
        .first()
    )

    if existing_skill:
        raise HTTPException(
            status_code=400,
            detail="Skill already exists",
        )

    new_skill = Skill(
        name=clean_name,
        category=skill.category,
    )

    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)

    return new_skill


@router.get(
    "/",
    response_model=list[SkillResponse],
)
def get_all_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Skill)
        .order_by(Skill.name.asc())
        .all()
    )


@router.get(
    "/{skill_id}",
    response_model=SkillResponse,
)
def get_skill(
    skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = (
        db.query(Skill)
        .filter(Skill.id == skill_id)
        .first()
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    return skill