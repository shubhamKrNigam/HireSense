from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.company import Company
from app.schemas.user import UserCreate, UserResponse
from app.core.security import hash_password
from app.services.notification_service import create_notification


router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


@router.post(
    "/",
    response_model=UserResponse,
    status_code=201,
)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
):
    # -----------------------------------------------------
    # Check duplicate email
    # -----------------------------------------------------

    existing_user = (
        db.query(User)
        .filter(
            User.email == user.email
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )

    # -----------------------------------------------------
    # Validate recruiter-specific information
    # -----------------------------------------------------

    if user.role == "recruiter":

        if not user.position or not user.position.strip():
            raise HTTPException(
                status_code=400,
                detail="Position / designation is required for recruiters.",
            )

        if not user.company:
            raise HTTPException(
                status_code=400,
                detail="Company details are required for recruiters.",
            )

        if not user.company.name.strip():
            raise HTTPException(
                status_code=400,
                detail="Company name is required for recruiters.",
            )

    # -----------------------------------------------------
    # Public registration rules
    #
    # Candidate:
    #   approved immediately
    #
    # Recruiter:
    #   requires Placement Officer approval
    # -----------------------------------------------------

    if user.role == "recruiter":
        approval_status = "pending"
    else:
        approval_status = "approved"

    # -----------------------------------------------------
    # Create user
    # -----------------------------------------------------

    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=hash_password(
            user.password
        ),
        role=user.role,
        position=(
            user.position.strip()
            if user.role == "recruiter"
            and user.position
            else None
        ),
        approval_status=approval_status,
    )

    db.add(new_user)
    db.flush()

    # -----------------------------------------------------
    # Create company for recruiter
    #
    # The company is linked to the newly created recruiter
    # through companies.created_by.
    # -----------------------------------------------------

    if user.role == "recruiter":

        company = Company(
            name=user.company.name.strip(),
            industry=(
                user.company.industry.strip()
                if user.company.industry
                else None
            ),
            location=(
                user.company.location.strip()
                if user.company.location
                else None
            ),
            website=(
                str(user.company.website)
                if user.company.website
                else None
            ),
            created_by=new_user.id,
        )

        db.add(company)

    # -----------------------------------------------------
    # Commit user + company together
    # -----------------------------------------------------

    db.commit()
    db.refresh(new_user)

    # -----------------------------------------------------
    # Notify Placement Officers about new recruiter
    # -----------------------------------------------------

    if user.role == "recruiter":

        placement_officers = (
            db.query(User)
            .filter(
                User.role == "placement_officer"
            )
            .all()
        )

        for officer in placement_officers:

            try:
                create_notification(
                    db=db,
                    user_id=officer.id,
                    title="New Recruiter Registration",
                    message=(
                        f"Recruiter '{new_user.name}' "
                        f"has registered with HireSense "
                        f"and is awaiting approval."
                    ),
                    notification_type="recruiter_registration",
                )

            except Exception as exc:
                print(
                    f"Failed to notify placement officer "
                    f"{officer.id}: {exc}"
                )

    return new_user


@router.get(
    "/{user_id}",
    response_model=UserResponse,
)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user