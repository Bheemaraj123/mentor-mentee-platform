from fastapi import FastAPI
from app.api.auth import router as auth_router
from app.api.assignments import router as assignments_router
from app.api.meetings import router as meetings_router
from app.api.reports import router as reports_router
from app.api.report_requests import router as report_requests_router
from app.api.notifications import router as notifications_router
from app.api.tasks import router as tasks_router
from app.api.assistant import router as assistant_router
from app.core.config import settings
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix=settings.API_V1_STR + "/auth", tags=["auth"])
app.include_router(assignments_router, prefix=settings.API_V1_STR + "/assignments", tags=["assignments"])
app.include_router(meetings_router, prefix=settings.API_V1_STR + "/meetings", tags=["meetings"])
app.include_router(reports_router, prefix=settings.API_V1_STR + "/reports", tags=["reports"])
app.include_router(report_requests_router, prefix=settings.API_V1_STR + "/report-requests", tags=["report-requests"])
app.include_router(notifications_router, prefix=settings.API_V1_STR + "/notifications", tags=["notifications"])
app.include_router(tasks_router, prefix=settings.API_V1_STR + "/tasks", tags=["tasks"])
app.include_router(assistant_router, prefix=settings.API_V1_STR + "/assistant", tags=["assistant"])



@app.get("/")
def read_root():
    return {"message": "Welcome to Mentor-Mentee AI Platform"}
