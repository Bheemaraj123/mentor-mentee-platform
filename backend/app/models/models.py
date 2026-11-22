import enum
from datetime import datetime
# from pyparsing import Optional
from typing import Optional
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Boolean, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column
from app.db.session import Base

class UserRole(str, enum.Enum):
    MENTOR = "mentor"
    MENTEE = "mentee"

class AssignmentStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class RequestStatus(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING_REVIEW = "pending_review"
    APPROVED = "approved"
    SHARED = "shared"
    REJECTED = "rejected"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    OVERDUE = "overdue"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False) # mentor or mentee
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    invitation_codes = relationship("InvitationCode", back_populates="mentor", foreign_keys="InvitationCode.mentor_id")
    mentor_assignments = relationship("MentorMenteeAssignment", back_populates="mentor", foreign_keys="MentorMenteeAssignment.mentor_id")
    mentee_assignments = relationship("MentorMenteeAssignment", back_populates="mentee", foreign_keys="MentorMenteeAssignment.mentee_id")
    notifications = relationship("Notification", back_populates="recipient")

class MentorMenteeAssignment(Base):
    __tablename__ = "mentor_mentee_assignments"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String(50), default="active")
    assigned_at = Column(DateTime, default=datetime.utcnow)

    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="mentor_assignments")
    mentee = relationship("User", foreign_keys=[mentee_id], back_populates="mentee_assignments")

class InvitationCode(Base):
    __tablename__ = "invitation_codes"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=True)
    max_uses = Column(Integer, default=10)
    current_uses = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    mentor = relationship("User", foreign_keys=[mentor_id], back_populates="invitation_codes")

class ReportRequest(Base):
    __tablename__ = "report_requests"

    id = Column(Integer, primary_key=True, index=True)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meeting_title = Column(String(255), nullable=False)
    meeting_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="pending") # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meeting_title = Column(String(255), nullable=False)
    meeting_date = Column(DateTime, nullable=False)
    description = Column(Text, nullable=True)
    processing_status: Mapped[str] = mapped_column(
    String(50),
    default="pending"
    ) # pending, processing, completed, failed
    created_at = Column(DateTime, default=datetime.utcnow)

    files = relationship("MeetingFile", back_populates="meeting", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="meeting")

class MeetingFile(Base):
    __tablename__ = "meeting_files"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False) # audio, video, transcript, document
    file_path = Column(String(512), nullable=False)
    extracted_text: Mapped[Optional[str]] = mapped_column(
    Text,
    nullable=True
    )
    processing_status: Mapped[str] = mapped_column(
        String(50),
        default="pending"
    )
    created_at = Column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="files")

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    meeting_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    report_content = Column(JSON, nullable=False) # Structured JSON output from LLM
    status = Column(String(50), default="draft") # draft, pending_review, approved, shared, rejected
    version = Column(Integer, default=1)
    approved_at = Column(DateTime, nullable=True)
    shared_at = Column(DateTime, nullable=True)
    # Public, token-based sharing (Option 2). Only the SHA-256 hash of the
    # token is persisted; the raw token is returned once at generation time.
    share_token_hash = Column(String(128), nullable=True)
    share_revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="reports")
    versions = relationship("ReportVersion", back_populates="report", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="report")

class ReportVersion(Base):
    __tablename__ = "report_versions"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=False)
    version = Column(Integer, nullable=False)
    report_content = Column(JSON, nullable=False)
    modified_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    report = relationship("Report", back_populates="versions")

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("reports.id"), nullable=True)
    mentor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    deadline = Column(DateTime, nullable=True)
    priority = Column(String(50), default="medium") # low, medium, high, critical
    status = Column(String(50), default="pending") # pending, in_progress, completed
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    assigned_to = Column(String(255), nullable=True) # e.g., "You" or actual user name
    related_meeting = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True) # e.g., "General", "Meeting Follow-up", "Study", "Project", "Career", "Personal"
    notes = Column(Text, nullable=True)
    # File upload completion fields
    require_file_upload = Column(Boolean, default=False)
    completion_description = Column(Text, nullable=True)
    uploaded_file_path = Column(String(512), nullable=True)
    uploaded_file_name = Column(String(255), nullable=True)

    report = relationship("Report", back_populates="tasks")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), nullable=False) # request, report, task, system
    related_entity_id = Column(Integer, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    recipient = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
