from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.company import Company
from app.models.job import Job
from app.models.user import User

from app.schemas.job import (
    JobCreate,
    JobResponse,
    JobUpdate,
)

from app.services.notification_service import create_notification


router = APIRouter(
    prefix="/jobs",
    tags=["Jobs"],
)


# =========================================================
# HELPERS
# =========================================================


def get_owned_company(
    company_id: int,
    current_user: User,
    db: Session,
):
    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
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
        .filter(
            Job.id == job_id
        )
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    company = (
        db.query(Company)
        .filter(
            Company.id == job.company_id
        )
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


# =========================================================
# NOTIFY PLACEMENT OFFICERS
# =========================================================


def notify_placement_officers(
    db: Session,
    title: str,
    message: str,
    notification_type: str,
):
    """
    Send a notification to every Placement Officer.
    """

    placement_officers = (
        db.query(User)
        .filter(
            User.role == "placement_officer"
        )
        .all()
    )

    for officer in placement_officers:

        try:
            create_notification(
                db=db,
                user_id=officer.id,
                title=title,
                message=message,
                notification_type=notification_type,
            )

        except Exception as exc:

            print(
                f"Failed to notify placement officer "
                f"{officer.id}: {exc}"
            )


# =========================================================
# NOTIFY CANDIDATES WHO APPLIED TO A JOB
# =========================================================


def notify_job_applicants(
    db: Session,
    job: Job,
    company_name: str,
    notification_title: str,
    notification_message: str,
    notification_type: str = "job_status",
):
    """
    Notify every candidate who already has an application
    for this job.

    Important:
    - Existing applications are NOT modified.
    - Application status is NOT modified.
    - Only the candidate's notification is created.
    """

    applicants = (
        db.query(
            Application,
            Candidate,
            User,
        )
        .join(
            Candidate,
            Application.candidate_id == Candidate.id,
        )
        .join(
            User,
            Candidate.user_id == User.id,
        )
        .filter(
            Application.job_id == job.id
        )
        .all()
    )

    notified_user_ids = set()

    for application, candidate, candidate_user in applicants:

        # Safety protection against duplicate users
        if candidate_user.id in notified_user_ids:
            continue

        notified_user_ids.add(
            candidate_user.id
        )

        try:

            create_notification(
                db=db,
                user_id=candidate_user.id,
                title=notification_title,
                message=notification_message,
                notification_type=notification_type,
            )

        except Exception as exc:

            print(
                f"Failed to notify candidate "
                f"{candidate_user.id} "
                f"about job {job.id}: {exc}"
            )


# =========================================================
# CREATE JOB
# =========================================================


@router.post(
    "/",
    response_model=JobResponse,
    status_code=201,
)
def create_job(
    job: JobCreate,
    current_user: User = Depends(
        require_role(
            "recruiter",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Verify recruiter owns the company
    # -----------------------------------------------------

    company = get_owned_company(
        job.company_id,
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Create job
    # -----------------------------------------------------

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

    # =====================================================
    # NOTIFY PLACEMENT OFFICERS
    # =====================================================

    notify_placement_officers(
        db=db,
        title="New Job Posted",
        message=(
            f"{current_user.name} has posted a new job "
            f"'{new_job.title}' at '{company.name}'."
        ),
        notification_type="new_job",
    )

    return new_job


# =========================================================
# GET ALL OPEN JOBS
# =========================================================


@router.get(
    "/",
    response_model=list[JobResponse],
)
def get_jobs(
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    jobs = (
        db.query(Job)
        .filter(
            Job.status == "open"
        )
        .order_by(
            Job.id.desc()
        )
        .all()
    )

    return jobs


# =========================================================
# RECRUITER'S JOBS
# =========================================================


@router.get(
    "/recruiter/my-jobs",
    response_model=list[JobResponse],
)
def get_my_jobs(
    current_user: User = Depends(
        require_role(
            "recruiter",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Admin can see all jobs
    # -----------------------------------------------------

    if current_user.role == "admin":

        jobs = (
            db.query(Job)
            .order_by(
                Job.id.desc()
            )
            .all()
        )

        return jobs

    # -----------------------------------------------------
    # Find companies owned by recruiter
    # -----------------------------------------------------

    company_ids = [
        company.id
        for company in (
            db.query(Company)
            .filter(
                Company.created_by
                == current_user.id
            )
            .all()
        )
    ]

    if not company_ids:
        return []

    # -----------------------------------------------------
    # Get jobs belonging to those companies
    # -----------------------------------------------------

    jobs = (
        db.query(Job)
        .filter(
            Job.company_id.in_(company_ids)
        )
        .order_by(
            Job.id.desc()
        )
        .all()
    )

    return jobs


# =========================================================
# GET SINGLE JOB
# =========================================================


@router.get(
    "/{job_id}",
    response_model=JobResponse,
)
def get_job(
    job_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):

    job = (
        db.query(Job)
        .filter(
            Job.id == job_id
        )
        .first()
    )

    if not job:

        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    return job

# =========================================================
# UPDATE JOB
# =========================================================


@router.put(
    "/{job_id}",
    response_model=JobResponse,
)
def update_job(
    job_id: int,
    job_data: JobUpdate,
    current_user: User = Depends(
        require_role(
            "recruiter",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # 1. Get job and verify ownership
    # -----------------------------------------------------

    job = get_owned_job(
        job_id,
        current_user,
        db,
    )

    # -----------------------------------------------------
    # 2. Get company
    # -----------------------------------------------------

    company = (
        db.query(Company)
        .filter(
            Company.id == job.company_id
        )
        .first()
    )

    # -----------------------------------------------------
    # 3. Store old status BEFORE changing it
    # -----------------------------------------------------

    old_status = job.status

    # -----------------------------------------------------
    # 4. Get only fields supplied by frontend
    # -----------------------------------------------------

    update_data = job_data.model_dump(
        exclude_unset=True
    )

    # -----------------------------------------------------
    # 5. Normalize application URL
    # -----------------------------------------------------

    if "application_url" in update_data:

        update_data["application_url"] = (
            str(
                update_data["application_url"]
            )
            if update_data["application_url"]
            else None
        )

    # -----------------------------------------------------
    # 6. Apply updates
    # -----------------------------------------------------

    for field, value in update_data.items():

        setattr(
            job,
            field,
            value,
        )

    # -----------------------------------------------------
    # 7. Save job changes
    # -----------------------------------------------------

    db.commit()

    db.refresh(job)

    # =====================================================
    # JOB STATUS CHANGED
    # =====================================================

    new_status = job.status

    if old_status != new_status:

        company_name = (
            company.name
            if company
            else "the company"
        )

        # -------------------------------------------------
        # Notify placement officers about status change
        # -------------------------------------------------

        notify_placement_officers(
            db=db,
            title="Job Status Updated",
            message=(
                f"The job "
                f"'{job.title}' at "
                f"'{company_name}' changed from "
                f"'{old_status}' to "
                f"'{new_status}'."
            ),
            notification_type="job_status",
        )

        # -------------------------------------------------
        # IMPORTANT:
        # Notify candidates when their applied job closes
        # -------------------------------------------------

        if (
            old_status == "open"
            and new_status == "closed"
        ):

            notify_job_applicants(
                db=db,
                job=job,
                company_name=company_name,
                notification_title="Job Closed",
                notification_message=(
                    f"The job "
                    f"'{job.title}' at "
                    f"'{company_name}' has been closed. "
                    f"Your existing application remains "
                    f"in the system."
                ),
                notification_type="job_closed",
            )

    # =====================================================
    # JOB UPDATED
    # =====================================================

    # Notify placement officers about other job updates.
    # Do NOT create another generic update notification
    # when the only change was the status.
    if (
        old_status == new_status
        and update_data
    ):

        notify_placement_officers(
            db=db,
            title="Job Updated",
            message=(
                f"The job "
                f"'{job.title}' at "
                f"'{company.name if company else 'the company'}' "
                f"has been updated."
            ),
            notification_type="job_updated",
        )

    # -----------------------------------------------------
    # Return updated job
    # -----------------------------------------------------

    return job


    
# =========================================================
# DELETE JOB
# =========================================================


@router.delete(
    "/{job_id}",
    status_code=204,
)
def delete_job(
    job_id: int,
    current_user: User = Depends(
        require_role(
            "recruiter",
            "admin",
        )
    ),
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # Get job and verify ownership
    # -----------------------------------------------------

    job = get_owned_job(
        job_id,
        current_user,
        db,
    )

    # -----------------------------------------------------
    # Get company
    # -----------------------------------------------------

    company = (
        db.query(Company)
        .filter(
            Company.id == job.company_id
        )
        .first()
    )

    job_title = job.title

    company_name = (
        company.name
        if company
        else "the company"
    )

    # -----------------------------------------------------
    # Delete job
    # -----------------------------------------------------

    db.delete(job)

    db.commit()

    # =====================================================
    # NOTIFY PLACEMENT OFFICERS
    # =====================================================

    notify_placement_officers(
        db=db,
        title="Job Removed",
        message=(
            f"Job '{job_title}' at "
            f"'{company_name}' has been removed."
        ),
        notification_type="job_deleted",
    )

    return None