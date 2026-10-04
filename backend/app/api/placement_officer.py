from collections import Counter, defaultdict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import require_role
from app.db.session import get_db

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.company import Company
from app.models.job import Job
from app.models.user import User

from app.services.notification_service import create_notification


router = APIRouter(
    prefix="/placement-officer",
    tags=["Placement Officer"],
)


# =========================================================
# PLACEMENT OFFICER OVERVIEW
# =========================================================

@router.get("/overview")
def get_placement_overview(
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    candidates = db.query(Candidate).all()
    applications = db.query(Application).all()
    jobs = db.query(Job).all()
    companies = db.query(Company).all()

    status_counts = Counter(
        application.status
        for application in applications
    )

    open_jobs = [
        job
        for job in jobs
        if job.status == "open"
    ]

    active_companies = {
        job.company_id
        for job in jobs
        if job.status == "open"
    }

    candidate_ids_with_applications = {
        application.candidate_id
        for application in applications
    }

    placed_candidate_ids = {
        application.candidate_id
        for application in applications
        if application.status == "selected"
    }

    # -----------------------------------------------------
    # LOOKUP MAPS
    # -----------------------------------------------------

    candidate_map = {
        candidate.id: candidate
        for candidate in candidates
    }

    job_map = {
        job.id: job
        for job in jobs
    }

    company_map = {
        company.id: company
        for company in companies
    }

    # -----------------------------------------------------
    # RECENT APPLICATIONS
    # -----------------------------------------------------

    recent_applications = []

    for application in sorted(
        applications,
        key=lambda item: item.id,
        reverse=True,
    )[:10]:

        candidate = candidate_map.get(
            application.candidate_id
        )

        job = job_map.get(
            application.job_id
        )

        company = (
            company_map.get(job.company_id)
            if job
            else None
        )

        if not candidate or not job:
            continue

        recent_applications.append(
            {
                "application_id": application.id,
                "candidate_id": candidate.id,
                "candidate_name": candidate.full_name,
                "job_id": job.id,
                "job_title": job.title,
                "company_name": (
                    company.name
                    if company
                    else "Unknown company"
                ),
                "status": application.status,
                "applied_at": application.applied_at,
            }
        )

    # -----------------------------------------------------
    # ROLE / DRIVE MONITORING
    # -----------------------------------------------------

    role_monitoring = []

    for job in jobs:

        job_applications = [
            application
            for application in applications
            if application.job_id == job.id
        ]

        counts = Counter(
            application.status
            for application in job_applications
        )

        company = company_map.get(
            job.company_id
        )

        role_monitoring.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                "company_name": (
                    company.name
                    if company
                    else "Unknown company"
                ),
                "status": job.status,
                "application_count": len(
                    job_applications
                ),
                "shortlisted_count": counts.get(
                    "shortlisted",
                    0,
                ),
                "interview_count": counts.get(
                    "interview",
                    0,
                ),
                "selected_count": counts.get(
                    "selected",
                    0,
                ),
                "rejected_count": counts.get(
                    "rejected",
                    0,
                ),
            }
        )

    role_monitoring.sort(
        key=lambda item: (
            item["application_count"],
            item["job_id"],
        ),
        reverse=True,
    )

    return {
        "role": current_user.role,
        "summary": {
            "registered_candidates": len(
                candidates
            ),
            "active_candidates": len(
                candidate_ids_with_applications
            ),
            "placed_candidates": len(
                placed_candidate_ids
            ),
            "total_applications": len(
                applications
            ),
            "open_jobs": len(
                open_jobs
            ),
            "participating_companies": len(
                active_companies
            ),
        },
        "application_status": dict(
            status_counts
        ),
        "recent_applications": (
            recent_applications
        ),
        "role_monitoring": (
            role_monitoring[:12]
        ),
    }


# =========================================================
# PLACEMENT OFFICER — CANDIDATES
# =========================================================

