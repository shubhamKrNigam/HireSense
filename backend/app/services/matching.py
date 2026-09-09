from sqlalchemy.orm import Session

from app.models.candidate_skill import CandidateSkill
from app.models.candidate_preference import CandidatePreference
from app.models.education import Education
from app.models.experience import Experience
from app.models.job import Job
from app.models.job_skill import JobSkill
from app.models.project import Project
from app.models.resume import Resume
from app.models.skill import Skill
from app.services.education_scoring import calculate_education_score
from app.services.experience_scoring import (
    calculate_experience_score,
    calculate_experience_years,
)
from app.services.text_similarity import calculate_text_similarity
from app.services.preference_scoring import calculate_preference_fit


def normalize_text(value: str | None) -> str:
    if not value:
        return ""

    return " ".join(value.lower().strip().split())


def skill_appears_in_text(skill_name: str, text: str) -> bool:
    """
    Basic MVP evidence check.

    We intentionally use normalized text matching here rather than
    claiming that the candidate's actual proficiency has been verified.
    """

    if not skill_name or not text:
        return False

    return normalize_text(skill_name) in normalize_text(text)


def calculate_skill_score(
    candidate_skills,
    job_skills,
    resume_text: str,
    projects,
    experiences,
    skills_by_id,
):
    """
    Calculate an evidence-based skill score.

    Evidence sources:
    1. Candidate explicitly lists the skill.
    2. Skill appears in resume text.
    3. Skill appears in project information.
    4. Skill appears in experience information.

    Self-reported proficiency is intentionally NOT used as a major
    scoring factor because it is not independently verified.

    Skill classification:
    - matched: explicitly present in the candidate skill profile.
    - evidence_found: not in the profile, but supported by resume,
      project, or experience evidence.
    - missing: no meaningful evidence found.
    """

    candidate_skill_ids = {
        candidate_skill.skill_id
        for candidate_skill in candidate_skills
    }

    project_texts = []

    for project in projects:
        project_texts.append(
            " ".join(
                value
                for value in [
                    project.project_name,
                    project.project_type,
                    project.technologies,
                    project.description,
                ]
                if value
            )
        )

    experience_texts = []

    for experience in experiences:
        experience_texts.append(
            " ".join(
                value
                for value in [
                    experience.company_name,
                    experience.job_title,
                    experience.employment_type,
                    experience.description,
                ]
                if value
            )
        )

    total_weight = 0.0
    earned_weight = 0.0

    matched_skills = []
    evidence_found_skills = []
    missing_skills = []
    missing_required_skills = []

    skill_evidence = []

    for job_skill in job_skills:
        importance = float(job_skill.importance or 1.0)

        if job_skill.required:
            importance *= 1.5

        total_weight += importance

        skill = skills_by_id.get(job_skill.skill_id)

        if not skill:
            missing_skills.append(job_skill.skill_id)

            if job_skill.required:
                missing_required_skills.append(job_skill.skill_id)

            continue

        skill_name = skill.name

        profile_evidence = job_skill.skill_id in candidate_skill_ids

        resume_evidence = skill_appears_in_text(
            skill_name,
            resume_text,
        )

        project_evidence = any(
            skill_appears_in_text(skill_name, text)
            for text in project_texts
        )

        experience_evidence = any(
            skill_appears_in_text(skill_name, text)
            for text in experience_texts
        )

        # Evidence scoring.
        #
        # Explicit skill profile entry is useful evidence,
        # but supporting evidence increases confidence.
        evidence_score = 0.0

        if profile_evidence:
            evidence_score += 40.0

        if resume_evidence:
            evidence_score += 25.0

        if project_evidence:
            evidence_score += 20.0

        if experience_evidence:
            evidence_score += 15.0

        evidence_score = min(evidence_score, 100.0)

        # ---------------------------------------------------------
        # Skill classification
        # ---------------------------------------------------------
        if profile_evidence:
            status = "matched"
            matched_skills.append(job_skill.skill_id)

            earned_weight += (
                importance * (evidence_score / 100.0)
            )

        elif evidence_score > 0:
            # The skill is supported by other evidence even though
            # the candidate did not explicitly add it to their skill profile.
            status = "evidence_found"
            evidence_found_skills.append(job_skill.skill_id)

            # Evidence outside the explicit profile receives partial
            # credit because text presence alone does not prove depth.
            earned_weight += (
                importance
                * 0.50
                * (evidence_score / 100.0)
            )

        else:
            status = "missing"
            missing_skills.append(job_skill.skill_id)

            # A required skill is only considered missing when there
            # is no meaningful evidence for it anywhere in the profile.
            if job_skill.required:
                missing_required_skills.append(job_skill.skill_id)

        skill_evidence.append(
            {
                "skill_id": job_skill.skill_id,
                "skill": skill_name,
                "status": status,
                "evidence_score": round(evidence_score, 2),
                "profile": profile_evidence,
                "resume": resume_evidence,
                "projects": project_evidence,
                "experience": experience_evidence,
                "required": bool(job_skill.required),
            }
        )

    if total_weight == 0:
        skill_score = 100.0
    else:
        skill_score = (
            earned_weight / total_weight
        ) * 100

    return {
        "skill_score": round(
            min(max(skill_score, 0.0), 100.0),
            2,
        ),
        "matched_skills": matched_skills,
        "evidence_found_skills": evidence_found_skills,
        "missing_skills": missing_skills,
        "missing_required_skills": missing_required_skills,
        "skill_evidence": skill_evidence,
    }

