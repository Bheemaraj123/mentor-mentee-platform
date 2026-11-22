from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Report, ReportVersion, User, Meeting
from app.api.deps import get_current_mentor, get_current_user
from app.core.config import settings
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import hashlib
import secrets

router = APIRouter()

class ReportUpdate(BaseModel):
    report_content: dict

class ReportApprove(BaseModel):
    pass

class ReportShare(BaseModel):
    pass

class ReportResponse(BaseModel):
    id: int
    meeting_id: Optional[int]
    mentor_id: int
    mentee_id: int
    report_content: dict
    status: str
    version: int
    approved_at: Optional[datetime]
    shared_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReportVersionResponse(BaseModel):
    id: int
    report_id: int
    version: int
    report_content: dict
    modified_by: int
    created_at: datetime

    class Config:
        from_attributes = True

@router.get("", response_model=List[ReportResponse])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role == "mentor":
        reports = db.query(Report).filter(Report.mentor_id == current_user.id).order_by(Report.created_at.desc()).all()
    else:
        # Mentees only see approved and shared reports
        reports = db.query(Report).filter(
            Report.mentee_id == current_user.id,
            Report.status.in_(["approved", "shared"])
        ).order_by(Report.created_at.desc()).all()

    return [
        {
            "id": r.id,
            "meeting_id": r.meeting_id,
            "mentor_id": r.mentor_id,
            "mentee_id": r.mentee_id,
            "report_content": r.report_content,
            "status": r.status,
            "version": r.version,
            "approved_at": r.approved_at.isoformat() if r.approved_at else None,
            "shared_at": r.shared_at.isoformat() if r.shared_at else None,
            "created_at": r.created_at.isoformat(),
            "updated_at": r.updated_at.isoformat()
        }
        for r in reports
    ]

@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check access
    if current_user.role == "mentor" and report.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "mentee":
        if report.mentee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if report.status not in ["approved", "shared"]:
            raise HTTPException(status_code=403, detail="Report not available")

    return {
        "id": report.id,
        "meeting_id": report.meeting_id,
        "mentor_id": report.mentor_id,
        "mentee_id": report.mentee_id,
        "report_content": report.report_content,
        "status": report.status,
        "version": report.version,
        "approved_at": report.approved_at.isoformat() if report.approved_at else None,
        "shared_at": report.shared_at.isoformat() if report.shared_at else None,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat()
    }

@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: int,
    payload: ReportUpdate,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id, Report.mentor_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status not in ["draft", "pending_review"]:
        raise HTTPException(status_code=400, detail="Cannot edit approved or shared report")

    # Create version before updating
    version = ReportVersion(
        report_id=report.id,
        version=report.version,
        report_content=report.report_content,
        modified_by=current_user.id
    )
    db.add(version)

    # Update report
    report.report_content = payload.report_content
    report.version += 1
    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "meeting_id": report.meeting_id,
        "mentor_id": report.mentor_id,
        "mentee_id": report.mentee_id,
        "report_content": report.report_content,
        "status": report.status,
        "version": report.version,
        "approved_at": report.approved_at.isoformat() if report.approved_at else None,
        "shared_at": report.shared_at.isoformat() if report.shared_at else None,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat()
    }

@router.post("/{report_id}/approve", response_model=ReportResponse)
def approve_report(
    report_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id, Report.mentor_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft reports can be approved")

    report.status = "approved"
    report.approved_at = datetime.utcnow()
    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)

    # Create notification for mentee
    from app.models.models import Notification
    notification = Notification(
        recipient_id=report.mentee_id,
        title="Report Approved",
        message=f"Your report '{report.report_content.get('meeting_details', {}).get('meeting_title', 'Meeting Report')}' has been approved by your mentor.",
        notification_type="report",
        related_entity_id=report.id
    )
    db.add(notification)
    db.commit()

    return {
        "id": report.id,
        "meeting_id": report.meeting_id,
        "mentor_id": report.mentor_id,
        "mentee_id": report.mentee_id,
        "report_content": report.report_content,
        "status": report.status,
        "version": report.version,
        "approved_at": report.approved_at.isoformat() if report.approved_at else None,
        "shared_at": report.shared_at.isoformat() if report.shared_at else None,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat()
    }

