from pydantic import BaseModel, Field


class CandidatePreferenceBase(BaseModel):

    preferred_roles: list[str] = Field(
        default_factory=list,
        max_length=10,
    )

    preferred_locations: list[str] = Field(
        default_factory=list,
        max_length=15,
    )

    work_modes: list[str] = Field(
        default_factory=list,
        max_length=3,
    )

    employment_types: list[str] = Field(
        default_factory=list,
        max_length=5,
    )

    experience_level: str | None = None


class CandidatePreferenceUpdate(
    CandidatePreferenceBase
):
    pass


class CandidatePreferenceResponse(
    CandidatePreferenceBase
):
    id: int
    candidate_id: int

    class Config:
        from_attributes = True