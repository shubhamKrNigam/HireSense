"""
Preference-aware job fit scoring for HireSense.

This module measures how well a job matches the candidate's stated
career preferences. It deliberately remains separate from technical
profile matching so a candidate can want one career direction while
currently being better qualified for another.
"""

import re


ROLE_ALIASES = {
    "software engineer": {"software engineer", "software developer", "sde"},
    "backend developer": {"backend developer", "backend engineer", "server side developer"},
    "frontend developer": {"frontend developer", "front end developer", "frontend engineer"},
    "full stack developer": {"full stack developer", "fullstack developer", "full-stack developer"},
    "data analyst": {"data analyst", "data analytics analyst"},
    "data scientist": {"data scientist"},
    "machine learning engineer": {"machine learning engineer", "ml engineer"},
    "ai engineer": {"ai engineer", "artificial intelligence engineer"},
    "python developer": {"python developer", "python engineer"},
    "data engineer": {"data engineer"},
    "business analyst": {"business analyst"},
    "product analyst": {"product analyst"},
    "product manager": {"product manager"},
    "ui/ux designer": {"ui/ux designer", "ui ux designer", "ux designer", "ui designer"},
    "qa engineer": {"qa engineer", "quality assurance engineer"},
    "cybersecurity analyst": {"cybersecurity analyst", "security analyst"},
    "cloud engineer": {"cloud engineer"},
    "devops engineer": {"devops engineer", "devops"},
}


def normalize(value):
    if value is None:
        return ""
    value = str(value).strip().lower()
    return re.sub(r"\s+", " ", value)


def _role_matches(preferred_role, job_title):
    preferred = normalize(preferred_role)
    title = normalize(job_title)

    if not preferred or not title:
        return False

    aliases = ROLE_ALIASES.get(preferred, {preferred})
    return any(alias in title for alias in aliases)


def _location_matches(preferred, job_location):
    preferred = normalize(preferred)
    location = normalize(job_location)

    if not preferred or not location:
        return False

    if preferred == "remote":
        return location == "remote" or "remote" in location

    if location == "remote":
        return False

    return preferred in location or location in preferred


def _experience_matches(preferred, job_level):
    preferred = normalize(preferred)
    level = normalize(job_level)

    if not preferred or not level:
        return False

    aliases = {
        "entry level": {"entry level", "entry-level", "fresher", "graduate"},
        "junior": {"junior", "entry level", "entry-level"},
        "mid level": {"mid level", "mid-level", "intermediate"},
        "senior": {"senior", "senior level", "senior-level"},
    }

    return bool(aliases.get(preferred, {preferred}) & {level})


def calculate_preference_fit(preferences, job):
    """
    Return a preference fit score and explainable component details.

    Dimensions:
      - preferred role: 35
      - preferred location: 25
      - work mode: 20 (only when the job actually provides it)
      - employment type: 10
      - experience level: 10

    If a candidate has no preference for a dimension, that dimension is
    excluded and the remaining configured dimensions are normalized to 100.
    This prevents missing preferences from unfairly lowering the score.
    """

    if not preferences:
        return {
            "preference_fit_score": 0.0,
            "details": {},
            "reasons": ["No career preferences have been configured yet."],
        }

    configured = []
    details = {}
    reasons = []

    def add_dimension(name, weight, selected, matched, reason_yes, reason_no):
        if not selected:
            return
        configured.append((name, weight, matched))
        details[name] = {
            "selected": selected,
            "matched": matched,
        }
        reasons.append(reason_yes if matched else reason_no)

    roles = list(preferences.preferred_roles or [])
    locations = list(preferences.preferred_locations or [])
    work_modes = list(preferences.work_modes or [])
    employment_types = list(preferences.employment_types or [])
    experience_level = preferences.experience_level

    role_match = any(_role_matches(role, job.title) for role in roles)
    add_dimension(
        "role",
        35,
        roles,
        role_match,
        "Job title aligns with one of your preferred roles.",
        "Job title does not align with your preferred roles.",
    )

    location_match = any(_location_matches(location, job.location) for location in locations)
    add_dimension(
        "location",
        25,
        locations,
        location_match,
        "Job location matches one of your preferred locations.",
        "Job location does not match your preferred locations.",
    )

    # Work mode is intentionally optional until recruiter job records
    # expose a work_mode field. This keeps the scorer backward-compatible.
    job_work_mode = getattr(job, "work_mode", None)
    if work_modes and job_work_mode:
        work_mode_match = normalize(job_work_mode) in {
            normalize(mode) for mode in work_modes
        }
        add_dimension(
            "work_mode",
            20,
            work_modes,
            work_mode_match,
            "Work mode matches one of your preferences.",
            "Work mode does not match your preferences.",
        )

    employment_match = any(
        normalize(job.employment_type) == normalize(value)
        for value in employment_types
    )
    add_dimension(
        "employment_type",
        10,
        employment_types,
        employment_match,
        "Employment type matches your preferences.",
        "Employment type does not match your preferences.",
    )

    experience_match = _experience_matches(
        experience_level,
        job.experience_level,
    )
    add_dimension(
        "experience_level",
        10,
        [experience_level] if experience_level else [],
        experience_match,
        "Experience level matches your preference.",
        "Experience level does not match your preference.",
    )

    if not configured:
        return {
            "preference_fit_score": 0.0,
            "details": {},
            "reasons": ["No job preferences have been configured yet."],
        }

    total_weight = sum(weight for _, weight, _ in configured)
    earned_weight = sum(weight for _, weight, matched in configured if matched)

    score = round((earned_weight / total_weight) * 100, 2)

    return {
        "preference_fit_score": score,
        "details": details,
        "reasons": reasons,
    }
