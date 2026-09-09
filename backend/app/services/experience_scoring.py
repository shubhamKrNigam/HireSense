from datetime import date


def calculate_experience_years(start_date: str | None, end_date: str | None) -> float:
    if not start_date:
        return 0.0

    try:
        start_year, start_month = map(int, start_date.split("-"))

        if end_date:
            end_year, end_month = map(int, end_date.split("-"))
        else:
            today = date.today()
            end_year = today.year
            end_month = today.month

        months = (end_year - start_year) * 12 + (end_month - start_month)

        return max(round(months / 12, 2), 0.0)

    except (ValueError, TypeError):
        return 0.0


def calculate_experience_score(
    candidate_experience_years: float,
    experience_min: float | None,
    experience_max: float | None,
) -> float:

    if experience_min is None and experience_max is None:
        return 100.0

    minimum = experience_min or 0.0

    if candidate_experience_years < minimum:
        if minimum == 0:
            return 100.0

        score = (candidate_experience_years / minimum) * 100
        return round(max(min(score, 100.0), 0.0), 2)

    if experience_max is not None:
        if candidate_experience_years <= experience_max:
            return 100.0

        # Gradually reduce the score when experience exceeds
        # the requested maximum.
        excess = candidate_experience_years - experience_max
        score = 100.0 - (excess * 25.0)

        return round(max(min(score, 100.0), 0.0), 2)

    return 100.0