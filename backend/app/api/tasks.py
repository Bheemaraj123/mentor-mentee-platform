from fastapi import APIRouter, Depends, HTTPException, status, Body, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Task, User, Report
from app.api.deps import get_current_mentor, get_current_mentee, get_db_session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid

router = APIRouter()

UPLOAD_DIR = "./storage/task_uploads"
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".mp3", ".wav", ".m4a", ".mp4", ".mov", ".mkv",
    ".txt", ".pdf", ".docx", ".jpg", ".jpeg", ".png",
}

def validate_file(file: UploadFile) -> str:
    """Validate uploaded file and return its file type."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type {ext} not allowed. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    return ext

def sanitize_filename(filename: str) -> str:
    return os.path.basename(filename)

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: str = "medium"
    status: str = "pending"
    report_id: Optional[int] = None
    mentee_id: int
    assigned_to: Optional[str] = None
    related_meeting: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    require_file_upload: bool = False

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    related_meeting: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    require_file_upload: Optional[bool] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    mentor_id: int
    mentee_id: int
    deadline: Optional[datetime]
    priority: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    report_id: Optional[int]
    assigned_to: Optional[str] = None
    related_meeting: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None
    require_file_upload: bool = False
    completion_description: Optional[str] = None
    uploaded_file_path: Optional[str] = None
    uploaded_file_name: Optional[str] = None

    class Config:
        from_attributes = True

class TaskCompletionRequest(BaseModel):
    completion_description: str

class TaskFileUploadResponse(BaseModel):
    id: int
    title: str
    status: str
    completion_description: Optional[str] = None
    uploaded_file_path: Optional[str] = None
    uploaded_file_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    message: str

@router.post("", response_model=TaskResponse)
def create_task(
    payload: TaskCreate,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    """Mentor creates a new task"""
    # Verify report exists if report_id provided
    if payload.report_id:
        report = db.query(Report).filter(Report.id == payload.report_id).first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        if report.mentor_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not your report")

    task = Task(
        title=payload.title,
        description=payload.description,
        deadline=payload.deadline,
        priority=payload.priority,
        status=payload.status,
        mentor_id=current_user.id,
        mentee_id=payload.mentee_id,
        report_id=payload.report_id,
        assigned_to=payload.assigned_to,
        related_meeting=payload.related_meeting,
        category=payload.category,
        notes=payload.notes,
        require_file_upload=payload.require_file_upload,
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.get("", response_model=List[TaskResponse])
def list_tasks(
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
    status_filter: Optional[str] = None,
    priority_filter: Optional[str] = None,
    mentee_id: Optional[int] = None,
):
    """Mentor lists tasks with filters"""
    query = db.query(Task).filter(Task.mentor_id == current_user.id)

    if status_filter:
        query = query.filter(Task.status == status_filter)
    if priority_filter:
        query = query.filter(Task.priority == priority_filter)
    if mentee_id:
        query = query.filter(Task.mentee_id == mentee_id)

    tasks = query.order_by(Task.created_at.desc()).all()

    # Map DB task to response model
    response_tasks = []
    for task in tasks:
        response_tasks.append(TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            mentor_id=task.mentor_id,
            mentee_id=task.mentee_id,
            deadline=task.deadline,
            priority=task.priority,
            status=task.status,
            created_at=task.created_at,
            completed_at=task.completed_at,
            report_id=task.report_id,
            assigned_to=task.assigned_to,
            related_meeting=task.related_meeting,
            category=task.category,
            notes=task.notes,
            require_file_upload=task.require_file_upload,
            completion_description=task.completion_description,
            uploaded_file_path=task.uploaded_file_path,
            uploaded_file_name=task.uploaded_file_name,
        ))
    return response_tasks

@router.get("/mentee/{mentee_id}", response_model=List[TaskResponse])
def list_tasks_by_mentee(
    mentee_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db),
):
    """Mentor lists tasks for a specific mentee"""
    tasks = db.query(Task).filter(
        Task.mentor_id == current_user.id,
        Task.mentee_id == mentee_id
    ).order_by(Task.created_at.desc()).all()
    return tasks

@router.get("/mentee", response_model=List[TaskResponse])
def list_mentee_tasks(
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db),
):
    """Mentee lists their assigned tasks"""
    tasks = db.query(Task).filter(
        Task.mentee_id == current_user.id
    ).order_by(Task.created_at.desc()).all()
    return tasks

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    """Get a single task by ID"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    if task.mentor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return task

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    """Mentor updates a task"""
    task = db.query(Task).filter(Task.id == task_id, Task.mentor_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    if payload.title is not None:
        task.title = payload.title
    if payload.description is not None:
        task.description = payload.description
    if payload.deadline is not None:
        task.deadline = payload.deadline
    if payload.priority is not None:
        task.priority = payload.priority
    if payload.status is not None:
        task.status = payload.status
    if payload.assigned_to is not None:
        task.assigned_to = payload.assigned_to
    if payload.related_meeting is not None:
        task.related_meeting = payload.related_meeting
    if payload.category is not None:
        task.category = payload.category
    if payload.notes is not None:
        task.notes = payload.notes
    if payload.require_file_upload is not None:
        task.require_file_upload = payload.require_file_upload

    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_mentor),
    db: Session = Depends(get_db)
):
    """Mentor deletes a task"""
    task = db.query(Task).filter(Task.id == task_id, Task.mentor_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return None

@router.get("/mentee", response_model=List[TaskResponse])
def list_mentee_tasks(
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db),
):
    """Mentee lists their assigned tasks"""
    tasks = db.query(Task).filter(
        Task.mentee_id == current_user.id
    ).order_by(Task.created_at.desc()).all()
    return tasks

