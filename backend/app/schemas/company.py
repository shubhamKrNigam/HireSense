from pydantic import BaseModel, HttpUrl


class CompanyBase(BaseModel):
    name: str
    industry: str | None = None
    location: str | None = None
    website: HttpUrl | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int
    created_by: int | None = None

    class Config:
        from_attributes = True