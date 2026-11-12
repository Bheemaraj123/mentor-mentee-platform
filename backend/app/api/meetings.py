import os
import uuid
from pathlib import Path
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session  # type: ignore

from app.db.session import get_db
from app.models.models import (
    Meeting,
    MeetingFile,
    Report,
    User,
    MentorMenteeAssignment,
)
from app.api.assignments import MenteeProfileResponse
from app.services.file_processing import process_file_content
from app.ai.report_generator import generate_structured_report
from app.api.deps import get_current_mentor, get_current_user


router = APIRouter()

UPLOAD_DIR = "./storage/uploads"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

ALLOWED_EXTENSIONS = {
    ".mp3",
    ".wav",
    ".m4a",
    ".mp4",
    ".mov",
    ".mkv",
    ".txt",
    ".pdf",
    ".docx",
}

os.makedirs(UPLOAD_DIR, exist_ok=True)


def validate_file(file: UploadFile) -> str:
    """Validate uploaded file and return its file type."""

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    ext = Path(file.filename).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"File type {ext} not allowed. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    if ext in {".mp3", ".wav", ".m4a"}:
        return "audio"

    if ext in {".mp4", ".mov", ".mkv"}:
        return "video"

    if ext == ".txt":
        return "transcript"

    return "document"


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal."""

    return Path(filename).name


def parse_meeting_date(meeting_date: str) -> datetime:
    """Parse an ISO 8601 meeting date."""

    try:
        normalized_date = meeting_date.strip()

        if normalized_date.endswith("Z"):
            normalized_date = normalized_date[:-1] + "+00:00"

        return datetime.fromisoformat(normalized_date)

    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid meeting_date. Use ISO 8601 format.",
        )


@router.post("/create-meeting")
def create_meeting(
    mentee_id: int = Form(...),
    meeting_title: str = Form(...),
    meeting_date: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Create a meeting and upload/process its files."""

    assignment = (
        db.query(MentorMenteeAssignment)
        .filter(
            MentorMenteeAssignment.mentor_id == current_user.id,
            MentorMenteeAssignment.mentee_id == mentee_id,
            MentorMenteeAssignment.status == "active",
        )
        .first()
    )

    if not assignment:
        raise HTTPException(
            status_code=403,
            detail="Mentee not assigned to this mentor",
        )

    if not files:
        raise HTTPException(
            status_code=400,
            detail="At least one file is required",
        )

    meeting = None

    try:
        meeting = Meeting(
            mentor_id=current_user.id,
            mentee_id=mentee_id,
            meeting_title=meeting_title,
            meeting_date=parse_meeting_date(meeting_date),
            description=description,
            processing_status="processing",
        )

        db.add(meeting)
        db.commit()
        db.refresh(meeting)

        combined_text = ""

        os.makedirs(UPLOAD_DIR, exist_ok=True)

        for file in files:
            if not file.filename:
                continue

            file_type = validate_file(file)
            safe_filename = sanitize_filename(file.filename)

            # Check file size.
            file.file.seek(0, 2)
            file_size = file.file.tell()
            file.file.seek(0)

            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        f"File {safe_filename} exceeds "
                        "the maximum size of 50 MB"
                    ),
                )

            stored_filename = (
                f"{meeting.id}_{uuid.uuid4().hex[:8]}_{safe_filename}"
            )

            file_path = os.path.join(UPLOAD_DIR, stored_filename)

            with open(file_path, "wb") as buffer:
                buffer.write(file.file.read())

            extracted_text = process_file_content(
                file_path,
                file_type,
            )

            combined_text += (
                f"\n\n--- File: {safe_filename} ---\n"
                f"{extracted_text}"
            )

            meeting_file = MeetingFile(
                meeting_id=meeting.id,
                file_name=safe_filename,
                file_type=file_type,
                file_path=file_path,
                extracted_text=extracted_text,
                processing_status="completed",
            )

            db.add(meeting_file)

        meeting.processing_status = "completed"

        db.commit()
        db.refresh(meeting)

        return {
            "meeting_id": meeting.id,
            "meeting_title": meeting.meeting_title,
            "extracted_text_preview": combined_text[:2000],
            "message": "Files successfully uploaded and processed.",
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Meeting creation failed: {str(e)}",
        )


