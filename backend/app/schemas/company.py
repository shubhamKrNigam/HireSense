from pydantic import BaseModel, HttpUrl


class CompanyBase(BaseModel):
    name: str
    description: str | None = None
    location: str | None = None
    website: HttpUrl | None = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    id: int

    class Config:
        from_attributes = True