@router.get("/mentee/{task_id}", response_model=TaskResponse)
def get_mentee_task(
    task_id: int,
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    """Get a single task by ID for mentee"""
    task = db.query(Task).filter(Task.id == task_id, Task.mentee_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")
    return task

@router.post("/mentee/{task_id}/complete-with-file", response_model=TaskFileUploadResponse)
async def complete_task_with_file(
    task_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    """Mentee completes a task by uploading a file"""
    task = db.query(Task).filter(Task.id == task_id, Task.mentee_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")

    # Check if task requires file upload
    if not task.require_file_upload:
        raise HTTPException(status_code=400, detail="This task does not require file upload completion")

    # Check if already completed
    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Task is already completed")

    # Check deadline
    if task.deadline and task.deadline < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot complete task after deadline has passed")

    # Validate file
    validate_file(file)

    # Check file size
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File exceeds the maximum size of {MAX_FILE_SIZE / (1024*1024)} MB"
        )

    try:
        safe_filename = sanitize_filename(file.filename or "upload")
        stored_filename = f"{task_id}_{uuid.uuid4().hex[:8]}_{safe_filename}"
        file_path = os.path.join(UPLOAD_DIR, stored_filename)

        with open(file_path, "wb") as buffer:
            buffer.write(file.file.read())

        # Update task
        task.status = "completed"
        task.completed_at = datetime.utcnow()
        task.uploaded_file_path = file_path
        task.uploaded_file_name = safe_filename

        db.commit()
        db.refresh(task)

        return TaskFileUploadResponse(
            id=task.id,
            title=task.title,
            status=task.status,
            completion_description=task.completion_description,
            uploaded_file_path=task.uploaded_file_path,
            uploaded_file_name=task.uploaded_file_name,
            completed_at=task.completed_at,
            message="Task completed successfully with file upload"
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.post("/mentee/{task_id}/complete-with-description", response_model=TaskFileUploadResponse)
def complete_task_with_description(
    task_id: int,
    payload: TaskCompletionRequest,
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    """Mentee completes a task by providing a completion description"""
    task = db.query(Task).filter(Task.id == task_id, Task.mentee_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")

    # Check if task requires file upload (should not allow description completion if file upload required)
    if task.require_file_upload:
        raise HTTPException(status_code=400, detail="This task requires file upload completion")

    # Check if already completed
    if task.status == "completed":
        raise HTTPException(status_code=400, detail="Task is already completed")

    # Check deadline
    if task.deadline and task.deadline < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Cannot complete task after deadline has passed")

    # Validate description
    if not payload.completion_description or not payload.completion_description.strip():
        raise HTTPException(status_code=400, detail="Completion description is required")

    try:
        # Update task
        task.status = "completed"
        task.completed_at = datetime.utcnow()
        task.completion_description = payload.completion_description.strip()

        db.commit()
        db.refresh(task)

        return TaskFileUploadResponse(
            id=task.id,
            title=task.title,
            status=task.status,
            completion_description=task.completion_description,
            uploaded_file_path=task.uploaded_file_path,
            uploaded_file_name=task.uploaded_file_name,
            completed_at=task.completed_at,
            message="Task completed successfully with description"
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Task completion failed: {str(e)}")