@router.get("/candidates")
def get_placement_candidates(
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    candidates = db.query(Candidate).all()
    applications = db.query(Application).all()
    users = db.query(User).all()

    # -----------------------------------------------------
    # USER LOOKUP
    # -----------------------------------------------------

    user_map = {
        user.id: user
        for user in users
    }

    # -----------------------------------------------------
    # APPLICATIONS BY CANDIDATE
    # -----------------------------------------------------

    applications_by_candidate = defaultdict(list)

    for application in applications:
        applications_by_candidate[
            application.candidate_id
        ].append(application)

    # -----------------------------------------------------
    # BUILD CANDIDATE DATA
    # -----------------------------------------------------

    result = []

    for candidate in candidates:

        candidate_applications = (
            applications_by_candidate.get(
                candidate.id,
                [],
            )
        )

        status_counts = Counter(
            application.status
            for application in candidate_applications
        )

        user = user_map.get(
            candidate.user_id
        )

        result.append(
            {
                "candidate_id": candidate.id,
                "user_id": candidate.user_id,
                "name": candidate.full_name,
                "email": (
                    user.email
                    if user
                    else None
                ),
                "phone": candidate.phone,
                "location": candidate.location,

                "application_count": len(
                    candidate_applications
                ),

                "shortlisted_count": status_counts.get(
                    "shortlisted",
                    0,
                ),

                "interview_count": status_counts.get(
                    "interview",
                    0,
                ),

                "selected_count": status_counts.get(
                    "selected",
                    0,
                ),

                "rejected_count": status_counts.get(
                    "rejected",
                    0,
                ),

                "active_application_count": sum(
                    1
                    for application
                    in candidate_applications
                    if application.status
                    not in {
                        "rejected",
                        "selected",
                    }
                ),
            }
        )

    result.sort(
        key=lambda item: (
            item["application_count"],
            item["candidate_id"],
        ),
        reverse=True,
    )

    return {
        "role": current_user.role,
        "count": len(result),
        "candidates": result,
    }


# =========================================================
# PLACEMENT OFFICER — RECRUITERS
# =========================================================

@router.get("/recruiters")
def get_placement_recruiters(
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    recruiters = (
        db.query(User)
        .filter(
            User.role == "recruiter"
        )
        .all()
    )

    companies = db.query(
        Company
    ).all()

    jobs = db.query(
        Job
    ).all()

    applications = db.query(
        Application
    ).all()

    # -----------------------------------------------------
    # GROUP COMPANIES BY RECRUITER
    # -----------------------------------------------------

    companies_by_recruiter = defaultdict(list)

    for company in companies:
        if company.created_by is not None:
            companies_by_recruiter[
                company.created_by
            ].append(company)

    # -----------------------------------------------------
    # GROUP JOBS BY COMPANY
    # -----------------------------------------------------

    jobs_by_company = defaultdict(list)

    for job in jobs:
        if job.company_id is not None:
            jobs_by_company[
                job.company_id
            ].append(job)

    # -----------------------------------------------------
    # GROUP APPLICATIONS BY JOB
    # -----------------------------------------------------

    applications_by_job = defaultdict(list)

    for application in applications:
        applications_by_job[
            application.job_id
        ].append(application)

    # -----------------------------------------------------
    # BUILD RECRUITER DATA
    # -----------------------------------------------------

    result = []

    for recruiter in recruiters:

        recruiter_companies = (
            companies_by_recruiter.get(
                recruiter.id,
                [],
            )
        )

        recruiter_jobs = []

        for company in recruiter_companies:
            recruiter_jobs.extend(
                jobs_by_company.get(
                    company.id,
                    [],
                )
            )

        recruiter_applications = []

        for job in recruiter_jobs:
            recruiter_applications.extend(
                applications_by_job.get(
                    job.id,
                    [],
                )
            )

        open_jobs = [
            job
            for job in recruiter_jobs
            if job.status == "open"
        ]

        selected_applications = [
            application
            for application
            in recruiter_applications
            if application.status == "selected"
        ]

        recruiter_name = (
            getattr(
                recruiter,
                "name",
                None,
            )
            or getattr(
                recruiter,
                "full_name",
                None,
            )
            or recruiter.email
            or f"Recruiter #{recruiter.id}"
        )

        # -------------------------------------------------
        # APPROVAL STATUS
        #
        # Existing users without the column/value are
        # treated as approved for backward compatibility.
        # -------------------------------------------------

        approval_status = getattr(
            recruiter,
            "approval_status",
            "approved",
        )

        result.append(
            {
                "recruiter_id": recruiter.id,

                "name": recruiter_name,

                "email": recruiter.email,

                "position": recruiter.position,

                "approval_status": approval_status,

                "companies": [
                    company.name
                    for company
                    in recruiter_companies
                    if company.name
                ],

                "company_count": len(
                    recruiter_companies
                ),

                "total_jobs": len(
                    recruiter_jobs
                ),

                "open_jobs": len(
                    open_jobs
                ),

                "total_applications": len(
                    recruiter_applications
                ),

                "selected_candidates": len(
                    selected_applications
                ),
            }
        )

    # -----------------------------------------------------
    # PENDING RECRUITERS FIRST
    # -----------------------------------------------------

    result.sort(
        key=lambda item: (
            0
            if item["approval_status"] == "pending"
            else 1,
            -item["total_applications"],
            -item["open_jobs"],
            item["recruiter_id"],
        )
    )

    return {
        "role": current_user.role,
        "count": len(result),

        "pending_count": sum(
            1
            for item in result
            if item["approval_status"]
            == "pending"
        ),

        "recruiters": result,
    }


# =========================================================
# APPROVE RECRUITER
# =========================================================

@router.patch(
    "/recruiters/{recruiter_id}/approve"
)
def approve_recruiter(
    recruiter_id: int,
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    recruiter = (
        db.query(User)
        .filter(
            User.id == recruiter_id,
            User.role == "recruiter",
        )
        .first()
    )

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found",
        )

    current_status = getattr(
        recruiter,
        "approval_status",
        "approved",
    )

    if current_status == "approved":
        return {
            "message": (
                "Recruiter is already approved"
            ),
            "recruiter_id": recruiter.id,
            "approval_status": "approved",
        }

    recruiter.approval_status = "approved"

    db.commit()
    db.refresh(recruiter)

    # -----------------------------------------------------
    # NOTIFY RECRUITER
    # -----------------------------------------------------

    try:
        create_notification(
            db=db,
            user_id=recruiter.id,
            title="Recruiter Account Approved",
            message=(
                "Your recruiter account has been "
                "approved by the Placement Officer. "
                "You can now access recruiter features "
                "and manage your company."
            ),
            notification_type="recruiter_approval",
        )

    except Exception as exc:
        print(
            f"Failed to notify recruiter "
            f"{recruiter.id}: {exc}"
        )

    return {
        "message": (
            "Recruiter approved successfully"
        ),
        "recruiter_id": recruiter.id,
        "approval_status": recruiter.approval_status,
    }


# =========================================================
# REJECT RECRUITER
# =========================================================

@router.patch(
    "/recruiters/{recruiter_id}/reject"
)
def reject_recruiter(
    recruiter_id: int,
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    recruiter = (
        db.query(User)
        .filter(
            User.id == recruiter_id,
            User.role == "recruiter",
        )
        .first()
    )

    if not recruiter:
        raise HTTPException(
            status_code=404,
            detail="Recruiter not found",
        )

    recruiter.approval_status = "rejected"

    db.commit()
    db.refresh(recruiter)

    # -----------------------------------------------------
    # NOTIFY RECRUITER
    # -----------------------------------------------------

    try:
        create_notification(
            db=db,
            user_id=recruiter.id,
            title="Recruiter Account Rejected",
            message=(
                "Your recruiter account registration "
                "was not approved by the Placement Officer."
            ),
            notification_type="recruiter_approval",
        )

    except Exception as exc:
        print(
            f"Failed to notify recruiter "
            f"{recruiter.id}: {exc}"
        )

    return {
        "message": (
            "Recruiter rejected successfully"
        ),
        "recruiter_id": recruiter.id,
        "approval_status": recruiter.approval_status,
    }


# =========================================================
# PLACEMENT OFFICER — PLACEMENT DRIVES
# =========================================================

@router.get("/drives")
def get_placement_drives(
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    jobs = db.query(Job).all()
    companies = db.query(Company).all()
    applications = db.query(
        Application
    ).all()

    company_map = {
        company.id: company
        for company in companies
    }

    applications_by_job = defaultdict(list)

    for application in applications:
        applications_by_job[
            application.job_id
        ].append(application)

    result = []

    for job in jobs:

        job_applications = (
            applications_by_job.get(
                job.id,
                [],
            )
        )

        status_counts = Counter(
            application.status
            for application in job_applications
        )

        company = company_map.get(
            job.company_id
        )

        result.append(
            {
                "job_id": job.id,

                "title": job.title,

                "company_name": (
                    company.name
                    if company
                    else "Unknown company"
                ),

                "location": getattr(
                    job,
                    "location",
                    None,
                ),

                "employment_type": getattr(
                    job,
                    "employment_type",
                    None,
                ),

                "work_mode": getattr(
                    job,
                    "work_mode",
                    None,
                ),

                "status": job.status,

                "application_count": len(
                    job_applications
                ),

                "applied_count": status_counts.get(
                    "applied",
                    0,
                ),

                "shortlisted_count": status_counts.get(
                    "shortlisted",
                    0,
                ),

                "interview_count": status_counts.get(
                    "interview",
                    0,
                ),

                "selected_count": status_counts.get(
                    "selected",
                    0,
                ),

                "rejected_count": status_counts.get(
                    "rejected",
                    0,
                ),
            }
        )

    result.sort(
        key=lambda item: (
            item["application_count"],
            item["job_id"],
        ),
        reverse=True,
    )

    return {
        "role": current_user.role,
        "count": len(result),
        "drives": result,
    }


# =========================================================
# PLACEMENT OFFICER — APPLICATIONS
# =========================================================

@router.get("/applications")
def get_placement_applications(
    current_user: User = Depends(
        require_role("placement_officer")
    ),
    db: Session = Depends(get_db),
):
    applications = db.query(
        Application
    ).all()

    candidates = db.query(
        Candidate
    ).all()

    users = db.query(
        User
    ).all()

    jobs = db.query(
        Job
    ).all()

    companies = db.query(
        Company
    ).all()

    # -----------------------------------------------------
    # LOOKUPS
    # -----------------------------------------------------

    candidate_map = {
        candidate.id: candidate
        for candidate in candidates
    }

    user_map = {
        user.id: user
        for user in users
    }

    job_map = {
        job.id: job
        for job in jobs
    }

    company_map = {
        company.id: company
        for company in companies
    }

    # -----------------------------------------------------
    # APPLICATION ROWS
    # -----------------------------------------------------

    result = []

    for application in applications:

        candidate = candidate_map.get(
            application.candidate_id
        )

        job = job_map.get(
            application.job_id
        )

        if not candidate or not job:
            continue

        company = company_map.get(
            job.company_id
        )

        candidate_user = user_map.get(
            candidate.user_id
        )

        result.append(
            {
                "application_id": application.id,

                "candidate_id": candidate.id,

                "candidate_name":
                    candidate.full_name,

                "candidate_email": (
                    candidate_user.email
                    if candidate_user
                    else None
                ),

                "candidate_phone": getattr(
                    candidate,
                    "phone",
                    None,
                ),

                "candidate_location": getattr(
                    candidate,
                    "location",
                    None,
                ),

                "job_id": job.id,

                "job_title": job.title,

                "company_name": (
                    company.name
                    if company
                    else "Unknown company"
                ),

                "status": application.status,

                "applied_at":
                    application.applied_at,
            }
        )

    # -----------------------------------------------------
    # NEWEST FIRST
    # -----------------------------------------------------

    result.sort(
        key=lambda item: item["application_id"],
        reverse=True,
    )

    status_counts = Counter(
        item["status"]
        for item in result
    )

    return {
        "role": current_user.role,

        "count": len(result),

        "summary": {
            "total": len(result),

            "active": sum(
                1
                for item in result
                if item["status"]
                not in {
                    "rejected",
                    "selected",
                }
            ),

            "shortlisted":
                status_counts.get(
                    "shortlisted",
                    0,
                ),

            "interview":
                status_counts.get(
                    "interview",
                    0,
                ),

            "selected":
                status_counts.get(
                    "selected",
                    0,
                ),

            "rejected":
                status_counts.get(
                    "rejected",
                    0,
                ),
        },

        "applications": result,
    }