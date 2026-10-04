from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.company import Company
from app.models.education import Education
from app.models.experience import Experience
from app.models.job import Job
from app.models.project import Project
from app.models.resume import Resume
from app.models.skill import Skill
from app.models.user import User

from app.services.matching import calculate_match

from app.services.notification_service import create_notification

from app.schemas.application import (
    ApplicationCreate,
    ApplicationResponse,
    ApplicationStatusUpdate,
    RecruiterApplicationResponse,
)


router = APIRouter(
    prefix="/applications",
    tags=["Applications"],
)


@router.post(
    "/",
    response_model=ApplicationResponse,
    status_code=201,
)
def create_application(
    application: ApplicationCreate,
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

    job = (
        db.query(Job)
        .filter(Job.id == application.job_id)
        .first()
    )

    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found",
        )

    if getattr(job, "status", "open") != "open":
        raise HTTPException(
            status_code=400,
            detail="This job is no longer accepting applications",
        )

    existing_application = (
        db.query(Application)
        .filter(
            Application.candidate_id == candidate.id,
            Application.job_id == application.job_id,
        )
        .first()
    )

    if existing_application:
        raise HTTPException(
            status_code=400,
            detail="You have already applied to this job",
        )

    new_application = Application(
        candidate_id=candidate.id,
        job_id=application.job_id,
        status="applied",
    )

    db.add(new_application)
    db.commit()
    db.refresh(new_application)

    company = (
        db.query(Company)
        .filter(Company.id == job.company_id)
        .first()
    )

    return ApplicationResponse(
        id=new_application.id,
        candidate_id=new_application.candidate_id,
        job_id=new_application.job_id,
        status=new_application.status,
        applied_at=new_application.applied_at,
        company_name=company.name if company else None,
    )


