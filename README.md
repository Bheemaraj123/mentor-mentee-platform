# AI-Based Mentor–Mentee Automatic Report Generation Platform

A complete production-ready platform for mentor-mentee report generation with AI-powered structured reporting, task management, and progress analytics.

## Features

### Authentication & Authorization
- JWT-based authentication with role-based access control (Mentor/Mentee)
- Secure password hashing using sha256_crypt
- Invitation code system for mentor-mentee connection
- Protected routes with role validation

### Mentor-Mentee Assignment
- Mentor generates invitation codes with configurable expiry and usage limits
- Mentee joins using invitation code
- Role-based access to assigned mentees/mentor

### Report Request Workflow
- Mentee requests reports for specific meetings
- Mentor reviews and accepts/rejects requests
- Automatic notifications on request creation and resolution

### Meeting Input & File Processing
- Multi-format file upload: PDF, DOCX, TXT, MP3, WAV, M4A, MP4, MOV, MKV
- Text extraction from documents using pypdf, python-docx
- Audio transcription using faster-whisper (base model)
- Video audio extraction and transcription using FFmpeg
- File size limit: 50MB

### AI-Powered Report Generation
- Structured LLM output with Pydantic validation (StructuredReport schema)
- OpenAI-compatible API integration with JSON mode
- Fallback mock generator for development
- Report sections: meeting details, summary, discussion points, academic performance, strengths, weaknesses, challenges, mentor observations, action items, follow-up recommendations, overall progress

### Report Management
- Draft → Pending Review → Approved → Shared workflow
- Version history with content diffing
- Report editing (mentor only, draft/pending_review only)
- PDF export (ReportLab) and DOCX export (python-docx)
- Role-based access: mentors see all, mentees see approved/shared only

### Task Management
- Create tasks from report action items or manually
- Task fields: title, description, deadline, priority, status, report association
- Mentor: create, edit, delete, view all assigned tasks
- Mentee: view assigned tasks, update status
- Overdue calculation based on deadline and completion status
- Filter by status, priority, mentee, deadline

### Progress Analytics
- Mentor view: overall mentee progress, task completion rates, report status distribution, completion trends
- Mentee view: personal progress, task completion percentage, report history
- Charts using Recharts: pie charts, line charts, bar charts
- Real data from database - no hardcoded metrics

### Notifications
- In-app notifications for: report requests, acceptance/rejection, report sharing, task assignment, deadlines
- Unread count, mark as read, mark all as read
- Role-based filtering

### Settings
- Profile management (full name)
- Password change with current password validation
- Email and role display (read-only)

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy 2.0** - ORM with async support
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation and serialization
- **Passlib** - Password hashing (sha256_crypt)
- **Python-JOSE** - JWT token handling
- **ReportLab** - PDF generation
- **python-docx** - DOCX generation
- **pypdf** - PDF text extraction
- **faster-whisper** - Audio transcription
- **FFmpeg** - Video audio extraction

### Frontend
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router v6** - Routing
- **TanStack Query** - Server state management
- **React Hook Form + Zod** - Form handling and validation
- **Recharts** - Data visualization
- **Lucide React** - Icons

### Database
- **PostgreSQL** (production)
- **SQLite** (development fallback)

### Deployment
- **Docker Compose** - Multi-container orchestration
- **Uvicorn** - ASGI server

## Project Structure

