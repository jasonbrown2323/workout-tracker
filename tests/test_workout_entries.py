import pytest
from fastapi.testclient import TestClient
from app.main import app
from app import models
from app.utils.auth import get_current_active_user
from .test_workouts import test_user, override_get_current_active_user

# Override authentication for tests
app.dependency_overrides[get_current_active_user] = override_get_current_active_user
client = TestClient(app)

def test_create_workout_entry(test_user, test_db):  # test_db comes from conftest.py
    # First create a workout session
    workout_response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
            # user_id is no longer needed as it comes from the authenticated user
        }
    )
    assert workout_response.status_code == 200
    workout_id = workout_response.json()["id"]
    
    # Then create a workout entry with category
    entry_data = {
        "exercise_name": "Squat",
        "sets": 3,
        "reps": 10,
        "weight": 225.0,
        "notes": "Feeling strong",
        "category": "Legs"  # Add required category field
    }
    
    response = client.post(
        f"/workouts/{workout_id}/entries",
        json=entry_data
    )
    assert response.status_code == 200
    data = response.json()
    assert data["exercise_name"] == entry_data["exercise_name"]
    assert data["sets"] == entry_data["sets"]
    assert data["category"] == entry_data["category"]
    assert data["session_id"] == workout_id

def test_create_workout_entry_session_not_found(test_db):
    response = client.post(
        "/workouts/999/entries",
        json={
            "exercise_name": "Squat",
            "category": "Legs",
            "sets": 3,
            "reps": 10,
            "weight": 225.0,
            "notes": "Test set"
        }
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Workout session not found"

def test_read_workout_entries(test_user, test_db):
    # Create a workout and entry first
    workout_response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
            # user_id is no longer needed as it comes from the authenticated user
        }
    )
    assert workout_response.status_code == 200
    workout_id = workout_response.json()["id"]
    
    response = client.get(f"/workouts/{workout_id}/entries")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_create_workout_entry_with_category(test_db):
    # Create test user and workout session first
    user = models.User(email="test@test.com", hashed_password="test")
    test_db.add(user)
    test_db.commit()
    
    session = models.WorkoutSession(user_id=user.id)
    test_db.add(session)
    test_db.commit()

    response = client.post(
        f"/workouts/{session.id}/entries",
        json={
            "exercise_name": "Bench Press",
            "category": "Chest",
            "sets": 3,
            "reps": 10,
            "weight": 225,
            "difficulty": 8
        }
    )
    assert response.status_code == 200
    assert response.json()["category"] == "Chest"

def test_create_workout_entry_invalid_category(test_db):
    # Similar setup as above
    response = client.post(
        "/workouts/1/entries",
        json={
            "exercise_name": "Bench Press",
            "category": "Invalid",
            "sets": 3,
            "reps": 10,
            "weight": 225
        }
    )
    assert response.status_code == 422  # Validation error

def test_update_workout_entry(test_user, test_db):
    # Create test workout and entry first
    workout_response = client.post(
        "/workouts/",
        json={"notes": "Test workout"}
    )
    assert workout_response.status_code == 200
    workout_id = workout_response.json()["id"]
    
    entry_response = client.post(
        f"/workouts/{workout_id}/entries",
        json={
            "exercise_name": "Bench Press",
            "category": "Chest",
            "sets": 3,
            "reps": 10,
            "weight": 225
        }
    )
    entry_id = entry_response.json()["id"]
    
    # Update the entry
    update_response = client.put(
        f"/workouts/{workout_id}/entries/{entry_id}",
        json={
            "sets": 4,
            "reps": 8,
            "weight": 235
        }
    )
    assert update_response.status_code == 200
    assert update_response.json()["sets"] == 4
    assert update_response.json()["weight"] == 235

def test_update_workout_entry_not_found(test_user, test_db):
    # Try to update non-existent entry
    response = client.put(
        "/workouts/1/entries/999",
        json={
            "sets": 4,
            "reps": 8,
            "weight": 235
        }
    )
    assert response.status_code == 404

def test_delete_workout_entry(test_user, test_db):
    # Create test workout and entry
    workout_response = client.post(
        "/workouts/",
        json={"notes": "Test workout"}
    )
    assert workout_response.status_code == 200
    workout_id = workout_response.json()["id"]
    
    entry_response = client.post(
        f"/workouts/{workout_id}/entries",
        json={
            "exercise_name": "Squat",
            "category": "Legs",
            "sets": 3,
            "reps": 10,
            "weight": 225
        }
    )
    entry_id = entry_response.json()["id"]
    
    # Delete the entry
    delete_response = client.delete(f"/workouts/{workout_id}/entries/{entry_id}")
    assert delete_response.status_code == 200
    
    # Verify it's gone
    get_response = client.get(f"/workouts/{workout_id}/entries")
    assert len(get_response.json()) == 0

def test_delete_workout_entry_not_found(test_user, test_db):
    # Try to delete non-existent entry
    response = client.delete("/workouts/1/entries/999")
    assert response.status_code == 404

def test_create_workout_entry_db_error(test_user, test_db):
    # Test database error handling by creating an invalid entry
    response = client.post(
        "/workouts/1/entries",
        json={
            "exercise_name": None,  # This should cause a database error
            "category": "Chest",
            "sets": 3,
            "reps": 10,
            "weight": 225
        }
    )
    assert response.status_code == 422
