"""
Ranking services for HireSense.

This module provides two separate ranking flows:

1. Recruiter-side candidate ranking for a specific job.
2. Candidate-side job recommendation ranking.

Important design rule:
- match_score / profile_fit_score remains the technical/profile score.
- preference_fit_score remains the candidate-preference score.
- recommendation_score combines both only for recommendation ranking.
- Eligibility remains a hard gate so an ineligible job cannot outrank
  an eligible recommendation.
"""

from sqlalchemy.orm import Session

from app.models.application import Application
from app.models.candidate import Candidate
from app.models.company import Company
from app.models.job import Job
from app.services.matching import calculate_match


MODEL_VERSION = "skill-text-experience-education-v4"

PROFILE_WEIGHT = 0.70
PREFERENCE_WEIGHT = 0.30


def calculate_recommendation_score(
    profile_fit_score: float,
    preference_fit_score: float,
    eligible: bool,
    preferences_configured: bool,
) -> float:
    """
    Calculate the candidate-side recommendation score.

    Profile fit is deliberately weighted more heavily than preferences.
    This prevents a candidate's preferences from hiding a weak technical
    or educational fit.

    If no preferences have been configured, recommendation ranking falls
    back to the technical/profile fit score instead of artificially
    penalizing the candidate.
    """

    profile_score = float(profile_fit_score or 0.0)
    preference_score = float(preference_fit_score or 0.0)

    if not eligible:
        return 0.0

    if not preferences_configured:
        return round(profile_score, 2)

    score = (
        (profile_score * PROFILE_WEIGHT)
        + (preference_score * PREFERENCE_WEIGHT)
    )

    return round(score, 2)


def _preferences_are_configured(result: dict) -> bool:
    """
    Determine whether the candidate has actually configured preferences.

    preference_fit_score == 0 is not enough to determine this because a
    configured preference can legitimately produce a 0 score.
    """

    reasons = result.get("preference_reasons") or []

    no_preferences_message = (
        "No job preferences have been configured yet."
    )

    return no_preferences_message not in reasons


def rank_candidates_for_job(
    job_id: int,
    db: Session,
) -> list[dict]:
    """
    Rank all candidates for a recruiter job.

    Existing recruiter ranking behavior is preserved:
    eligible candidates come first, followed by higher technical match
    scores.

    Preference signals are added separately so the recruiter can see
    what the candidate wants without changing the technical ranking.
    """

    candidates = (
        db.query(Candidate)
        .order_by(Candidate.id.asc())
        .all()
    )

    ranked_candidates = []

    for candidate in candidates:
        result = calculate_match(
            candidate.id,
            job_id,
            db,
        )

        application = (
            db.query(Application)
            .filter(
                Application.candidate_id == candidate.id,
                Application.job_id == job_id,
            )
            .first()
        )

        application_status = (
            application.status
            if application
            else "not_applied"
        )

        preferences_configured = _preferences_are_configured(
            result
        )

        recommendation_score = calculate_recommendation_score(
            profile_fit_score=result.get(
                "profile_fit_score",
                result.get("match_score", 0.0),
            ),
            preference_fit_score=result.get(
                "preference_fit_score",
                0.0,
            ),
            eligible=result["eligible"],
            preferences_configured=preferences_configured,
        )

        ranked_candidates.append(
            {
                "candidate_id": candidate.id,
                "candidate_name": candidate.full_name,

                "eligible": result["eligible"],
                "eligibility_reasons": result[
                    "eligibility_reasons"
                ],

                # Existing technical/profile score.
                "match_score": result["match_score"],
                "profile_fit_score": result.get(
                    "profile_fit_score",
                    result["match_score"],
                ),

                # Candidate preference signal.
                "preference_fit_score": result.get(
                    "preference_fit_score",
                    0.0,
                ),
                "preference_details": result.get(
                    "preference_details",
                    {},
                ),
                "preference_reasons": result.get(
                    "preference_reasons",
                    [],
                ),

                # Recommendation score is exposed separately.
                "recommendation_score": recommendation_score,

                "skill_score": result["skill_score"],
                "text_similarity_score": result[
                    "text_similarity_score"
                ],
                "experience_score": result[
                    "experience_score"
                ],
                "education_score": result[
                    "education_score"
                ],

                "candidate_experience_years": result[
                    "candidate_experience_years"
                ],

                "matched_skills": result[
                    "matched_skills"
                ],
                "evidence_found_skills": result.get(
                    "evidence_found_skills",
                    [],
                ),
                "missing_skills": result[
                    "missing_skills"
                ],
                "missing_required_skills": result[
                    "missing_required_skills"
                ],

                "application_status": application_status,

                "model_version": MODEL_VERSION,
            }
        )

    # IMPORTANT:
    # Recruiter ranking remains based on technical/profile suitability.
    # Preferences are displayed separately and do not change recruiter
    # candidate ranking at this stage.
    ranked_candidates.sort(
        key=lambda candidate: (
            not candidate["eligible"],
            -candidate["match_score"],
            candidate["candidate_id"],
        )
    )

    for rank, candidate in enumerate(
        ranked_candidates,
        start=1,
    ):
        candidate["rank"] = rank

    return ranked_candidates


