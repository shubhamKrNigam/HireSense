from pydantic import BaseModel


class SkillBase(BaseModel):
    name: str
    category: str | None = None


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int

    class Config:
        from_attributes = True