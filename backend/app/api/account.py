from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.user import User


router = APIRouter(
    prefix="/account",
    tags=["Account"],
)


class AccountUpdate(BaseModel):
    name: str
    email: str
    position: str | None = None


class AccountResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    position: str | None = None

    class Config:
        from_attributes = True


@router.put(
    "/me",
    response_model=AccountResponse,
)
def update_my_account(
    data: AccountUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    email = data.email.strip().lower()

    if not email or "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email address",
        )

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Name is required",
        )

    existing_user = (
        db.query(User)
        .filter(
            User.email == email,
            User.id != current_user.id,
        )
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="This email is already in use",
        )

    current_user.name = name
    current_user.email = email

    # Position is relevant to recruiter accounts.
    # Existing position remains unchanged for other roles.
    if current_user.role == "recruiter":
        position = (
            data.position.strip()
            if data.position
            else None
        )

        current_user.position = position

    db.commit()
    db.refresh(current_user)

    return current_user