@router.post("/{report_id}/share", response_model=ReportResponse)
def share_report(
    report_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id, Report.mentor_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "approved":
        raise HTTPException(status_code=400, detail="Only approved reports can be shared")

    report.status = "shared"
    report.shared_at = datetime.utcnow()
    report.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(report)

    # Create notification for mentee
    from app.models.models import Notification
    notification = Notification(
        recipient_id=report.mentee_id,
        title="Report Shared",
        message=f"Your mentor has shared the report '{report.report_content.get('meeting_details', {}).get('meeting_title', 'Meeting Report')}' with you.",
        notification_type="report",
        related_entity_id=report.id
    )
    db.add(notification)
    db.commit()

    return {
        "id": report.id,
        "meeting_id": report.meeting_id,
        "mentor_id": report.mentor_id,
        "mentee_id": report.mentee_id,
        "report_content": report.report_content,
        "status": report.status,
        "version": report.version,
        "approved_at": report.approved_at.isoformat() if report.approved_at else None,
        "shared_at": report.shared_at.isoformat() if report.shared_at else None,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat()
    }

@router.get("/{report_id}/versions", response_model=List[ReportVersionResponse])
def get_report_versions(
    report_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id, Report.mentor_id == current_user.id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    versions = db.query(ReportVersion).filter(ReportVersion.report_id == report_id).order_by(ReportVersion.version.desc()).all()

    return [
        {
            "id": v.id,
            "report_id": v.report_id,
            "version": v.version,
            "report_content": v.report_content,
            "modified_by": v.modified_by,
            "created_at": v.created_at.isoformat()
        }
        for v in versions
    ]

@router.post("/{report_id}/download-pdf")
def download_pdf(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check access
    if current_user.role == "mentor" and report.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "mentee":
        if report.mentee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if report.status not in ["approved", "shared"]:
            raise HTTPException(status_code=403, detail="Report not available")

    # Generate PDF using reportlab
    from app.services.pdf_generator import generate_report_pdf
    import io
    from fastapi.responses import StreamingResponse

    pdf_buffer = generate_report_pdf(report.report_content)

    return StreamingResponse(
        io.BytesIO(pdf_buffer),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"}
    )

@router.post("/{report_id}/download-docx")
def download_docx(
    report_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Check access
    if current_user.role == "mentor" and report.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    if current_user.role == "mentee":
        if report.mentee_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        if report.status not in ["approved", "shared"]:
            raise HTTPException(status_code=403, detail="Report not available")

    # Generate DOCX using python-docx
    from app.services.docx_generator import generate_report_docx
    import io
    from fastapi.responses import StreamingResponse

    docx_buffer = generate_report_docx(report.report_content)

    return StreamingResponse(
        io.BytesIO(docx_buffer),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.docx"}
    )


# ---------------------------------------------------------------------------
# Public, token-based sharing (Option 2)
# ---------------------------------------------------------------------------

def _generate_share_token() -> str:
    """Return a cryptographically unpredictable, URL-safe token."""
    return secrets.token_urlsafe(48)


def _store_share_token(report: Report, token: str) -> None:
    report.share_token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    report.share_revoked = False


def _build_public_share_url(token: str) -> str:
    base = settings.PUBLIC_BASE_URL.rstrip("/")
    return f"{base}/api/v1/reports/public/{token}"


class ShareLinkResponse(BaseModel):
    share_url: str
    token: str


class PublicReportResponse(BaseModel):
    id: int
    meeting_title: str
    meeting_date: Optional[str] = None
    summary: Optional[str] = None
    themes: List[str] = []
    action_items: List[dict] = []
    progress: Optional[str] = None
    strengths: List[str] = []
    weaknesses: List[str] = []
    follow_up_recommendations: Optional[str] = None


def _report_dict(report: Report) -> dict:
    return {
        "id": report.id,
        "meeting_id": report.meeting_id,
        "mentor_id": report.mentor_id,
        "mentee_id": report.mentee_id,
        "report_content": report.report_content,
        "status": report.status,
        "version": report.version,
        "approved_at": report.approved_at.isoformat() if report.approved_at else None,
        "shared_at": report.shared_at.isoformat() if report.shared_at else None,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
    }


def _public_report_payload(report: Report) -> dict:
    content = report.report_content or {}
    meeting_details = content.get("meeting_details") or {}
    return {
        "id": report.id,
        "meeting_title": meeting_details.get("meeting_title") or "Meeting Report",
        "meeting_date": meeting_details.get("meeting_date"),
        "summary": content.get("meeting_summary"),
        "themes": content.get("discussion_points") or [],
        "action_items": content.get("action_items") or [],
        "progress": content.get("overall_progress"),
        "strengths": content.get("strengths") or [],
        "weaknesses": content.get("weaknesses") or [],
        "follow_up_recommendations": content.get("follow_up_recommendations"),
    }


@router.post(
    "/{report_id}/share-link",
    response_model=ShareLinkResponse,
)
def generate_share_link(
    report_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Generate (or regenerate) a secure public share link for a report.

    Only the owning mentor may create a link. The raw token is returned
    exactly once; only its SHA-256 hash is stored.
    """
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.mentor_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if report.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="Only approved reports can be shared",
        )

    token = _generate_share_token()
    _store_share_token(report, token)
    report.updated_at = datetime.utcnow()
    db.commit()

    return {"share_url": _build_public_share_url(token), "token": token}


@router.post(
    "/{report_id}/share-link/revoke",
    response_model=ReportResponse,
)
def revoke_share_link(
    report_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Revoke public sharing for a report. Existing tokens stop working."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.mentor_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    report.share_revoked = True
    report.share_token_hash = None
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)

    return _report_dict(report)


@router.get(
    "/public/{token}",
    response_model=PublicReportResponse,
)
def get_public_report(
    token: str,
    db: Session = Depends(get_db),
):
    """Public, unauthenticated access to a shared report by token.

    Invalid, revoked, or missing tokens return 404 (not 401/403) so that
    brute-forcing the token does not leak which report IDs exist.
    """
    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    report = (
        db.query(Report)
        .filter(
            Report.share_token_hash == token_hash,
            Report.share_revoked == False,  # noqa: E712
        )
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    return _public_report_payload(report)


@router.delete(
    "/{report_id}",
    response_model=dict,
)
def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Permanently delete a report. Only the owning mentor may delete."""
    report = (
        db.query(Report)
        .filter(Report.id == report_id, Report.mentor_id == current_user.id)
        .first()
    )
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    db.delete(report)
    db.commit()

    return {"message": "Report deleted", "report_id": report_id}