@router.get(
    "/me",
    response_model=list[ApplicationResponse],
)
def get_my_applications(
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

    applications = (
        db.query(Application)
        .filter(Application.candidate_id == candidate.id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    results = []

    for application in applications:
        job = (
            db.query(Job)
            .filter(Job.id == application.job_id)
            .first()
        )

        company = None

        if job:
            company = (
                db.query(Company)
                .filter(Company.id == job.company_id)
                .first()
            )

        results.append(
            ApplicationResponse(
                id=application.id,
                candidate_id=application.candidate_id,
                job_id=application.job_id,
                status=application.status,
                applied_at=application.applied_at,
                company_name=company.name if company else None,
            )
        )

    return results


@router.get(
    "/job/{job_id}",
    response_model=list[RecruiterApplicationResponse],
)
def get_job_applications(
    job_id: int,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    # ---------------------------------------------------------
    # 1. Validate job
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # 2. Validate recruiter ownership
    # ---------------------------------------------------------
    company = (
        db.query(Company)
        .filter(Company.id == job.company_id)
        .first()
    )

    if (
        current_user.role == "recruiter"
        and company
        and company.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view applications for jobs you own",
        )

    # ---------------------------------------------------------
    # 3. Get applications
    # ---------------------------------------------------------
    applications = (
        db.query(Application, Candidate, Job)
        .join(
            Candidate,
            Application.candidate_id == Candidate.id,
        )
        .join(
            Job,
            Application.job_id == Job.id,
        )
        .filter(Application.job_id == job_id)
        .order_by(Application.applied_at.desc())
        .all()
    )

    results = []

    # ---------------------------------------------------------
    # 4. Calculate AI match intelligence
    # ---------------------------------------------------------
    for application, candidate, job in applications:

        match = calculate_match(
            candidate_id=candidate.id,
            job_id=job.id,
            db=db,
        )

        # -----------------------------------------------------
        # 5. Convert skill IDs -> skill names
        # -----------------------------------------------------
        all_skill_ids = set(
            match["matched_skills"]
            + match["missing_skills"]
        )

        if all_skill_ids:
            skills = (
                db.query(Skill)
                .filter(Skill.id.in_(all_skill_ids))
                .all()
            )
        else:
            skills = []

        skill_names = {
            skill.id: skill.name
            for skill in skills
        }

        matched_skill_names = [
            skill_names[skill_id]
            for skill_id in match["matched_skills"]
            if skill_id in skill_names
        ]

        missing_skill_names = [
            skill_names[skill_id]
            for skill_id in match["missing_skills"]
            if skill_id in skill_names
        ]

        missing_required_skill_names = [
            skill_names[skill_id]
            for skill_id in match["missing_required_skills"]
            if skill_id in skill_names
        ]

        # -----------------------------------------------------
        # 6. Build recruiter response
        # -----------------------------------------------------
        results.append(
            RecruiterApplicationResponse(
                id=application.id,
                candidate_id=candidate.id,
                candidate_name=candidate.full_name,
                job_id=job.id,
                job_title=job.title,
                company_name=company.name if company else None,
                status=application.status,
                applied_at=application.applied_at,

                # AI matching
                match_score=match["match_score"],
                eligible=match["eligible"],
                eligibility_reasons=match["eligibility_reasons"],

                # Match components
                skill_score=match["skill_score"],
                text_similarity_score=match["text_similarity_score"],
                experience_score=match["experience_score"],
                education_score=match["education_score"],
                candidate_experience_years=match[
                    "candidate_experience_years"
                ],

                # Explainability
                matched_skills=matched_skill_names,
                missing_skills=missing_skill_names,
                missing_required_skills=missing_required_skill_names,
            )
        )

    # ---------------------------------------------------------
    # 7. Rank eligible candidates first, then by match score
    # ---------------------------------------------------------
    results.sort(
        key=lambda application: (
            not application.eligible,
            -application.match_score,
        )
    )

    return results



@router.get(
    "/candidate/{candidate_id}",
)
def get_recruiter_candidate_intelligence(
    candidate_id: int,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    """
    Return the candidate profile and supporting evidence for a recruiter
    who has a legitimate application relationship with that candidate.

    Recruiters may only access candidates who have applied to at least one
    job owned by their company. Admins can access any candidate.
    """

    # ---------------------------------------------------------
    # 1. Validate candidate
    # ---------------------------------------------------------
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

    # ---------------------------------------------------------
    # 2. Validate recruiter access
    # ---------------------------------------------------------
    if current_user.role == "recruiter":
        authorized_application = (
            db.query(Application)
            .join(Job, Application.job_id == Job.id)
            .join(Company, Job.company_id == Company.id)
            .filter(
                Application.candidate_id == candidate_id,
                Company.created_by == current_user.id,
            )
            .first()
        )

        if not authorized_application:
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only view candidate profiles for "
                    "applicants to your jobs"
                ),
            )

    # ---------------------------------------------------------
    # 3. Candidate skills
    # ---------------------------------------------------------
    skill_rows = (
        db.query(CandidateSkill, Skill)
        .join(
            Skill,
            CandidateSkill.skill_id == Skill.id,
        )
        .filter(
            CandidateSkill.candidate_id == candidate_id
        )
        .order_by(Skill.name.asc())
        .all()
    )

    skills = [
        {
            "skill_id": candidate_skill.skill_id,
            "skill_name": skill.name,
            "category": skill.category,
            "proficiency": candidate_skill.proficiency,
            "years_used": candidate_skill.years_used,
            "source": candidate_skill.source,
        }
        for candidate_skill, skill in skill_rows
    ]

    # ---------------------------------------------------------
    # 4. Education
    # ---------------------------------------------------------
    educations = (
        db.query(Education)
        .filter(Education.candidate_id == candidate_id)
        .order_by(
            Education.end_year.desc(),
            Education.start_year.desc(),
        )
        .all()
    )

    education_data = [
        {
            "id": education.id,
            "institution": education.institution,
            "degree": education.degree,
            "field_of_study": education.field_of_study,
            "start_year": education.start_year,
            "end_year": education.end_year,
            "grade": education.grade,
        }
        for education in educations
    ]

    # ---------------------------------------------------------
    # 5. Experience
    # ---------------------------------------------------------
    experiences = (
        db.query(Experience)
        .filter(Experience.candidate_id == candidate_id)
        .order_by(Experience.start_date.desc())
        .all()
    )

    experience_data = [
        {
            "id": experience.id,
            "company_name": experience.company_name,
            "job_title": experience.job_title,
            "employment_type": experience.employment_type,
            "location": experience.location,
            "start_date": experience.start_date,
            "end_date": experience.end_date,
            "description": experience.description,
        }
        for experience in experiences
    ]

    # ---------------------------------------------------------
    # 6. Projects
    # ---------------------------------------------------------
    projects = (
        db.query(Project)
        .filter(Project.candidate_id == candidate_id)
        .order_by(Project.start_date.desc())
        .all()
    )

    project_data = [
        {
            "id": project.id,
            "project_name": project.project_name,
            "project_type": project.project_type,
            "technologies": project.technologies,
            "project_link": project.project_link,
            "start_date": project.start_date,
            "end_date": project.end_date,
            "description": project.description,
        }
        for project in projects
    ]

    # ---------------------------------------------------------
    # 7. Latest resume
    # ---------------------------------------------------------
    resume = (
        db.query(Resume)
        .filter(Resume.candidate_id == candidate_id)
        .order_by(Resume.id.desc())
        .first()
    )

    resume_data = None

    if resume:
        resume_data = {
            "id": resume.id,
            "file_name": resume.file_name,
            "file_type": resume.file_type,
            "has_extracted_text": bool(
                resume.extracted_text
                and resume.extracted_text.strip()
            ),
            "extracted_text": resume.extracted_text,
        }

    # ---------------------------------------------------------
    # 8. Final recruiter candidate intelligence response
    # ---------------------------------------------------------
    return {
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "phone": candidate.phone,
            "location": candidate.location,
            "summary": candidate.summary,
        },
        "skills": skills,
        "education": education_data,
        "experience": experience_data,
        "projects": project_data,
        "resume": resume_data,
    }


@router.patch(
    "/{application_id}/status",
    response_model=ApplicationResponse,
)
def update_application_status(
    application_id: int,
    status_update: ApplicationStatusUpdate,
    current_user: User = Depends(require_role("recruiter", "admin")),
    db: Session = Depends(get_db),
):
    application = (
        db.query(Application)
        .filter(Application.id == application_id)
        .first()
    )

    if not application:
        raise HTTPException(
            status_code=404,
            detail="Application not found",
        )

    job = (
        db.query(Job)
        .filter(Job.id == application.job_id)
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
        and company
        and company.created_by != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only update applications for jobs you own",
        )

    application.status = status_update.status

    db.commit()
    db.refresh(application)

    return ApplicationResponse(
        id=application.id,
        candidate_id=application.candidate_id,
        job_id=application.job_id,
        status=application.status,
        applied_at=application.applied_at,
        company_name=company.name if company else None,
    )