def calculate_match(
    candidate_id: int,
    job_id: int,
    db: Session,
) -> dict:

    # ---------------------------------------------------------
    # 1. Candidate skills
    # ---------------------------------------------------------

    candidate_skills = (
        db.query(CandidateSkill)
        .filter(
            CandidateSkill.candidate_id == candidate_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # 2. Job skills
    # ---------------------------------------------------------

    job_skills = (
        db.query(JobSkill)
        .filter(JobSkill.job_id == job_id)
        .all()
    )

    # ---------------------------------------------------------
    # 3. Job
    # ---------------------------------------------------------

    job = (
        db.query(Job)
        .filter(Job.id == job_id)
        .first()
    )

    if not job:
        return {
            "match_score": 0.0,
            "skill_score": 0.0,
            "text_similarity_score": 0.0,
            "experience_score": 0.0,
            "education_score": 0.0,
            "candidate_experience_years": 0.0,
            "matched_skills": [],
            "missing_skills": [],
            "missing_required_skills": [],
            "skill_evidence": [],
            "eligible": False,
            "eligibility_reasons": ["Job not found"],
        }

    # ---------------------------------------------------------
    # 4. Resume
    # ---------------------------------------------------------

    resume = (
        db.query(Resume)
        .filter(
            Resume.candidate_id == candidate_id
        )
        .order_by(Resume.id.desc())
        .first()
    )

    candidate_text = (
        resume.extracted_text
        if resume
        else ""
    )

    # ---------------------------------------------------------
    # 5. Projects
    # ---------------------------------------------------------

    projects = (
        db.query(Project)
        .filter(
            Project.candidate_id == candidate_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # 6. Experience
    # ---------------------------------------------------------

    experiences = (
        db.query(Experience)
        .filter(
            Experience.candidate_id == candidate_id
        )
        .all()
    )

    # ---------------------------------------------------------
    # 7. Skill evidence
    # ---------------------------------------------------------

    job_skill_ids = {
        job_skill.skill_id
        for job_skill in job_skills
    }

    skills = (
        db.query(Skill)
        .filter(Skill.id.in_(job_skill_ids))
        .all()
        if job_skill_ids
        else []
    )

    skills_by_id = {
        skill.id: skill
        for skill in skills
    }

    skill_result = calculate_skill_score(
        candidate_skills=candidate_skills,
        job_skills=job_skills,
        resume_text=candidate_text,
        projects=projects,
        experiences=experiences,
        skills_by_id=skills_by_id,
    )

    skill_score = skill_result["skill_score"]
    matched_skills = skill_result["matched_skills"]
    missing_skills = skill_result["missing_skills"]
    evidence_found_skills = skill_result["evidence_found_skills"]
    missing_required_skills = (
        skill_result["missing_required_skills"]
    )

    # ---------------------------------------------------------
    # 8. Resume text similarity
    # ---------------------------------------------------------

    job_text = job.description or ""

    text_similarity_score = calculate_text_similarity(
        candidate_text,
        job_text,
    )

    # ---------------------------------------------------------
    # 9. Experience
    # ---------------------------------------------------------

    candidate_experience_years = sum(
        calculate_experience_years(
            experience.start_date,
            experience.end_date,
        )
        for experience in experiences
    )

    experience_score = calculate_experience_score(
        candidate_experience_years,
        job.experience_min,
        job.experience_max,
    )

    # ---------------------------------------------------------
    # 10. Education
    # ---------------------------------------------------------

    education = (
        db.query(Education)
        .filter(
            Education.candidate_id == candidate_id
        )
        .order_by(Education.id.desc())
        .first()
    )

    education_score = calculate_education_score(
        candidate_degree=(
            education.degree
            if education
            else None
        ),
        candidate_field_of_study=(
            education.field_of_study
            if education
            else None
        ),
        candidate_grade=(
            education.grade
            if education
            else None
        ),
        required_degree=job.minimum_degree,
        required_field_of_study=(
            job.required_field_of_study
        ),
        minimum_grade=job.minimum_grade,
    )

    # ---------------------------------------------------------
    # 11. Eligibility
    # ---------------------------------------------------------

    eligibility_reasons = []

    if missing_required_skills:
        eligibility_reasons.append(
            "Missing required skills"
        )

    if job.minimum_degree:
        candidate_degree = (
            education.degree
            if education
            else None
        )

        if (
            not candidate_degree
            or candidate_degree.strip().lower()
            != job.minimum_degree.strip().lower()
        ):
            eligibility_reasons.append(
                "Minimum degree requirement not satisfied"
            )

    if job.required_field_of_study:
        candidate_field = (
            education.field_of_study
            if education
            else None
        )

        if (
            not candidate_field
            or candidate_field.strip().lower()
            != job.required_field_of_study.strip().lower()
        ):
            eligibility_reasons.append(
                "Required field of study not satisfied"
            )

    if job.minimum_grade is not None:
        candidate_grade = (
            education.grade
            if education
            else None
        )

        if (
            candidate_grade is None
            or candidate_grade < job.minimum_grade
        ):
            eligibility_reasons.append(
                "Minimum grade requirement not satisfied"
            )

    eligible = len(eligibility_reasons) == 0

    # ---------------------------------------------------------
    # 12. Preference fit
    # ---------------------------------------------------------
    preferences = (
        db.query(CandidatePreference)
        .filter(CandidatePreference.candidate_id == candidate_id)
        .first()
    )

    preference_result = calculate_preference_fit(
        preferences=preferences,
        job=job,
    )

    preference_fit_score = preference_result["preference_fit_score"]

    # IMPORTANT:
    # match_score remains the technical/profile compatibility score.
    # Preference fit is kept separate so HireSense can distinguish
    # "what the candidate wants" from "what the candidate can currently do".
    #
    # Recommendation ranking can later combine both signals without
    # corrupting the technical match score.

    # ---------------------------------------------------------
    # 13. Overall score
    # ---------------------------------------------------------

    overall_score = (
        (skill_score * 0.50)
        + (text_similarity_score * 0.15)
        + (experience_score * 0.15)
        + (education_score * 0.20)
    )

    # ---------------------------------------------------------
    # 14. Final result
    # ---------------------------------------------------------

    return {
        "match_score": round(
            overall_score,
            2,
        ),
        "profile_fit_score": round(
            overall_score,
            2,
        ),
        "preference_fit_score": preference_fit_score,
        "preference_details": preference_result["details"],
        "preference_reasons": preference_result["reasons"],
        "skill_score": round(
            skill_score,
            2,
        ),
        "text_similarity_score": round(
            text_similarity_score,
            2,
        ),
        "experience_score": round(
            experience_score,
            2,
        ),
        "education_score": round(
            education_score,
            2,
        ),
        "candidate_experience_years": round(
            candidate_experience_years,
            2,
        ),
        "matched_skills": matched_skills,
        "evidence_found_skills": evidence_found_skills,
        "missing_skills": missing_skills,
        "missing_required_skills": missing_required_skills,
        "skill_evidence": skill_result[
            "skill_evidence"
        ],
        "eligible": eligible,
        "eligibility_reasons": eligibility_reasons,
    }