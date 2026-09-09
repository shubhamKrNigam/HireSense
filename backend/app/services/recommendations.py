from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.job import Job
from app.services.matching import calculate_match


def recommend_jobs_for_candidate(
    candidate_id: int,
    db: Session,
) -> list[dict]:

    # ---------------------------------------------------------
    # 1. Get jobs already applied to by this candidate
    # ---------------------------------------------------------
    applied_job_ids = {
        application.job_id
        for application in (
            db.query(Application)
            .filter(
                Application.candidate_id == candidate_id
            )
            .all()
        )
    }

    # ---------------------------------------------------------
    # 2. Get all jobs
    # ---------------------------------------------------------
    jobs = (
        db.query(Job)
        .order_by(Job.id.asc())
        .all()
    )

    recommendations = []

    # ---------------------------------------------------------
    # 3. Calculate recommendations
    # ---------------------------------------------------------
    for job in jobs:

        # Do not recommend jobs already applied to
        if job.id in applied_job_ids:
            continue

        match = calculate_match(
            candidate_id,
            job.id,
            db,
        )

        recommendations.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                "company_id": job.company_id,
                "location": job.location,
                "employment_type": job.employment_type,

                "match_score": match["match_score"],
                "eligible": match["eligible"],
                "eligibility_reasons": match[
                    "eligibility_reasons"
                ],

                "skill_score": match["skill_score"],
                "text_similarity_score": match[
                    "text_similarity_score"
                ],
                "experience_score": match[
                    "experience_score"
                ],
                "education_score": match[
                    "education_score"
                ],

                "candidate_experience_years": match[
                    "candidate_experience_years"
                ],

                "matched_skills": match[
                    "matched_skills"
                ],
                "missing_skills": match[
                    "missing_skills"
                ],
                "missing_required_skills": match[
                    "missing_required_skills"
                ],

                "model_version": (
                    "skill-text-experience-education-v4"
                ),
            }
        )

    # ---------------------------------------------------------
    # 4. Ranking
    # ---------------------------------------------------------
    # Eligible jobs first, then highest match score.
    recommendations.sort(
        key=lambda job: (
            not job["eligible"],
            -job["match_score"],
        )
    )

    return recommendations