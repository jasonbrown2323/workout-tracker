import pytest
from fastapi.testclient import TestClient
from app.main import app
from .conftest import test_user, test_db  # Import required fixtures

client = TestClient(app)

def test_create_user():
    response = client.post(
        "/users/",
        json={
            "email": "newuser@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "newuser@example.com"
    assert "id" in data

def test_create_duplicate_user(test_user):
    response = client.post(
        "/users/",
        json={
            "email": "test@example.com",
            "password": "testpass123"
        }
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Email already registered"

def test_read_users():
    response = client.get("/users/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_read_user(test_user):
    response = client.get(f"/users/{test_user.id}")
    assert response.status_code == 200
    assert response.json()["email"] == test_user.email

def test_read_nonexistent_user():
    response = client.get("/users/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "User not found"
