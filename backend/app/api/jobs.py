from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db
from app.models.company import Company
from app.models.job import Job
from app.models.user import User
from app.schemas.job import JobCreate, JobResponse, JobUpdate


router = APIRouter(prefix="/jobs", tags=["Jobs"])


def get_owned_company(
    company_id: int,
    current_user: User,
    db: Session,
):
    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    if (
        current_user.role == "recruiter"
        and company.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only manage companies you own",
        )

    return company


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

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company associated with this job was not found",
        )

    if (
        current_user.role == "recruiter"
        and company.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to manage this job",
        )

    return job


@router.post(
    "/",
    response_model=JobResponse,
    status_code=201,
)
def create_job(
    job: JobCreate,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    get_owned_company(
        job.company_id,
        current_user,
        db,
    )

    new_job = Job(
        company_id=job.company_id,
        title=job.title,
        description=job.description,
        location=job.location,
        employment_type=job.employment_type,
        work_mode=job.work_mode,
        experience_min=job.experience_min,
        experience_max=job.experience_max,
        experience_level=job.experience_level,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        application_url=(
            str(job.application_url)
            if job.application_url
            else None
        ),
        minimum_degree=job.minimum_degree,
        required_field_of_study=job.required_field_of_study,
        minimum_grade=job.minimum_grade,
        status="open",
        posted_at=datetime.utcnow(),
    )

    db.add(new_job)
    db.commit()
    db.refresh(new_job)

    return new_job


@router.get(
    "/",
    response_model=list[JobResponse],
)
def get_jobs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    jobs = (
        db.query(Job)
        .filter(Job.status == "open")
        .order_by(Job.id.desc())
        .all()
    )

    return jobs


@router.get(
    "/recruiter/my-jobs",
    response_model=list[JobResponse],
)
def get_my_jobs(
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    if current_user.role == "admin":
        jobs = (
            db.query(Job)
            .order_by(Job.id.desc())
            .all()
        )

        return jobs

    company_ids = [
        company.id
        for company in (
            db.query(Company)
            .filter(Company.created_by == current_user.id)
            .all()
        )
    ]

    if not company_ids:
        return []

    jobs = (
        db.query(Job)
        .filter(Job.company_id.in_(company_ids))
        .order_by(Job.id.desc())
        .all()
    )

    return jobs


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
def get_job(
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

    return job


@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    job = get_owned_job(
        job_id,
        current_user,
        db,
    )

    update_data = job_data.model_dump(
        exclude_unset=True
    )

    if "application_url" in update_data:
        update_data["application_url"] = (
            str(update_data["application_url"])
            if update_data["application_url"]
            else None
        )

    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)

    return job


@router.delete(
    "/{job_id}",
    status_code=204,
)
def delete_job(
    job_id: int,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    job = get_owned_job(
        job_id,
        current_user,
        db,
    )

    db.delete(job)
    db.commit()

    return None