```
Men.AI/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   │   ├── auth.py           # Authentication endpoints
│   │   │   ├── assignments.py    # Mentor-mentee assignments
│   │   │   ├── meetings.py       # Meeting input & file processing
│   │   │   ├── reports.py        # Report management
│   │   │   ├── report_requests.py # Report request workflow
│   │   │   ├── notifications.py  # Notifications
│   │   │   ├── tasks.py          # Task management
│   │   │   └── deps.py           # Dependencies & auth
│   │   ├── core/          # Core configuration
│   │   │   ├── config.py         # Settings
│   │   │   ├── security.py       # Password hashing & JWT
│   │   │   └── seed.py           # Demo data seeding
│   │   ├── db/            # Database
│   │   │   └── session.py        # DB session management
│   │   ├── models/        # SQLAlchemy models
│   │   │   └── models.py
│   │   ├── schemas/       # Pydantic schemas
│   │   │   └── schemas.py
│   │   ├── services/      # Business logic
│   │   │   ├── file_processing.py  # File extraction & transcription
│   │   │   ├── pdf_generator.py    # PDF report generation
│   │   │   └── docx_generator.py   # DOCX report generation
│   │   ├── ai/            # AI integration
│   │   │   ├── schemas.py          # Structured report schema
│   │   │   └── report_generator.py # AI report generation
│   │   └── main.py        # FastAPI app entry point
│   ├── migrations/        # Alembic migrations
│   ├── requirements.txt   # Python dependencies
│   ├── Dockerfile         # Backend container
│   └── .env.example       # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── layout/       # Dashboard layout
│   │   │   ├── auth/         # Auth components
│   │   │   └── ui/           # Reusable UI components
│   │   ├── pages/         # Page components
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── mentor/       # Mentor pages
│   │   │   ├── mentee/       # Mentee pages
│   │   │   └── Settings.tsx  # Shared settings
│   │   ├── context/       # React context
│   │   │   └── AuthContext.tsx # Auth state management
│   │   ├── services/      # API services
│   │   │   └── api.ts          # Axios instance
│   │   ├── lib/           # Utilities
│   │   │   └── utils.ts        # cn() utility
│   │   ├── App.tsx        # Main app with routing
│   │   └── main.tsx       # Entry point
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite config
│   ├── tailwind.config.js # Tailwind config
│   └── Dockerfile         # Frontend container
│
├── docker-compose.yml     # Multi-service deployment
├── .env.example           # Environment template
└── README.md              # This file
```

## Installation

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- FFmpeg (for video processing)

### Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd Men.AI
```

2. Copy environment file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
# Database
POSTGRES_SERVER=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=mentor_mentee_db
POSTGRES_PORT=5432

# JWT
SECRET_KEY=your_super_secret_key_change_in_production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# AI (optional - uses mock generator if not set)
OPENAI_API_KEY=your_openai_api_key
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
```

4. Start services:
```bash
docker-compose up -d --build
```

5. Application Access

The application currently runs locally. Follow the installation and setup instructions above to run the frontend and backend on your machine.

Public access to the application is not currently available.

### Local Development

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python app/core/seed.py  # Create demo users
uvicorn app.main:app --reload --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Demo Credentials

After running `python app/core/seed.py`:

| Role | Email | Password |
|------|-------|----------|
| Mentor | mentor.demo@example.com | Mentor@12345 |
| Mentee | mentee.demo@example.com | Mentee@12345 | 

Or Sign Up And Use 

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `PUT /api/v1/auth/profile` - Update profile
- `POST /api/v1/auth/change-password` - Change password

### Assignments
- `POST /api/v1/assignments/generate-code` - Generate invitation code (mentor)
- `POST /api/v1/assignments/join` - Join mentor (mentee)
- `GET /api/v1/assignments/my-mentees` - List assigned mentees (mentor)

### Report Requests
- `POST /api/v1/report-requests` - Create request (mentee)
- `GET /api/v1/report-requests` - List requests
- `GET /api/v1/report-requests/{id}` - Get request details
- `POST /api/v1/report-requests/{id}/action` - Accept/reject (mentor)

### Meetings
- `POST /api/v1/meetings/create-meeting` - Create meeting with files (mentor)
- `GET /api/v1/meetings/meetings` - List meetings
- `GET /api/v1/meetings/meetings/{id}` - Get meeting details
- `POST /api/v1/meetings/generate-report/{id}` - Generate AI report
- `GET /api/v1/meetings/my-mentees` - Get mentees for meeting creation

