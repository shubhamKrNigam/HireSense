from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
)
from app.models.user import User
from app.api.auth import get_current_user


router = APIRouter(prefix="/projects", tags=["Projects"])


def get_current_candidate(
    current_user: User,
    db: Session,
):
    candidate = (
        db.query(__import__("app.models.candidate", fromlist=["Candidate"]).Candidate)
        .filter(
            __import__("app.models.candidate", fromlist=["Candidate"]).Candidate.user_id
            == current_user.id
        )
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate profile not found",
        )

    return candidate


@router.post(
    "/",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = get_current_candidate(current_user, db)

    if project.candidate_id != candidate.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only create projects for your own profile",
        )

    if project.start_date and project.end_date:
        if project.end_date != "Present" and project.end_date < project.start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be before start date",
            )

    new_project = Project(
        candidate_id=candidate.id,
        project_name=project.project_name,
        project_type=project.project_type,
        technologies=project.technologies,
        project_link=project.project_link,
        start_date=project.start_date,
        end_date=project.end_date,
        description=project.description,
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    return new_project


@router.get(
    "/me",
    response_model=list[ProjectResponse],
)
def get_my_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = get_current_candidate(current_user, db)

    return (
        db.query(Project)
        .filter(Project.candidate_id == candidate.id)
        .order_by(Project.id.desc())
        .all()
    )


@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
)
def update_project(
    project_id: int,
    project: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = get_current_candidate(current_user, db)

    existing_project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.candidate_id == candidate.id,
        )
        .first()
    )

    if not existing_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    update_data = project.model_dump(exclude_unset=True)

    start_date = update_data.get(
        "start_date",
        existing_project.start_date,
    )

    end_date = update_data.get(
        "end_date",
        existing_project.end_date,
    )

    if start_date and end_date and end_date != "Present":
        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date cannot be before start date",
            )

    for field, value in update_data.items():
        setattr(existing_project, field, value)

    db.commit()
    db.refresh(existing_project)

    return existing_project


@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    candidate = get_current_candidate(current_user, db)

    existing_project = (
        db.query(Project)
        .filter(
            Project.id == project_id,
            Project.candidate_id == candidate.id,
        )
        .first()
    )

    if not existing_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    db.delete(existing_project)
    db.commit()

    return None