"""
Skill-gap intelligence for HireSense.

This service builds explainable skill-development signals from the existing
matching engine. It does not create a second matching model and does not
change profile-fit or recommendation scoring.
"""

from collections import defaultdict

from sqlalchemy.orm import Session

from app.models.job import Job
from app.services.matching import calculate_match
from app.services.ranking import rank_jobs_for_candidate



def _priority_for_skill(evidence: dict) -> str:
    """Classify development priority from existing matching evidence."""

    if evidence.get("status") == "missing":
        if evidence.get("required"):
            return "high"
        return "medium"

    evidence_score = float(evidence.get("evidence_score") or 0.0)

    if evidence_score < 50:
        return "medium"

    return "low"



def _development_status(evidence: dict) -> str:
    """Translate matching evidence into a candidate-friendly status."""

    status = evidence.get("status")
    evidence_score = float(evidence.get("evidence_score") or 0.0)

    if status == "missing":
        return "missing"

    if evidence_score >= 75:
        return "strong"

    return "developing"



def build_job_skill_gap(
    candidate_id: int,
    job_id: int,
    db: Session,
) -> dict:
    """Return a detailed, explainable skill-gap report for one job."""

    job = db.query(Job).filter(Job.id == job_id).first()

    if not job:
        return {
            "job_id": job_id,
            "job_title": None,
            "exists": False,
            "skill_gap_score": 0.0,
            "strong_skills": [],
            "developing_skills": [],
            "missing_skills": [],
            "high_priority_gaps": [],
            "skill_analysis": [],
        }

    match = calculate_match(
        candidate_id=candidate_id,
        job_id=job_id,
        db=db,
    )

    analysis = []

    for evidence in match.get("skill_evidence", []):
        status = _development_status(evidence)
        priority = _priority_for_skill(evidence)

        analysis.append(
            {
                "skill_id": evidence.get("skill_id"),
                "skill": evidence.get("skill"),
                "status": status,
                "priority": priority,
                "evidence_score": evidence.get("evidence_score", 0.0),
                "required": bool(evidence.get("required")),
                "evidence": {
                    "profile": bool(evidence.get("profile")),
                    "resume": bool(evidence.get("resume")),
                    "projects": bool(evidence.get("projects")),
                    "experience": bool(evidence.get("experience")),
                },
            }
        )

    strong_skills = [
        item["skill"]
        for item in analysis
        if item["status"] == "strong"
    ]

    developing_skills = [
        item["skill"]
        for item in analysis
        if item["status"] == "developing"
    ]

    missing_skills = [
        item["skill"]
        for item in analysis
        if item["status"] == "missing"
    ]

    high_priority_gaps = [
        item["skill"]
        for item in analysis
        if item["priority"] == "high"
    ]

    # This is intentionally a readiness signal, not a second matching score.
    # It summarizes the same evidence used by the technical skill component.
    skill_gap_score = round(float(match.get("skill_score") or 0.0), 2)

    return {
        "job_id": job.id,
        "job_title": job.title,
        "location": job.location,
        "work_mode": getattr(job, "work_mode", None),
        "employment_type": job.employment_type,
        "eligible": bool(match.get("eligible")),
        "eligibility_reasons": match.get("eligibility_reasons", []),
        "profile_fit_score": match.get("match_score", 0.0),
        "skill_gap_score": skill_gap_score,
        "strong_skills": strong_skills,
        "developing_skills": developing_skills,
        "missing_skills": missing_skills,
        "high_priority_gaps": high_priority_gaps,
        "skill_analysis": analysis,
    }



def build_candidate_skill_gap_overview(
    candidate_id: int,
    db: Session,
    max_jobs: int = 5,
) -> dict:
    """Aggregate skill gaps across the candidate's strongest eligible roles."""

    rankings = rank_jobs_for_candidate(
        candidate_id=candidate_id,
        db=db,
        include_ineligible=True,
    )

    eligible_rankings = [
        ranking
        for ranking in rankings
        if ranking.get("eligible")
    ][:max_jobs]

    target_jobs = []
    gap_counter = defaultdict(
        lambda: {
            "skill": "",
            "jobs_affected": 0,
            "required_jobs": 0,
            "priority_score": 0.0,
        }
    )

    strong_counter = defaultdict(int)
    developing_counter = defaultdict(int)

    for ranking in eligible_rankings:
        report = build_job_skill_gap(
            candidate_id=candidate_id,
            job_id=ranking["job_id"],
            db=db,
        )

        target_jobs.append(
            {
                "job_id": report["job_id"],
                "job_title": report["job_title"],
                "recommendation_score": ranking.get("recommendation_score", 0.0),
                "profile_fit_score": report["profile_fit_score"],
                "skill_gap_score": report["skill_gap_score"],
            }
        )

        for skill in report["strong_skills"]:
            strong_counter[skill] += 1

        for skill in report["developing_skills"]:
            developing_counter[skill] += 1

        for item in report["skill_analysis"]:
            if item["status"] != "missing":
                continue

            skill = item["skill"]
            entry = gap_counter[skill]
            entry["skill"] = skill
            entry["jobs_affected"] += 1

            if item["required"]:
                entry["required_jobs"] += 1
                entry["priority_score"] += 2.0
            else:
                entry["priority_score"] += 1.0

    priority_gaps = sorted(
        gap_counter.values(),
        key=lambda item: (
            -item["priority_score"],
            -item["required_jobs"],
            -item["jobs_affected"],
            item["skill"].lower(),
        ),
    )

    for item in priority_gaps:
        item["priority_score"] = round(item["priority_score"], 2)
        if item["required_jobs"] > 0:
            item["priority"] = "high"
        else:
            item["priority"] = "medium"

    return {
        "candidate_id": candidate_id,
        "model_version": "skill-text-experience-education-v4",
        "target_job_count": len(target_jobs),
        "target_jobs": target_jobs,
        "priority_gaps": priority_gaps[:10],
        "strong_skills": [
            {"skill": skill, "job_count": count}
            for skill, count in sorted(
                strong_counter.items(),
                key=lambda item: (-item[1], item[0].lower()),
            )[:10]
        ],
        "developing_skills": [
            {"skill": skill, "job_count": count}
            for skill, count in sorted(
                developing_counter.items(),
                key=lambda item: (-item[1], item[0].lower()),
            )[:10]
        ],
    }
