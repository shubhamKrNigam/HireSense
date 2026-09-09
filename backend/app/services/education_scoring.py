def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.lower().strip().split())


def calculate_education_score(
    candidate_degree: str | None,
    candidate_field_of_study: str | None,
    candidate_grade: float | None,
    required_degree: str | None,
    required_field_of_study: str | None,
    minimum_grade: float | None,
) -> float:
    """
    Calculate education compatibility score from 0 to 100.

    Components:
    - Degree match: 40 points
    - Field of study match: 40 points
    - Minimum grade requirement: 20 points
    """

    # If the job has no education requirements, don't penalize the candidate.
    if not required_degree and not required_field_of_study and minimum_grade is None:
        return 100.0

    score = 0.0

    # Degree match
    if required_degree:
        if normalize_text(candidate_degree) == normalize_text(required_degree):
            score += 40.0

    # Field of study match
    if required_field_of_study:
        candidate_field = normalize_text(candidate_field_of_study)
        required_field = normalize_text(required_field_of_study)

        if candidate_field == required_field:
            score += 40.0
        elif candidate_field and required_field:
            # Allow partial field matches such as:
            # "Computer Science" vs "Computer Science and Engineering"
            if candidate_field in required_field or required_field in candidate_field:
                score += 20.0

    # Grade requirement
    if minimum_grade is not None:
        if candidate_grade is not None and candidate_grade >= minimum_grade:
            score += 20.0
    else:
        # No grade requirement means no penalty.
        score += 20.0

    return round(score, 2)