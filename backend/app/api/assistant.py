"""API endpoints for the Men.AI chat assistant."""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.models.models import User, Meeting, Report, Task, MentorMenteeAssignment
from app.api.deps import get_current_user
from app.ai.assistant import generate_assistant_response


router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[dict]] = None


class ChatResponse(BaseModel):
    response: str
    model: Optional[str] = None
    usage: Optional[dict] = None


def _gather_context(current_user: User, db: Session) -> dict:
    """Gather relevant data for the assistant context."""
    context = {
        "user": {
            "id": current_user.id,
            "full_name": current_user.full_name,
            "email": current_user.email,
            "role": current_user.role,
        },
        "mentees": [],
        "meetings": [],
        "reports": [],
        "tasks": [],
    }

    if current_user.role == "mentor":
        assignments = (
            db.query(MentorMenteeAssignment)
            .filter(
                MentorMenteeAssignment.mentor_id == current_user.id,
                MentorMenteeAssignment.status == "active",
            )
            .all()
        )
        for a in assignments:
            mentee = db.query(User).filter(User.id == a.mentee_id).first()
            if mentee:
                context["mentees"].append({
                    "id": mentee.id,
                    "full_name": mentee.full_name,
                    "email": mentee.email,
                    "assigned_at": a.assigned_at.isoformat() if a.assigned_at else None,
                })

        meetings = (
            db.query(Meeting)
            .filter(Meeting.mentor_id == current_user.id)
            .order_by(Meeting.created_at.desc())
            .limit(20)
            .all()
        )
        for m in meetings:
            context["meetings"].append({
                "id": m.id,
                "meeting_title": m.meeting_title,
                "meeting_date": m.meeting_date.isoformat() if m.meeting_date else None,
                "processing_status": m.processing_status,
                "mentee_id": m.mentee_id,
            })

        reports = (
            db.query(Report)
            .filter(Report.mentor_id == current_user.id)
            .order_by(Report.created_at.desc())
            .limit(20)
            .all()
        )
        for r in reports:
            context["reports"].append({
                "id": r.id,
                "meeting_id": r.meeting_id,
                "mentee_id": r.mentee_id,
                "report_content": r.report_content,
                "status": r.status,
                "version": r.version,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        tasks = (
            db.query(Task)
            .filter(Task.mentor_id == current_user.id)
            .order_by(Task.created_at.desc())
            .limit(20)
            .all()
        )
        for t in tasks:
            context["tasks"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "deadline": t.deadline.isoformat() if t.deadline else None,
                "priority": t.priority,
                "status": t.status,
                "mentee_id": t.mentee_id,
                "report_id": t.report_id,
            })
    else:
        # Mentee context
        meetings = (
            db.query(Meeting)
            .filter(Meeting.mentee_id == current_user.id)
            .order_by(Meeting.created_at.desc())
            .limit(20)
            .all()
        )
        for m in meetings:
            context["meetings"].append({
                "id": m.id,
                "meeting_title": m.meeting_title,
                "meeting_date": m.meeting_date.isoformat() if m.meeting_date else None,
                "processing_status": m.processing_status,
                "mentor_id": m.mentor_id,
            })

        reports = (
            db.query(Report)
            .filter(
                Report.mentee_id == current_user.id,
                Report.status.in_(["approved", "shared"])
            )
            .order_by(Report.created_at.desc())
            .limit(20)
            .all()
        )
        for r in reports:
            context["reports"].append({
                "id": r.id,
                "meeting_id": r.meeting_id,
                "mentor_id": r.mentor_id,
                "report_content": r.report_content,
                "status": r.status,
                "version": r.version,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })

        tasks = (
            db.query(Task)
            .filter(Task.mentee_id == current_user.id)
            .order_by(Task.created_at.desc())
            .limit(20)
            .all()
        )
        for t in tasks:
            context["tasks"].append({
                "id": t.id,
                "title": t.title,
                "description": t.description,
                "deadline": t.deadline.isoformat() if t.deadline else None,
                "priority": t.priority,
                "status": t.status,
                "report_id": t.report_id,
            })

    return context


@router.post("/chat", response_model=ChatResponse)
def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Send a message to the Men.AI assistant and get an AI-generated response."""
    try:
        context = _gather_context(current_user, db)
        result = generate_assistant_response(
            user_message=payload.message,
            context=context,
            conversation_history=payload.conversation_history,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=str(e),
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Assistant request failed: {e}",
        )