import pytest
from fastapi.testclient import TestClient

def test_register(client: TestClient):
    response = client.post("/api/v1/auth/register", json={
        "full_name": "New User",
        "email": "newuser@example.com",
        "password": "Test@123",
        "role": "mentor"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert data["role"] == "mentor"

def test_login(client: TestClient, mentor_token: str):
    response = client.post("/api/v1/auth/login", json={
        "email": "test.mentor@example.com",
        "password": "Test@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data

def test_invitation_code_generation(client: TestClient, mentor_token: str):
    headers = {"Authorization": f"Bearer {mentor_token}"}
    response = client.post("/api/v1/assignments/generate-code", headers=headers, json={})
    assert response.status_code == 200
    data = response.json()
    assert "code" in data
    assert data["max_uses"] == 10
    assert data["is_active"] is True

def test_mentee_join(client: TestClient, mentor_token: str, mentee_token: str):
    headers_m = {"Authorization": f"Bearer {mentor_token}"}
    code_resp = client.post("/api/v1/assignments/generate-code", headers=headers_m, json={})
    code = code_resp.json()["code"]

    headers_me = {"Authorization": f"Bearer {mentee_token}"}
    response = client.post("/api/v1/assignments/join", headers=headers_me, json={"code": code})
    assert response.status_code == 200
    assert response.json()["message"] == "Successfully joined mentor"

def test_report_request_workflow(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers_m = {"Authorization": f"Bearer {mentor_token}"}
    headers_me = {"Authorization": f"Bearer {mentee_token}"}

    response = client.post("/api/v1/report-requests", headers=headers_me, json={
        "mentor_id": mentor.id,
        "meeting_title": "Test Meeting",
        "meeting_date": "2026-11-20T10:00:00Z",
        "description": "Test description"
    })
    assert response.status_code == 200
    request_id = response.json()["id"]

    list_resp = client.get("/api/v1/report-requests", headers=headers_m)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    action_resp = client.post(f"/api/v1/report-requests/{request_id}/action", headers=headers_m, json={
        "action": "accept"
    })
    assert action_resp.status_code == 200
    assert action_resp.json()["status"] == "accepted"

def test_meeting_creation(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers = {"Authorization": f"Bearer {mentor_token}"}
    response = client.post(
        "/api/v1/meetings/create-meeting",
        headers=headers,
        data={
            "mentee_id": mentee.id,
            "meeting_title": "Test Meeting",
            "meeting_date": "2026-11-20T10:00:00Z"
        },
        files={"files": ("test.txt", b"Test content", "text/plain")}
    )
    assert response.status_code == 200
    data = response.json()
    assert "meeting_id" in data
    assert "extracted_text_preview" in data

def test_report_generation(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers = {"Authorization": f"Bearer {mentor_token}"}
    meeting_resp = client.post(
        "/api/v1/meetings/create-meeting",
        headers=headers,
        data={
            "mentee_id": mentee.id,
            "meeting_title": "Test Meeting for Report",
            "meeting_date": "2026-11-20T10:00:00Z"
        },
        files={"files": ("test.txt", b"Test meeting content", "text/plain")}
    )
    meeting_id = meeting_resp.json()["meeting_id"]

    report_resp = client.post(f"/api/v1/meetings/generate-report/{meeting_id}", headers=headers)
    assert report_resp.status_code == 200
    report = report_resp.json()
    assert "report_id" in report

def test_report_management(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers_m = {"Authorization": f"Bearer {mentor_token}"}
    headers_me = {"Authorization": f"Bearer {mentee_token}"}

    meeting_resp = client.post(
        "/api/v1/meetings/create-meeting",
        headers=headers_m,
        data={
            "mentee_id": mentee.id,
            "meeting_title": "Report Test Meeting",
            "meeting_date": "2026-11-20T10:00:00Z"
        },
        files={"files": ("test.txt", b"Test content", "text/plain")}
    )
    meeting_id = meeting_resp.json()["meeting_id"]

    report_resp = client.post(f"/api/v1/meetings/generate-report/{meeting_id}", headers=headers_m)
    report_id = report_resp.json()["report_id"]

    get_resp = client.get(f"/api/v1/reports/{report_id}", headers=headers_m)
    assert get_resp.status_code == 200

    approve_resp = client.post(f"/api/v1/reports/{report_id}/approve", headers=headers_m)
    assert approve_resp.status_code == 200

    share_resp = client.post(f"/api/v1/reports/{report_id}/share", headers=headers_m)
    assert share_resp.status_code == 200

    mentee_reports = client.get("/api/v1/reports", headers=headers_me)
    assert mentee_reports.status_code == 200
    assert len(mentee_reports.json()) >= 1

def test_pdf_download(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers = {"Authorization": f"Bearer {mentor_token}"}

    meeting_resp = client.post(
        "/api/v1/meetings/create-meeting",
        headers=headers,
        data={
            "mentee_id": mentee.id,
            "meeting_title": "PDF Test Meeting",
            "meeting_date": "2026-11-20T10:00:00Z"
        },
        files={"files": ("test.txt", b"Test content", "text/plain")}
    )
    meeting_id = meeting_resp.json()["meeting_id"]

    report_resp = client.post(f"/api/v1/meetings/generate-report/{meeting_id}", headers=headers)
    report_id = report_resp.json()["report_id"]

    client.post(f"/api/v1/reports/{report_id}/approve", headers=headers)
    client.post(f"/api/v1/reports/{report_id}/share", headers=headers)

    pdf_resp = client.post(f"/api/v1/reports/{report_id}/download-pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"

def test_docx_download(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers = {"Authorization": f"Bearer {mentor_token}"}

    meeting_resp = client.post(
        "/api/v1/meetings/create-meeting",
        headers=headers,
        data={
            "mentee_id": mentee.id,
            "meeting_title": "DOCX Test Meeting",
            "meeting_date": "2026-11-20T10:00:00Z"
        },
        files={"files": ("test.txt", b"Test content", "text/plain")}
    )
    meeting_id = meeting_resp.json()["meeting_id"]

    report_resp = client.post(f"/api/v1/meetings/generate-report/{meeting_id}", headers=headers)
    report_id = report_resp.json()["report_id"]

    client.post(f"/api/v1/reports/{report_id}/approve", headers=headers)
    client.post(f"/api/v1/reports/{report_id}/share", headers=headers)

    docx_resp = client.post(f"/api/v1/reports/{report_id}/download-docx", headers=headers)
    assert docx_resp.status_code == 200
    assert docx_resp.headers["content-type"] == "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

def test_task_crud(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers_m = {"Authorization": f"Bearer {mentor_token}"}

    create_resp = client.post("/api/v1/tasks/", headers=headers_m, json={
        "mentee_id": mentee.id,
        "title": "Test Task",
        "description": "Test description",
        "priority": "high",
        "deadline": "2026-12-01T10:00:00Z"
    })
    assert create_resp.status_code == 200
    task_id = create_resp.json()["id"]

    list_resp = client.get("/api/v1/tasks/", headers=headers_m)
    assert list_resp.status_code == 200
    assert len(list_resp.json()) >= 1

    update_resp = client.put(f"/api/v1/tasks/{task_id}", headers=headers_m, json={
        "status": "in_progress"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["status"] == "in_progress"

def test_notifications(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers_m = {"Authorization": f"Bearer {mentor_token}"}
    headers_me = {"Authorization": f"Bearer {mentee_token}"}

    client.post("/api/v1/report-requests", headers=headers_me, json={
        "mentor_id": mentor.id,
        "meeting_title": "Notification Test",
        "meeting_date": "2026-11-20T10:00:00Z"
    })

    notif_resp = client.get("/api/v1/notifications", headers=headers_m)
    assert notif_resp.status_code == 200
    notifications = notif_resp.json()
    assert len(notifications) >= 1

def test_unauthorized_access(client: TestClient, mentor_token: str, mentee_token: str, assigned_pair):
    mentor, mentee = assigned_pair
    headers_m = {"Authorization": f"Bearer {mentor_token}"}
    headers_me = {"Authorization": f"Bearer {mentee_token}"}

    resp = client.post("/api/v1/assignments/generate-code", headers=headers_me, json={})
    assert resp.status_code == 403

    meeting_resp = client.post(
        "/api/v1/meetings/create-meeting",
        headers=headers_m,
        data={
            "mentee_id": mentee.id,
            "meeting_title": "Auth Test",
            "meeting_date": "2026-11-20T10:00:00Z"
        },
        files={"files": ("test.txt", b"Test", "text/plain")}
    )
    meeting_id = meeting_resp.json()["meeting_id"]

    report_resp = client.post(f"/api/v1/meetings/generate-report/{meeting_id}", headers=headers_m)
    report_id = report_resp.json()["report_id"]

    approve_resp = client.post(f"/api/v1/reports/{report_id}/approve", headers=headers_me)
    assert approve_resp.status_code == 403