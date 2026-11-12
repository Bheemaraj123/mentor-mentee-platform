from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import Task, User, Report
from app.api.deps import get_current_mentor, get_current_mentee, get_db_session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

router = APIRouter()

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    priority: str = "medium"  # low, medium, high, critical
    status: str = "pending"  # pending, in_progress, completed
    report_id: Optional[int] = None
    mentee_id: int
    assigned_to: Optional[str] = None
    related_meeting: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None

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

    class Config:
        from_attributes = True

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

@router.put("/mentee/{task_id}/status")
def update_task_status(
    task_id: int,
    status: str = Body(..., embed=True),
    current_user: User = Depends(get_current_mentee),
    db: Session = Depends(get_db)
):
    """Mentee updates task status"""
    valid_statuses = ["pending", "in_progress", "completed"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")

    task = db.query(Task).filter(Task.id == task_id, Task.mentee_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not assigned to you")

    task.status = status
    if status == "completed":
        from datetime import datetime
        task.completed_at = datetime.utcnow()
    else:
        task.completed_at = None

    db.commit()
    db.refresh(task)
    return {"id": task.id, "status": task.status, "message": "Task status updated"}