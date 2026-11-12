import pytest
from fastapi.testclient import TestClient


def test_profile_update(client: TestClient, mentor_token: str):
    headers = {"Authorization": f"Bearer {mentor_token}"}
    response = client.put("/api/v1/auth/profile", headers=headers, json={
        "full_name": "Updated Name"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["email"] == "test.mentor@example.com"


def test_change_password(client: TestClient, mentor_token: str):
    headers = {"Authorization": f"Bearer {mentor_token}"}
    response = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "Test@123",
        "new_password": "NewPass@123"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"


def test_change_password_wrong_current(client: TestClient, mentor_token: str):
    headers = {"Authorization": f"Bearer {mentor_token}"}
    response = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "Wrong@123",
        "new_password": "NewPass@123"
    })
    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


def test_change_password_mentee(client: TestClient, mentee_token: str):
    headers = {"Authorization": f"Bearer {mentee_token}"}
    response = client.post("/api/v1/auth/change-password", headers=headers, json={
        "current_password": "Test@123",
        "new_password": "NewPass@123"
    })
    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"