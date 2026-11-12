from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import User, InvitationCode, MentorMenteeAssignment
from app.api.deps import get_current_mentor, get_current_mentee
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import secrets

router = APIRouter()

class InvitationCodeCreate(BaseModel):
    max_uses: Optional[int] = 10
    expires_in_days: Optional[int] = 7

class InvitationCodeResponse(BaseModel):
    id: int
    code: str
    max_uses: int
    current_uses: int
    is_active: bool
    expires_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class JoinMentorRequest(BaseModel):
    code: str

class MenteeProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str
    assigned_at: datetime

    class Config:
        from_attributes = True

@router.post("/generate-code", response_model=InvitationCodeResponse)
def generate_invitation_code(
    payload: InvitationCodeCreate,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    code = secrets.token_hex(4).upper()
    expires_at = datetime.utcnow() + timedelta(days=payload.expires_in_days) if payload.expires_in_days else None

    db_code = InvitationCode(
        mentor_id=current_user.id,
        code=code,
        max_uses=payload.max_uses,
        expires_at=expires_at,
        is_active=True
    )
    db.add(db_code)
    db.commit()
    db.refresh(db_code)
    return db_code

@router.post("/join", response_model=dict)
def join_mentor(
    payload: JoinMentorRequest,
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    # Check if mentee already has an active mentor
    existing_assignment = db.query(MentorMenteeAssignment).filter(
        MentorMenteeAssignment.mentee_id == current_user.id,
        MentorMenteeAssignment.status == "active"
    ).first()

    if existing_assignment:
        raise HTTPException(status_code=400, detail="Mentee is already assigned to a mentor")

    invitation = db.query(InvitationCode).filter(
        InvitationCode.code == payload.code,
        InvitationCode.is_active == True
    ).first()

    if not invitation:
        raise HTTPException(status_code=404, detail="Invalid or inactive invitation code")

    if invitation.expires_at and invitation.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Invitation code has expired")

    if invitation.current_uses >= invitation.max_uses:
        raise HTTPException(status_code=400, detail="Invitation code usage limit reached")

    # Create assignment
    assignment = MentorMenteeAssignment(
        mentor_id=invitation.mentor_id,
        mentee_id=current_user.id,
        status="active"
    )
    db.add(assignment)

    # Update invitation usage
    invitation.current_uses += 1
    if invitation.current_uses >= invitation.max_uses:
        invitation.is_active = False

    db.commit()
    return {"message": "Successfully joined mentor", "mentor_id": invitation.mentor_id}

@router.get("/my-mentees", response_model=List[MenteeProfileResponse])
def get_mentor_mentees(
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    assignments = db.query(MentorMenteeAssignment).filter(
        MentorMenteeAssignment.mentor_id == current_user.id,
        MentorMenteeAssignment.status == "active"
    ).all()

    result = []
    for assg in assignments:
        mentee = db.query(User).filter(User.id == assg.mentee_id).first()
        if mentee:
            result.append({
                "id": mentee.id,
                "full_name": mentee.full_name,
                "email": mentee.email,
                "assigned_at": assg.assigned_at
            })
    return result

class MentorProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str

    class Config:
        from_attributes = True

@router.get("/my-mentor", response_model=Optional[MentorProfileResponse])
def get_my_mentor(
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    assignment = db.query(MentorMenteeAssignment).filter(
        MentorMenteeAssignment.mentee_id == current_user.id,
        MentorMenteeAssignment.status == "active"
    ).first()

    if not assignment:
        return None

    mentor = db.query(User).filter(User.id == assignment.mentor_id).first()
    if not mentor:
        return None

    return {
        "id": mentor.id,
        "full_name": mentor.full_name,
        "email": mentor.email
    }