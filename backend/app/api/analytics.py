from collections import Counter

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.company import Company
from app.models.job import Job
from app.models.skill import Skill
from app.models.user import User

from app.services.matching import calculate_match
from app.services.recommendations import recommend_jobs_for_candidate


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# =========================================================
# RECRUITER / ADMIN ANALYTICS
# =========================================================

@router.get("/overview")
def get_analytics_overview(
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # 1. Determine accessible jobs
    # -----------------------------------------------------

    if current_user.role == "admin":
        jobs = db.query(Job).all()

    else:
        company_ids = [
            company.id
            for company in (
                db.query(Company)
                .filter(
                    Company.created_by == current_user.id
                )
                .all()
            )
        ]

        if company_ids:
            jobs = (
                db.query(Job)
                .filter(
                    Job.company_id.in_(company_ids)
                )
                .all()
            )
        else:
            jobs = []

    job_ids = {job.id for job in jobs}

    # -----------------------------------------------------
    # 2. Applications
    # -----------------------------------------------------

    if job_ids:
        applications = (
            db.query(Application)
            .filter(
                Application.job_id.in_(job_ids)
            )
            .all()
        )
    else:
        applications = []

    total_applications = len(applications)

    status_distribution = Counter(
        application.status
        for application in applications
    )

    # -----------------------------------------------------
    # 3. Matching analytics
    # -----------------------------------------------------

    eligible_count = 0
    ineligible_count = 0
    match_scores = []

    for application in applications:

        match = calculate_match(
            application.candidate_id,
            application.job_id,
            db,
        )

        match_scores.append(
            match["match_score"]
        )

        if match["eligible"]:
            eligible_count += 1
        else:
            ineligible_count += 1

    average_match_score = (
        round(
            sum(match_scores)
            / len(match_scores),
            2,
        )
        if match_scores
        else 0.0
    )

    # -----------------------------------------------------
    # 4. Job statistics
    # -----------------------------------------------------

    job_statistics = []

    for job in jobs:

        job_applications = [
            application
            for application in applications
            if application.job_id == job.id
        ]

        scores = []

        for application in job_applications:

            match = calculate_match(
                application.candidate_id,
                application.job_id,
                db,
            )

            scores.append(
                match["match_score"]
            )

        job_statistics.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                "application_count": len(
                    job_applications
                ),
                "average_match_score": (
                    round(
                        sum(scores)
                        / len(scores),
                        2,
                    )
                    if scores
                    else 0.0
                ),
            }
        )

    job_statistics.sort(
        key=lambda item: item["application_count"],
        reverse=True,
    )

    # -----------------------------------------------------
    # 5. Top applicant skills
    # -----------------------------------------------------

    skill_counter = Counter()

    candidate_ids = {
        application.candidate_id
        for application in applications
    }

    if candidate_ids:

        candidate_skills = (
            db.query(
                CandidateSkill,
                Skill,
            )
            .join(
                Skill,
                CandidateSkill.skill_id
                == Skill.id,
            )
            .filter(
                CandidateSkill.candidate_id.in_(
                    candidate_ids
                )
            )
            .all()
        )

        for candidate_skill, skill in candidate_skills:
            skill_counter[skill.name] += 1

    top_skills = [
        {
            "skill": skill_name,
            "applicant_count": count,
        }
        for skill_name, count in
        skill_counter.most_common(10)
    ]

    # -----------------------------------------------------
    # 6. Final response
    # -----------------------------------------------------

    return {
        "total_jobs": len(jobs),
        "total_applications": total_applications,
        "average_match_score": average_match_score,
        "eligible_applications": eligible_count,
        "ineligible_applications": ineligible_count,
        "status_distribution": dict(
            status_distribution
        ),
        "top_applicant_skills": top_skills,
        "job_statistics": job_statistics,
    }


# =========================================================
# CANDIDATE DASHBOARD ANALYTICS
# =========================================================

@router.get("/candidate")
def get_candidate_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # 1. Get candidate profile
    # -----------------------------------------------------

    candidate = (
        db.query(Candidate)
        .filter(
            Candidate.user_id == current_user.id
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    # -----------------------------------------------------
    # 2. Applications
    # -----------------------------------------------------

    applications = (
        db.query(Application)
        .filter(
            Application.candidate_id
            == candidate.id
        )
        .order_by(
            Application.id.desc()
        )
        .all()
    )

    status_distribution = Counter(
        application.status
        for application in applications
    )

    # -----------------------------------------------------
    # 3. Application details
    # -----------------------------------------------------

    application_details = []

    for application in applications:

        job = (
            db.query(Job)
            .filter(
                Job.id == application.job_id
            )
            .first()
        )

        if not job:
            continue

        match = calculate_match(
            candidate.id,
            job.id,
            db,
        )

        company = (
            db.query(Company)
            .filter(
                Company.id == job.company_id
            )
            .first()
        )

        application_details.append(
            {
                "application_id": application.id,
                "job_id": job.id,
                "job_title": job.title,
                "company_name": (
                    company.name
                    if company
                    else None
                ),
                "location": job.location,
                "employment_type": (
                    job.employment_type
                ),
                "status": application.status,
                "applied_at": application.applied_at,
                "match_score": match[
                    "match_score"
                ],
                "eligible": match[
                    "eligible"
                ],
            }
        )

    # -----------------------------------------------------
    # 4. Candidate skills
    # -----------------------------------------------------

    candidate_skill_rows = (
        db.query(
            CandidateSkill,
            Skill,
        )
        .join(
            Skill,
            CandidateSkill.skill_id
            == Skill.id,
        )
        .filter(
            CandidateSkill.candidate_id
            == candidate.id
        )
        .all()
    )

    skills = []

    for candidate_skill, skill in candidate_skill_rows:

        skills.append(
            {
                "skill_id": skill.id,
                "skill_name": skill.name,
                "category": skill.category,
                "proficiency": (
                    candidate_skill.proficiency
                ),
                "years_used": (
                    candidate_skill.years_used
                ),
                "source": candidate_skill.source,
            }
        )

    # -----------------------------------------------------
    # 5. Recommendations
    # -----------------------------------------------------

    recommendations = recommend_jobs_for_candidate(
        candidate.id,
        db,
    )

    # Keep the dashboard lightweight.
    recommendations = recommendations[:5]

    # -----------------------------------------------------
    # 6. Profile completion
    # -----------------------------------------------------

    profile_fields = [
        candidate.full_name,
        candidate.phone,
        candidate.location,
        candidate.summary,
    ]

    completed_profile_fields = sum(
        1
        for field in profile_fields
        if field
        and str(field).strip()
    )

    profile_completion = round(
        (
            completed_profile_fields
            / len(profile_fields)
        )
        * 100,
        2,
    )

    # -----------------------------------------------------
    # 7. Final dashboard response
    # -----------------------------------------------------

    return {
        "candidate": {
            "id": candidate.id,
            "full_name": candidate.full_name,
            "location": candidate.location,
            "profile_completion": profile_completion,
        },

        "application_summary": {
            "total_applications": len(
                applications
            ),
            "status_distribution": dict(
                status_distribution
            ),
        },

        "skills": skills,

        "recent_applications": (
            application_details[:5]
        ),

        "recommendations": recommendations,

        "recommendation_count": len(
            recommendations
        ),

        "model_version": (
            "skill-text-experience-education-v4"
        ),
    }