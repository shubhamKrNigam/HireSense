from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db
from app.models.company import Company
from app.models.job import Job
from app.models.job_skill import JobSkill
from app.models.skill import Skill
from app.models.user import User
from app.schemas.job_skill import (
    JobSkillCreate,
    JobSkillResponse,
    JobSkillUpdate,
)


router = APIRouter(
    prefix="/job-skills",
    tags=["Job Skills"],
)


def get_owned_job(
    job_id: int,
    current_user: User,
    db: Session,
):
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    company = (
        db.query(Company)
        .filter(Company.id == job.company_id)
        .first()
    )

    if (
        current_user.role == "recruiter"
        and (
            not company
            or company.created_by != current_user.id
        )
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage skills for jobs you own",
        )

    return job


@router.post(
    "/",
    response_model=JobSkillResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_job_skill(
    job_skill: JobSkillCreate,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    get_owned_job(
        job_skill.job_id,
        current_user,
        db,
    )

    skill = (
        db.query(Skill)
        .filter(Skill.id == job_skill.skill_id)
        .first()
    )

    if not skill:
        raise HTTPException(
            status_code=404,
            detail="Skill not found",
        )

    existing_mapping = (
        db.query(JobSkill)
        .filter(
            JobSkill.job_id == job_skill.job_id,
            JobSkill.skill_id == job_skill.skill_id,
        )
        .first()
    )

    if existing_mapping:
        raise HTTPException(
            status_code=400,
            detail="Skill already added to job",
        )

    new_job_skill = JobSkill(
        job_id=job_skill.job_id,
        skill_id=job_skill.skill_id,
        importance=job_skill.importance,
        required=1 if job_skill.required else 0,
    )

    db.add(new_job_skill)
    db.commit()
    db.refresh(new_job_skill)

    return new_job_skill


@router.get(
    "/job/{job_id}",
    response_model=list[JobSkillResponse],
)
def get_job_skills(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return (
        db.query(JobSkill)
        .filter(JobSkill.job_id == job_id)
        .order_by(
            JobSkill.required.desc(),
            JobSkill.importance.desc(),
            JobSkill.id.asc(),
        )
        .all()
    )


@router.get(
    "/{job_skill_id}",
    response_model=JobSkillResponse,
)
def get_job_skill(
    job_skill_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    job_skill = (
        db.query(JobSkill)
        .filter(JobSkill.id == job_skill_id)
        .first()
    )

    if not job_skill:
        raise HTTPException(
            status_code=404,
            detail="Job skill mapping not found",
        )

    return job_skill


@router.put(
    "/{job_skill_id}",
    response_model=JobSkillResponse,
)
def update_job_skill(
    job_skill_id: int,
    payload: JobSkillUpdate,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    job_skill = (
        db.query(JobSkill)
        .filter(JobSkill.id == job_skill_id)
        .first()
    )

    if not job_skill:
        raise HTTPException(
            status_code=404,
            detail="Job skill mapping not found",
        )

    get_owned_job(
        job_skill.job_id,
        current_user,
        db,
    )

    updates = payload.model_dump(
        exclude_unset=True
    )

    if "skill_id" in updates:
        skill = (
            db.query(Skill)
            .filter(Skill.id == updates["skill_id"])
            .first()
        )

        if not skill:
            raise HTTPException(
                status_code=404,
                detail="Skill not found",
            )

        duplicate = (
            db.query(JobSkill)
            .filter(
                JobSkill.job_id == job_skill.job_id,
                JobSkill.skill_id == updates["skill_id"],
                JobSkill.id != job_skill_id,
            )
            .first()
        )

        if duplicate:
            raise HTTPException(
                status_code=400,
                detail="Skill already added to job",
            )

    if "required" in updates:
        updates["required"] = (
            1 if updates["required"] else 0
        )

    for field, value in updates.items():
        setattr(job_skill, field, value)

    db.commit()
    db.refresh(job_skill)

    return job_skill


@router.delete(
    "/{job_skill_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_job_skill(
    job_skill_id: int,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    job_skill = (
        db.query(JobSkill)
        .filter(JobSkill.id == job_skill_id)
        .first()
    )

    if not job_skill:
        raise HTTPException(
            status_code=404,
            detail="Job skill mapping not found",
        )

    get_owned_job(
        job_skill.job_id,
        current_user,
        db,
    )

    db.delete(job_skill)
    db.commit()

    return None