from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import ReportRequest, User, Notification
from app.api.deps import get_current_mentor, get_current_mentee, get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class ReportRequestCreate(BaseModel):
    mentor_id: int
    meeting_title: str
    meeting_date: str
    description: Optional[str] = None

class ReportRequestResponse(BaseModel):
    id: int
    mentee_id: int
    mentor_id: int
    meeting_title: str
    meeting_date: str
    description: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportRequestAction(BaseModel):
    action: str  # "accept" or "reject"
    rejection_reason: Optional[str] = None

@router.post("", response_model=ReportRequestResponse)
def create_report_request(
    payload: ReportRequestCreate,
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    # Verify mentor exists
    mentor = db.query(User).filter(User.id == payload.mentor_id, User.role == "mentor").first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    # Verify mentee is assigned to this mentor
    from app.models.models import MentorMenteeAssignment
    assignment = db.query(MentorMenteeAssignment).filter(
        MentorMenteeAssignment.mentor_id == payload.mentor_id,
        MentorMenteeAssignment.mentee_id == current_user.id,
        MentorMenteeAssignment.status == "active"
    ).first()

    if not assignment:
        raise HTTPException(status_code=403, detail="You are not assigned to this mentor")

    request = ReportRequest(
        mentee_id=current_user.id,
        mentor_id=payload.mentor_id,
        meeting_title=payload.meeting_title,
        meeting_date=datetime.fromisoformat(payload.meeting_date.replace("Z", "")),
        description=payload.description,
        status="pending"
    )
    db.add(request)
    db.commit()
    db.refresh(request)

    # Create notification for mentor
    notification = Notification(
        recipient_id=mentor.id,
        title="New Report Request",
        message=f"{current_user.full_name} requested a report for '{payload.meeting_title}'",
        notification_type="request",
        related_entity_id=request.id
    )
    db.add(notification)
    db.commit()

    return {
        "id": request.id,
        "mentee_id": request.mentee_id,
        "mentor_id": request.mentor_id,
        "meeting_title": request.meeting_title,
        "meeting_date": request.meeting_date.isoformat(),
        "description": request.description,
        "status": request.status,
        "created_at": request.created_at.isoformat(),
        "updated_at": request.updated_at.isoformat()
    }

@router.get("", response_model=List[ReportRequestResponse])
def list_report_requests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "mentor":
        requests = db.query(ReportRequest).filter(ReportRequest.mentor_id == current_user.id).order_by(ReportRequest.created_at.desc()).all()
    else:
        requests = db.query(ReportRequest).filter(ReportRequest.mentee_id == current_user.id).order_by(ReportRequest.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "mentee_id": r.mentee_id,
            "mentor_id": r.mentor_id,
            "meeting_title": r.meeting_title,
            "meeting_date": r.meeting_date.isoformat(),
            "description": r.description,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat()
        }
        for r in requests
    ]

@router.get("/{request_id}", response_model=ReportRequestResponse)
def get_report_request(
    request_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    request = db.query(ReportRequest).filter(ReportRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Report request not found")

    # Check access
    if current_user.role == "mentor" and request.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "mentee" and request.mentee_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "id": request.id,
        "mentee_id": request.mentee_id,
        "mentor_id": request.mentor_id,
        "meeting_title": request.meeting_title,
        "meeting_date": request.meeting_date.isoformat(),
        "description": request.description,
        "status": request.status,
        "created_at": request.created_at.isoformat(),
        "updated_at": request.updated_at.isoformat()
    }

@router.post("/{request_id}/action", response_model=ReportRequestResponse)
def action_report_request(
    request_id: int,
    payload: ReportRequestAction,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    request = db.query(ReportRequest).filter(ReportRequest.id == request_id, ReportRequest.mentor_id == current_user.id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Report request not found")

    if request.status != "pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    if payload.action == "accept":
        request.status = "accepted"
    elif payload.action == "reject":
        request.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Must be 'accept' or 'reject'")

    request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)

    # Create notification for mentee
    if payload.action == "accept":
        message = f"Your report request for '{request.meeting_title}' has been accepted by your mentor."
    else:
        message = f"Your report request for '{request.meeting_title}' was rejected."
        if payload.rejection_reason:
            message += f" Reason: {payload.rejection_reason}"

    notification = Notification(
        recipient_id=request.mentee_id,
        title=f"Report Request {payload.action.capitalize()}",
        message=message,
        notification_type="request",
        related_entity_id=request.id
    )
    db.add(notification)
    db.commit()

    return {
        "id": request.id,
        "mentee_id": request.mentee_id,
        "mentor_id": request.mentor_id,
        "meeting_title": request.meeting_title,
        "meeting_date": request.meeting_date.isoformat(),
        "description": request.description,
        "status": request.status,
        "created_at": request.created_at.isoformat(),
        "updated_at": request.updated_at.isoformat()
    }