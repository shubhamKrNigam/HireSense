from pydantic import BaseModel, Field


class ProjectBase(BaseModel):
    project_name: str
    project_type: str | None = None
    technologies: str | None = None
    project_link: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class ProjectCreate(ProjectBase):
    candidate_id: int


class ProjectUpdate(BaseModel):
    project_name: str | None = None
    project_type: str | None = None
    technologies: str | None = None
    project_link: str | None = None
    start_date: str | None = None
    end_date: str | None = None
    description: str | None = None


class ProjectResponse(ProjectBase):
    id: int
    candidate_id: int

    class Config:
        from_attributes = True