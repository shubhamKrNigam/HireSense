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


# =========================================================
# CREATE COMPANY
# =========================================================

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
    # A recruiter should have only one company profile.
    existing_my_company = (
        db.query(Company)
        .filter(
            Company.created_by == current_user.id
        )
        .first()
    )

    if existing_my_company:
        raise HTTPException(
            status_code=400,
            detail="You already have a company profile. Please edit your existing company instead.",
        )

    # Prevent duplicate company names.
    existing_company = (
        db.query(Company)
        .filter(
            Company.name == company.name
        )
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


# =========================================================
# GET MY COMPANY
# =========================================================

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


# =========================================================
# UPDATE MY COMPANY
# =========================================================

@router.patch(
    "/my-company",
    response_model=CompanyResponse,
)
def update_my_company(
    company_data: CompanyCreate,
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

    # Prevent another company from using the same name.
    duplicate_company = (
        db.query(Company)
        .filter(
            Company.name == company_data.name,
            Company.id != company.id,
        )
        .first()
    )

    if duplicate_company:
        raise HTTPException(
            status_code=400,
            detail="Another company already uses this name.",
        )

    company.name = company_data.name
    company.industry = company_data.industry
    company.location = company_data.location
    company.website = (
        str(company_data.website)
        if company_data.website
        else None
    )

    db.commit()
    db.refresh(company)

    return company


# =========================================================
# GET COMPANY BY ID
# =========================================================

@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
def get_company(
    company_id: int,
    current_user: User = Depends(
        get_current_user
    ),
    db: Session = Depends(get_db),
):
    company = (
        db.query(Company)
        .filter(
            Company.id == company_id
        )
        .first()
    )

    if not company:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company