@router.get("/meetings")
def list_meetings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List meetings belonging to the current mentor or mentee."""

    if current_user.role == "mentor":
        meetings = (
            db.query(Meeting)
            .filter(Meeting.mentor_id == current_user.id)
            .order_by(Meeting.created_at.desc())
            .all()
        )
    else:
        meetings = (
            db.query(Meeting)
            .filter(Meeting.mentee_id == current_user.id)
            .order_by(Meeting.created_at.desc())
            .all()
        )

    return [
        {
            "id": meeting.id,
            "meeting_title": meeting.meeting_title,
            "meeting_date": (
                meeting.meeting_date.isoformat()
                if meeting.meeting_date
                else None
            ),
            "description": meeting.description,
            "processing_status": meeting.processing_status,
            "created_at": (
                meeting.created_at.isoformat()
                if meeting.created_at
                else None
            ),
            "mentor_id": meeting.mentor_id,
            "mentee_id": meeting.mentee_id,
        }
        for meeting in meetings
    ]


@router.get("/meetings/{meeting_id}")
def get_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get meeting details and its uploaded files."""

    meeting = (
        db.query(Meeting)
        .filter(Meeting.id == meeting_id)
        .first()
    )

    if not meeting:
        raise HTTPException(
            status_code=404,
            detail="Meeting not found",
        )

    # Check access permissions.
    if (
        current_user.role == "mentor"
        and meeting.mentor_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    if (
        current_user.role == "mentee"
        and meeting.mentee_id != current_user.id
    ):
        raise HTTPException(
            status_code=403,
            detail="Access denied",
        )

    files = (
        db.query(MeetingFile)
        .filter(MeetingFile.meeting_id == meeting_id)
        .all()
    )

    return {
        "id": meeting.id,
        "meeting_title": meeting.meeting_title,
        "meeting_date": (
            meeting.meeting_date.isoformat()
            if meeting.meeting_date
            else None
        ),
        "description": meeting.description,
        "processing_status": meeting.processing_status,
        "created_at": (
            meeting.created_at.isoformat()
            if meeting.created_at
            else None
        ),
        "files": [
            {
                "id": file.id,
                "file_name": file.file_name,
                "file_type": file.file_type,
                "extracted_text": file.extracted_text,
                "processing_status": file.processing_status,
            }
            for file in files
        ],
    }


@router.post("/generate-report/{meeting_id}")
def generate_report_from_meeting(
    meeting_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Generate a structured report from a meeting's extracted text."""

    print("\n========== REPORT ENDPOINT HIT ==========")
    print("Meeting ID:", meeting_id)
    print("Current mentor ID:", current_user.id)
    print("========================================\n")

    meeting = (
        db.query(Meeting)
        .filter(
            Meeting.id == meeting_id,
            Meeting.mentor_id == current_user.id,
        )
        .first()
    )

    if not meeting:
        print("ERROR: Meeting not found")
        raise HTTPException(
            status_code=404,
            detail="Meeting not found",
        )

    mentee = (
        db.query(User)
        .filter(User.id == meeting.mentee_id)
        .first()
    )

    files = (
        db.query(MeetingFile)
        .filter(MeetingFile.meeting_id == meeting.id)
        .all()
    )

    print("\n========== FILE DEBUG ==========")
    print("Meeting title:", meeting.meeting_title)
    print("Number of files:", len(files))

    for file in files:
        extracted = file.extracted_text or ""
        print("File name:", file.file_name)
        print("File type:", file.file_type)
        print("Extracted text length:", len(extracted))
        print("Extracted text preview:", extracted[:300])

    print("================================\n")

    full_transcript = "\n".join(
        file.extracted_text
        for file in files
        if file.extracted_text
    )

    print("\n========== TRANSCRIPT DEBUG ==========")
    print("Transcript length:", len(full_transcript))
    print("Transcript preview:", full_transcript[:1000])
    print("=====================================\n")

    if not full_transcript.strip():
        print("ERROR: Transcript is empty")
        raise HTTPException(
            status_code=400,
            detail="No extracted text is available for report generation",
        )

    try:
        print(">>> CALLING AI REPORT GENERATOR <<<")

        report_data = generate_structured_report(
            meeting_title=meeting.meeting_title,
            meeting_date=str(meeting.meeting_date),
            mentee_name=mentee.full_name if mentee else "Mentee",
            mentor_name=current_user.full_name,
            transcript=full_transcript,
        )

        print(">>> AI REPORT GENERATOR FINISHED <<<")
        print("Generated report summary:", report_data.get("meeting_summary"))
        print("Generated report progress:", report_data.get("overall_progress"))

        report = Report(
            meeting_id=meeting.id,
            mentor_id=current_user.id,
            mentee_id=meeting.mentee_id,
            report_content=report_data,
            status="draft",
            version=1,
        )

        db.add(report)
        db.commit()
        db.refresh(report)

        print(">>> REPORT SAVED TO DATABASE <<<")
        print("Report ID:", report.id)

        from app.models.models import Notification

        notification = Notification(
            recipient_id=meeting.mentee_id,
            title="Report Generated",
            message=(
                f"Your mentor has generated a report from the meeting "
                f"'{meeting.meeting_title}'."
            ),
            notification_type="report",
            related_entity_id=report.id,
        )

        db.add(notification)
        db.commit()

        print(">>> NOTIFICATION CREATED <<<")

        return {
            "report_id": report.id,
            "status": report.status,
            "report_content": report.report_content,
        }

    except HTTPException:
        db.rollback()
        raise

    except Exception as e:
        db.rollback()

        print("\n========== REPORT GENERATION ERROR ==========")
        print("Error type:", type(e).__name__)
        print("Error message:", str(e))
        print("============================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}",
        )


@router.get(
    "/my-mentees",
    response_model=List[MenteeProfileResponse],
)
def get_mentor_mentees_for_meeting(
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Return active mentees assigned to the current mentor."""

    assignments = (
        db.query(MentorMenteeAssignment)
        .filter(
            MentorMenteeAssignment.mentor_id == current_user.id,
            MentorMenteeAssignment.status == "active",
        )
        .all()
    )

    result = []

    for assignment in assignments:
        mentee = (
            db.query(User)
            .filter(User.id == assignment.mentee_id)
            .first()
        )

        if mentee:
            result.append(
                {
                    "id": mentee.id,
                    "full_name": mentee.full_name,
                    "email": mentee.email,
                    "assigned_at": assignment.assigned_at,
                }
            )

    return result