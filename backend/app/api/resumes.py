from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.candidate_skill import CandidateSkill
from app.models.resume import Resume
from app.models.skill import Skill
from app.models.user import User
from app.schemas.resume import ResumeResponse
from app.services.resume_parser import extract_resume_text
from app.services.skill_extractor import extract_skills


router = APIRouter(
    prefix="/resumes",
    tags=["Resumes"],
)


UPLOAD_DIR = Path("uploads/resumes")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post(
    "/upload",
    response_model=ResumeResponse,
    status_code=201,
)
def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="File name is required",
        )

    extension = Path(file.filename).suffix.lower()

    if extension not in {".pdf", ".docx"}:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Only PDF and DOCX are supported.",
        )

    safe_filename = (
        f"candidate_{candidate.id}_{file.filename}"
    )

    file_path = UPLOAD_DIR / safe_filename

    try:
        file_content = file.file.read()
        file_path.write_bytes(file_content)

        extracted_text = extract_resume_text(str(file_path))

        # Extract technical skills from resume text
        extracted_skills = extract_skills(extracted_text)

    except Exception as exc:
        if file_path.exists():
            file_path.unlink()

        raise HTTPException(
            status_code=400,
            detail=f"Could not process resume: {str(exc)}",
        )

    # Save resume information
    new_resume = Resume(
        candidate_id=candidate.id,
        file_name=file.filename,
        file_path=str(file_path),
        file_type=file.content_type,
        extracted_text=extracted_text,
    )

    db.add(new_resume)

    # Save extracted skills into normalized skill tables
    for skill_name in extracted_skills:
        skill = (
            db.query(Skill)
            .filter(Skill.name == skill_name)
            .first()
        )

        # Create the skill if it does not already exist
        if not skill:
            skill = Skill(
                name=skill_name,
                category="technical",
            )
            db.add(skill)
            db.flush()

        # Avoid creating duplicate candidate-skill mappings
        existing_mapping = (
            db.query(CandidateSkill)
            .filter(
                CandidateSkill.candidate_id == candidate.id,
                CandidateSkill.skill_id == skill.id,
            )
            .first()
        )

        if not existing_mapping:
            candidate_skill = CandidateSkill(
                candidate_id=candidate.id,
                skill_id=skill.id,
                proficiency=None,
                years_used=None,
                source="resume",
            )

            db.add(candidate_skill)

    db.commit()
    db.refresh(new_resume)

    return new_resume


@router.get(
    "/me",
    response_model=list[ResumeResponse],
)
def get_my_resumes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    candidate = (
        db.query(Candidate)
        .filter(Candidate.user_id == current_user.id)
        .first()
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate profile not found",
        )

    resumes = (
        db.query(Resume)
        .filter(Resume.candidate_id == candidate.id)
        .order_by(Resume.id.desc())
        .all()
    )

    return resumes