def rank_jobs_for_candidate(
    candidate_id: int,
    db: Session,
    include_ineligible: bool = True,
) -> list[dict]:
    """
    Rank open jobs for a candidate.

    Candidate-side ranking combines:

        70% Profile Fit
        30% Preference Fit

    Eligibility remains a hard ordering gate.

    Therefore:

        eligible + strong profile + strong preferences
            -> highest recommendation

        eligible + strong profile + weak preferences
            -> still recommended when profile fit is strong

        eligible + weak profile + strong preferences
            -> surfaced honestly, but not artificially promoted
               above substantially stronger profile fits

        ineligible jobs
            -> never outrank eligible jobs

    include_ineligible=True keeps useful career-discovery information
    available to the frontend. Ineligible jobs are always placed after
    eligible jobs and are marked as not recommended.
    """

    candidate = (
        db.query(Candidate)
        .filter(Candidate.id == candidate_id)
        .first()
    )

    if not candidate:
        return []

    jobs = (
        db.query(Job)
        .filter(Job.status == "open")
        .order_by(Job.id.asc())
        .all()
    )

    ranked_jobs = []

    for job in jobs:
        result = calculate_match(
            candidate_id,
            job.id,
            db,
        )

        eligible = bool(result.get("eligible", False))

        if not include_ineligible and not eligible:
            continue

        profile_fit_score = float(
            result.get(
                "profile_fit_score",
                result.get("match_score", 0.0),
            )
            or 0.0
        )

        preference_fit_score = float(
            result.get(
                "preference_fit_score",
                0.0,
            )
            or 0.0
        )

        preferences_configured = (
            _preferences_are_configured(result)
        )

        recommendation_score = (
            calculate_recommendation_score(
                profile_fit_score=profile_fit_score,
                preference_fit_score=preference_fit_score,
                eligible=eligible,
                preferences_configured=preferences_configured,
            )
        )

        application = (
            db.query(Application)
            .filter(
                Application.candidate_id == candidate_id,
                Application.job_id == job.id,
            )
            .first()
        )

        application_status = (
            application.status
            if application
            else "not_applied"
        )

        company = (
            db.query(Company)
            .filter(Company.id == job.company_id)
            .first()
        )

        company_name = (
            company.name
            if company
            else f"Company #{job.company_id}"
        )

        ranked_jobs.append(
            {
                "job_id": job.id,
                "job_title": job.title,
                "company_id": job.company_id,
                "company_name": company_name,

                "location": job.location,
                "work_mode": getattr(
                    job,
                    "work_mode",
                    None,
                ),
                "employment_type": job.employment_type,
                "experience_level": job.experience_level,

                # Separate intelligence signals.
                "profile_fit_score": round(
                    profile_fit_score,
                    2,
                ),
                "preference_fit_score": round(
                    preference_fit_score,
                    2,
                ),
                "recommendation_score": round(
                    recommendation_score,
                    2,
                ),

                # Keep match_score available for existing consumers.
                "match_score": round(
                    float(
                        result.get(
                            "match_score",
                            profile_fit_score,
                        )
                        or 0.0
                    ),
                    2,
                ),

                "eligible": eligible,
                "eligibility_reasons": result.get(
                    "eligibility_reasons",
                    [],
                ),

                "skill_score": result.get(
                    "skill_score",
                    0.0,
                ),
                "text_similarity_score": result.get(
                    "text_similarity_score",
                    0.0,
                ),
                "experience_score": result.get(
                    "experience_score",
                    0.0,
                ),
                "education_score": result.get(
                    "education_score",
                    0.0,
                ),

                "candidate_experience_years": result.get(
                    "candidate_experience_years",
                    0.0,
                ),

                "matched_skills": result.get(
                    "matched_skills",
                    [],
                ),
                "evidence_found_skills": result.get(
                    "evidence_found_skills",
                    [],
                ),
                "missing_skills": result.get(
                    "missing_skills",
                    [],
                ),
                "missing_required_skills": result.get(
                    "missing_required_skills",
                    [],
                ),

                "preference_details": result.get(
                    "preference_details",
                    {},
                ),
                "preference_reasons": result.get(
                    "preference_reasons",
                    [],
                ),

                "application_status": application_status,

                # Explicitly tells the UI whether this should be
                # presented as a recommendation.
                "recommended": eligible,

                "model_version": MODEL_VERSION,
            }
        )

    # ---------------------------------------------------------
    # Candidate recommendation ordering
    # ---------------------------------------------------------
    #
    # 1. Eligible jobs first.
    # 2. Higher recommendation score first.
    # 3. Higher profile fit breaks ties.
    # 4. Lower job ID provides deterministic ordering.
    #
    # This means preferences influence discovery without
    # overriding actual candidate suitability.
    # ---------------------------------------------------------

    ranked_jobs.sort(
        key=lambda job: (
            not job["eligible"],
            -job["recommendation_score"],
            -job["profile_fit_score"],
            job["job_id"],
        )
    )

    for rank, job in enumerate(
        ranked_jobs,
        start=1,
    ):
        job["rank"] = rank

    return ranked_jobs