### Reports
- `GET /api/v1/reports` - List reports (mentor: all, mentee: approved/shared)
- `GET /api/v1/reports/{id}` - Get report details
- `PUT /api/v1/reports/{id}` - Edit report (mentor, draft/pending only)
- `POST /api/v1/reports/{id}/approve` - Approve report (mentor)
- `POST /api/v1/reports/{id}/share` - Share report (mentor)
- `GET /api/v1/reports/{id}/versions` - Version history (mentor)
- `POST /api/v1/reports/{id}/download-pdf` - Download PDF
- `POST /api/v1/reports/{id}/download-docx` - Download DOCX

### Tasks
- `POST /api/v1/tasks/` - Create task (mentor)
- `GET /api/v1/tasks/` - List tasks (mentor)
- `GET /api/v1/tasks/mentee` - List assigned tasks (mentee)
- `GET /api/v1/tasks/{id}` - Get task (mentor)
- `GET /api/v1/tasks/mentee/{id}` - Get task (mentee)
- `PUT /api/v1/tasks/{id}` - Update task (mentor)
- `PUT /api/v1/tasks/mentee/{id}/status` - Update status (mentee)
- `DELETE /api/v1/tasks/{id}` - Delete task (mentor)

### Notifications
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/unread-count` - Get unread count
- `POST /api/v1/notifications/{id}/read` - Mark as read
- `POST /api/v1/notifications/read-all` - Mark all as read

## AI Integration

The platform uses OpenAI-compatible APIs for structured report generation:

1. **Schema**: `StructuredReport` in `backend/app/ai/schemas.py` defines the exact JSON structure
2. **Generation**: `backend/app/ai/report_generator.py` handles LLM calls with JSON mode
3. **Validation**: Pydantic validates LLM output before persistence
4. **Fallback**: Mock generator used when no valid API key configured

To enable real AI:
1. Set `OPENAI_API_KEY` in environment
2. Set `LLM_PROVIDER=openai`
3. Optionally set `LLM_MODEL` (default: gpt-4o-mini)
4. Optionally set `OPENAI_BASE_URL` for compatible APIs

## Database Migrations

```bash
cd backend
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Check current revision
alembic current
```

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_SERVER` | PostgreSQL host | localhost |
| `POSTGRES_USER` | PostgreSQL user | postgres |
| `POSTGRES_PASSWORD` | PostgreSQL password | postgres |
| `POSTGRES_DB` | Database name | mentor_mentee_db |
| `POSTGRES_PORT` | PostgreSQL port | 5432 |
| `DATABASE_URL` | Full database URL (overrides above) | - |
| `SECRET_KEY` | JWT secret key | *required* |
| `ALGORITHM` | JWT algorithm | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiry | 10080 |
| `OPENAI_API_KEY` | OpenAI API key | - |
| `LLM_PROVIDER` | LLM provider | openai |
| `LLM_MODEL` | Model name | gpt-4o-mini |
| `OPENAI_BASE_URL` | Custom API base URL | - |
| `WHISPER_MODEL` | Whisper model size | base |

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Ensure PostgreSQL is running
   - Check `.env` credentials
   - SQLite fallback used if PostgreSQL unavailable

2. **FFmpeg not found (video processing)**
   - Install FFmpeg: `apt-get install ffmpeg` (Linux) or `brew install ffmpeg` (macOS)
   - Windows: Download from ffmpeg.org and add to PATH

3. **Audio transcription slow**
   - Ensure faster-whisper uses GPU if available
   - Use smaller model: set `WHISPER_MODEL=tiny` or `base`

4. **CORS errors**
   - Backend allows all origins in development
   - Configure `CORS_ORIGINS` in production

5. **Permission denied on file uploads**
   - Ensure `storage/uploads` directory exists and is writable

## Deployment Checklist

- [ ] Change `SECRET_KEY` in production
- [ ] Use PostgreSQL in production (not SQLite)
- [ ] Set secure `OPENAI_API_KEY`
- [ ] Configure proper CORS origins
- [ ] Use HTTPS with reverse proxy (nginx)
- [ ] Set up database backups
- [ ] Configure monitoring and logging
- [ ] Set up automated testing in CI/CD

## License

MIT License - See LICENSE file for details.

## Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open Pull Request

## Support

For issues and feature requests, please open a GitHub issue.