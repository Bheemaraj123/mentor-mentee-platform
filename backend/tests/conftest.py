import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.session import get_db, Base
from app.models.models import User
from app.core.security import get_password_hash

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield

@pytest.fixture(scope="function")
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.rollback()
        db.close()

@pytest.fixture(scope="function")
def client():
    return TestClient(app)

@pytest.fixture
def mentor_user(db_session):
    mentor = User(
        email="test.mentor@example.com",
        full_name="Test Mentor",
        password_hash=get_password_hash("Test@123"),
        role="mentor"
    )
    db_session.add(mentor)
    db_session.commit()
    db_session.refresh(mentor)
    return mentor

@pytest.fixture
def mentee_user(db_session):
    mentee = User(
        email="test.mentee@example.com",
        full_name="Test Mentee",
        password_hash=get_password_hash("Test@123"),
        role="mentee"
    )
    db_session.add(mentee)
    db_session.commit()
    db_session.refresh(mentee)
    return mentee

@pytest.fixture
def mentor_token(client, mentor_user):
    response = client.post("/api/v1/auth/login", json={
        "email": "test.mentor@example.com",
        "password": "Test@123"
    })
    return response.json()["access_token"]

@pytest.fixture
def mentee_token(client, mentee_user):
    response = client.post("/api/v1/auth/login", json={
        "email": "test.mentee@example.com",
        "password": "Test@123"
    })
    return response.json()["access_token"]

@pytest.fixture
def assigned_pair(client, mentor_user, mentee_user, mentor_token, mentee_token):
    headers_m = {"Authorization": f"Bearer {mentor_token}"}
    code_resp = client.post("/api/v1/assignments/generate-code", headers=headers_m, json={})
    code = code_resp.json()["code"]

    headers_me = {"Authorization": f"Bearer {mentee_token}"}
    client.post("/api/v1/assignments/join", headers=headers_me, json={"code": code})
    return mentor_user, mentee_user