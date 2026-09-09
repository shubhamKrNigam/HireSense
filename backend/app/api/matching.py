from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db

from app.models.candidate import Candidate
from app.models.company import Company
from app.models.job import Job
from app.models.match_result import MatchResult
from app.models.skill import Skill
from app.models.user import User

from app.services.matching import calculate_match
from app.services.ranking import (
    rank_candidates_for_job,
    rank_jobs_for_candidate,
)


router = APIRouter(
    prefix="/matching",
    tags=["Matching"],
)


@router.get("/candidate/{candidate_id}/job/{job_id}")
def get_match(
    candidate_id: int,
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # ---------------------------------------------------------
    # 1. Get candidate
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
    # 2. Get job
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
    # 3. Candidate ownership check
    # ---------------------------------------------------------
    if (
        current_user.role == "candidate"
        and candidate.user_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="You can only view your own matching results.",
        )

    # ---------------------------------------------------------
    # 4. Calculate match
    # ---------------------------------------------------------
    result = calculate_match(
        candidate_id=candidate_id,
        job_id=job_id,
        db=db,
    )

    # ---------------------------------------------------------
    # 5. Resolve matched skills
    # ---------------------------------------------------------
    matched_skills = []

    if result.get("matched_skills"):
        matched_skills = (
            db.query(Skill)
            .filter(
                Skill.id.in_(result["matched_skills"])
            )
            .all()
        )

    # ---------------------------------------------------------
    # 6. Resolve missing skills
    # ---------------------------------------------------------
    missing_skills = []

    if result.get("missing_skills"):
        missing_skills = (
            db.query(Skill)
            .filter(
                Skill.id.in_(result["missing_skills"])
            )
            .all()
        )

    # ---------------------------------------------------------
    # 7. Resolve missing required skills
    # ---------------------------------------------------------
    missing_required_skills = []

    if result.get("missing_required_skills"):
        missing_required_skills = (
            db.query(Skill)
            .filter(
                Skill.id.in_(result["missing_required_skills"])
            )
            .all()
        )

    # ---------------------------------------------------------
    # 8. Save match result
    # ---------------------------------------------------------
    match_result = MatchResult(
        candidate_id=candidate_id,
        job_id=job_id,
        overall_score=result["match_score"],
        skill_score=result["skill_score"],
        text_similarity_score=result["text_similarity_score"],
        experience_score=result["experience_score"],
        education_score=result["education_score"],
        model_version="skill-text-experience-education-v4",
    )

    db.add(match_result)
    db.commit()
    db.refresh(match_result)

    # ---------------------------------------------------------
    # 9. Return explainable matching response
    # ---------------------------------------------------------
    return {
        "match_result_id": match_result.id,
        "candidate_id": candidate_id,
        "job_id": job_id,
        "job_title": job.title,

        # Overall technical/profile result
        "match_score": result["match_score"],
        "profile_fit_score": result.get(
            "profile_fit_score",
            result["match_score"],
        ),

        # Candidate preference intelligence
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

        # Component scores
        "skill_score": result["skill_score"],
        "text_similarity_score": result["text_similarity_score"],
        "experience_score": result["experience_score"],
        "education_score": result["education_score"],

        # Candidate experience
        "candidate_experience_years": result[
            "candidate_experience_years"
        ],

        # Skill results
        "matched_skills": [
            skill.name
            for skill in matched_skills
        ],

        "missing_skills": [
            skill.name
            for skill in missing_skills
        ],

        "missing_required_skills": [
            skill.name
            for skill in missing_required_skills
        ],

        # Eligibility
        "eligible": result.get("eligible", True),

        "eligibility_reasons": result.get(
            "eligibility_reasons",
            [],
        ),

        # Explainable skill evidence
        "skill_evidence": result.get(
            "skill_evidence",
            [],
        ),

        # Model information
        "model_version": match_result.model_version,
    }


@router.get("/candidate/jobs/recommended")
def get_recommended_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("candidate")
    ),
):
    """
    Return personalized job recommendations for the
    currently authenticated candidate.

    Recommendation ranking combines:

        70% Profile Fit
        30% Preference Fit

    Eligibility remains a hard ordering gate.

    This endpoint is candidate-facing and does not expose
    another candidate's recommendations.
    """

    # ---------------------------------------------------------
    # 1. Resolve the authenticated candidate
    # ---------------------------------------------------------
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
            detail="Candidate profile not found.",
        )

    # ---------------------------------------------------------
    # 2. Rank open jobs for this candidate
    # ---------------------------------------------------------
    rankings = rank_jobs_for_candidate(
        candidate_id=candidate.id,
        db=db,
        include_ineligible=True,
    )

    # ---------------------------------------------------------
    # 3. Return recommendation results
    # ---------------------------------------------------------
    return {
        "candidate_id": candidate.id,
        "candidate_name": candidate.full_name,
        "model_version": "skill-text-experience-education-v4",
        "job_count": len(rankings),
        "rankings": rankings,
    }


@router.get("/job/{job_id}/candidates")
def rank_job_candidates(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
):
    # ---------------------------------------------------------
    # 1. Get job
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
    # 2. Recruiter ownership check
    # ---------------------------------------------------------
    if current_user.role == "recruiter":
        company = (
            db.query(Company)
            .filter(
                Company.id == job.company_id,
                Company.created_by == current_user.id,
            )
            .first()
        )

        if not company:
            raise HTTPException(
                status_code=403,
                detail="You can only rank candidates for your own jobs.",
            )

    # ---------------------------------------------------------
    # 3. Rank candidates
    # ---------------------------------------------------------
    rankings = rank_candidates_for_job(
        job_id=job_id,
        db=db,
    )

    # ---------------------------------------------------------
    # 4. Return ranking results
    # ---------------------------------------------------------
    return {
        "job_id": job_id,
        "job_title": job.title,
        "model_version": "skill-text-experience-education-v4",
        "candidate_count": len(rankings),
        "rankings": rankings,
    }