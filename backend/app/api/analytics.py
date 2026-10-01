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
                .filter(Company.created_by == current_user.id)
                .all()
            )
        ]

        jobs = (
            db.query(Job)
            .filter(Job.company_id.in_(company_ids))
            .all()
            if company_ids
            else []
        )

    job_ids = {job.id for job in jobs}

    # -----------------------------------------------------
    # 2. Applications
    # -----------------------------------------------------

    applications = (
        db.query(Application)
        .filter(Application.job_id.in_(job_ids))
        .all()
        if job_ids
        else []
    )

    total_applications = len(applications)
    status_distribution = Counter(
        application.status for application in applications
    )

    # -----------------------------------------------------
    # 3. Calculate each application once
    # -----------------------------------------------------

    application_matches = {}
    eligible_count = 0
    ineligible_count = 0
    match_scores = []
    match_band_counts = {
        "strong": 0,
        "good": 0,
        "needs_attention": 0,
    }

    missing_skill_counter = Counter()
    missing_required_skill_counter = Counter()

    for application in applications:
        match = calculate_match(
            application.candidate_id,
            application.job_id,
            db,
        )
        application_matches[application.id] = match

        score = float(match.get("match_score", 0) or 0)
        match_scores.append(score)

        if score >= 80:
            match_band_counts["strong"] += 1
        elif score >= 60:
            match_band_counts["good"] += 1
        else:
            match_band_counts["needs_attention"] += 1

        if match.get("eligible"):
            eligible_count += 1
        else:
            ineligible_count += 1

        # Aggregate actual skill gaps from the same matching engine
        # used by the recruiter application ranking.
        for skill_id in match.get("missing_skills", []):
            missing_skill_counter[skill_id] += 1

        for skill_id in match.get("missing_required_skills", []):
            missing_required_skill_counter[skill_id] += 1

    average_match_score = (
        round(sum(match_scores) / len(match_scores), 2)
        if match_scores
        else 0.0
    )

    # -----------------------------------------------------
    # 4. Resolve skill IDs to names
    # -----------------------------------------------------

    relevant_skill_ids = set(missing_skill_counter) | set(
        missing_required_skill_counter
    )

    if relevant_skill_ids:
        relevant_skills = (
            db.query(Skill)
            .filter(Skill.id.in_(relevant_skill_ids))
            .all()
        )
    else:
        relevant_skills = []

    skill_names = {skill.id: skill.name for skill in relevant_skills}

    top_skill_gaps = [
        {
            "skill": skill_names.get(skill_id, str(skill_id)),
            "applicant_count": count,
            "required_gap_count": missing_required_skill_counter.get(
                skill_id, 0
            ),
        }
        for skill_id, count in missing_skill_counter.most_common(10)
    ]

    required_skill_gaps = [
        {
            "skill": skill_names.get(skill_id, str(skill_id)),
            "applicant_count": count,
        }
        for skill_id, count in missing_required_skill_counter.most_common(8)
    ]

    # -----------------------------------------------------
    # 5. Role-level intelligence
    # -----------------------------------------------------

    job_statistics = []

    for job in jobs:
        job_applications = [
            application
            for application in applications
            if application.job_id == job.id
        ]

        role_scores = [
            float(application_matches[application.id].get("match_score", 0) or 0)
            for application in job_applications
        ]

        role_eligible = sum(
            1
            for application in job_applications
            if application_matches[application.id].get("eligible")
        )
        role_strong = sum(score >= 80 for score in role_scores)
        role_good = sum(60 <= score < 80 for score in role_scores)
        role_attention = sum(score < 60 for score in role_scores)

        role_status_counts = Counter(
            application.status for application in job_applications
        )

        job_statistics.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                "application_count": len(job_applications),
                "average_match_score": (
                    round(sum(role_scores) / len(role_scores), 2)
                    if role_scores
                    else 0.0
                ),
                "eligible_count": role_eligible,
                "eligibility_rate": (
                    round((role_eligible / len(job_applications)) * 100, 2)
                    if job_applications
                    else 0.0
                ),
                "strong_match_count": role_strong,
                "good_match_count": role_good,
                "needs_attention_count": role_attention,
                "shortlisted_count": role_status_counts.get("shortlisted", 0),
                "interview_count": role_status_counts.get("interview", 0),
                "selected_count": role_status_counts.get("selected", 0),
                "rejected_count": role_status_counts.get("rejected", 0),
            }
        )

    job_statistics.sort(
        key=lambda item: (
            item["application_count"] > 0,
            item["average_match_score"],
            item["application_count"],
        ),
        reverse=True,
    )

    populated_roles = [
        job for job in job_statistics if job["application_count"] > 0
    ]

    best_role = (
        max(populated_roles, key=lambda item: item["average_match_score"])
        if populated_roles
        else None
    )
    attention_role = (
        min(populated_roles, key=lambda item: item["average_match_score"])
        if populated_roles
        else None
    )

    # -----------------------------------------------------
    # 6. Top applicant skills
    # -----------------------------------------------------

    skill_counter = Counter()
    candidate_ids = {
        application.candidate_id for application in applications
    }

    if candidate_ids:
        candidate_skills = (
            db.query(CandidateSkill, Skill)
            .join(Skill, CandidateSkill.skill_id == Skill.id)
            .filter(CandidateSkill.candidate_id.in_(candidate_ids))
            .all()
        )

        for candidate_skill, skill in candidate_skills:
            skill_counter[skill.name] += 1

    top_skills = [
        {"skill": skill_name, "applicant_count": count}
        for skill_name, count in skill_counter.most_common(10)
    ]

    # -----------------------------------------------------
    # 7. Actionable intelligence summary
    # -----------------------------------------------------

    strong_count = match_band_counts["strong"]
    attention_count = match_band_counts["needs_attention"]

    if best_role:
        best_role_signal = (
            f"{best_role['job_title']} has the strongest candidate alignment "
            f"at {best_role['average_match_score']}% average match."
        )
    else:
        best_role_signal = "Role-level candidate signals will appear as applications arrive."

    if attention_role and attention_role["job_id"] != (best_role or {}).get("job_id"):
        attention_role_signal = (
            f"{attention_role['job_title']} has the lowest current role match "
            f"at {attention_role['average_match_score']}%; review its candidate gaps."
        )
    elif attention_count:
        attention_role_signal = (
            f"{attention_count} applicant{'s' if attention_count != 1 else ''} "
            "currently fall below the 60% match threshold."
        )
    else:
        attention_role_signal = "No applicant currently falls below the 60% match threshold."

    if strong_count:
        hiring_signal = (
            f"{strong_count} applicant{'s' if strong_count != 1 else ''} "
            f"show strong role alignment, while {attention_count} "
            f"need attention. {best_role_signal}"
        )
    elif attention_count:
        hiring_signal = (
            f"No applicant currently reaches the 80% strong-match threshold. "
            f"{attention_count} applicant{'s' if attention_count != 1 else ''} "
            f"need attention. {best_role_signal}"
        )
    else:
        hiring_signal = best_role_signal

    return {
        "total_jobs": len(jobs),
        "total_applications": total_applications,
        "average_match_score": average_match_score,
        "eligible_applications": eligible_count,
        "ineligible_applications": ineligible_count,
        "match_band_counts": match_band_counts,
        "status_distribution": dict(status_distribution),
        "top_applicant_skills": top_skills,
        "top_skill_gaps": top_skill_gaps,
        "required_skill_gaps": required_skill_gaps,
        "job_statistics": job_statistics,
        "best_role": best_role,
        "attention_role": attention_role,
        "hiring_signal": hiring_signal,
        "best_role_signal": best_role_signal,
        "attention_role_signal": attention_role_signal,
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