
import os
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Based Mentor–Mentee Automatic Report Generation"
    API_V1_STR: str = "/api/v1"

    # Secret Key for JWT
    SECRET_KEY: str = "SUPER_SECRET_KEY_CHANGE_THIS_IN_PRODUCTION_1234567890"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Database
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "postgres")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "mentor_mentee_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")

    # Database URL
    DATABASE_URL: Optional[str] = None

    # Public share links (Option 2). Base URL used to build public report
    # share links. Defaults to the local dev server; override in production.
    PUBLIC_BASE_URL: str = "http://localhost:8000"

    # AI API Config
    OPENAI_API_KEY: Optional[str] = ""
    GROQ_API_KEY: Optional[str] = ""
    LLM_PROVIDER: str = "groq"
    LLM_MODEL: str = "llama-3.3-70b-versatile"

    class Config:
        case_sensitive = True
        env_file = ".env"

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL

        # Use SQLite for local development
        return "sqlite:///./mentor_mentee.db"


settings = Settings()
