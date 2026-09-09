from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user, require_role
from app.db.session import get_db
from app.models.company import Company
from app.models.user import User
from app.schemas.company import CompanyCreate, CompanyResponse

router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=201,
)
def create_company(
    company: CompanyCreate,
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    existing_company = (
        db.query(Company)
        .filter(Company.name == company.name)
        .first()
    )

    if existing_company:
        raise HTTPException(
            status_code=400,
            detail="Company already exists",
        )

    new_company = Company(
        name=company.name,
        industry=company.industry,
        location=company.location,
        website=(
            str(company.website)
            if company.website
            else None
        ),
        created_by=current_user.id,
    )

    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    return new_company


@router.get(
    "/my-company",
    response_model=CompanyResponse,
)
def get_my_company(
    current_user: User = Depends(
        require_role("recruiter", "admin")
    ),
    db: Session = Depends(get_db),
):
    company = (
        db.query(Company)
        .filter(
            Company.created_by == current_user.id
        )
        .order_by(Company.id.asc())
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="No company found for this recruiter",
        )

    return company


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
def get_company(
    company_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    company = (
        db.query(Company)
        .filter(Company.id == company_id)
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company