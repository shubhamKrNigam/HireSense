import re


SKILL_ALIASES = {
    "python": "Python",
    "fastapi": "FastAPI",
    "sql": "SQL",
    "pandas": "Pandas",
    "machine learning": "Machine Learning",
    "scikit-learn": "Scikit-learn",
    "sklearn": "Scikit-learn",
    "react": "React",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "mysql": "MySQL",
    "postgresql": "PostgreSQL",
    "git": "Git",
    "github": "GitHub",
    "docker": "Docker",
    "html": "HTML",
    "css": "CSS",
}


def extract_skills(text: str) -> list[str]:
    if not text:
        return []

    normalized_text = re.sub(
        r"\s+",
        " ",
        text.lower(),
    )

    found_skills = []

    for alias, canonical_name in SKILL_ALIASES.items():
        pattern = rf"(?<!\w){re.escape(alias)}(?!\w)"

        if re.search(pattern, normalized_text):
            found_skills.append(canonical_name)

    return sorted(found_skills)