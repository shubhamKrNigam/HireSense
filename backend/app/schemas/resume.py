from pydantic import BaseModel


class ResumeCreate(BaseModel):
    candidate_id: int
    file_name: str
    file_path: str
    file_type: str | None = None


class ResumeResponse(BaseModel):
    id: int
    candidate_id: int
    file_name: str
    file_path: str
    file_type: str | None = None
    extracted_text: str | None = None

    class Config:
        from_attributes = True