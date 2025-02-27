import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db
from app import models
from app.utils.auth import get_current_active_user

# Use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Create a dependency override for authentication
async def override_get_current_active_user():
    # Return a test user for all authenticated endpoints
    user = models.User(
        id=1,
        email="test@example.com",
        hashed_password="testpass",
        is_active=True
    )
    return user

app.dependency_overrides[get_db] = override_get_db
app.dependency_overrides[get_current_active_user] = override_get_current_active_user
client = TestClient(app)

def create_test_user(db):
    user = models.User(
        email="test@example.com",
        hashed_password="testpass",
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@pytest.fixture
def test_user(test_db):
    return create_test_user(test_db)

def test_create_workout(test_user):
    response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["notes"] == "Test workout"
    assert "id" in data
    # user_id should match our authenticated test user (id=1)
    assert data["user_id"] == 1
    assert "id" in data

def test_read_workouts():
    response = client.get("/workouts/")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_invalid_workout_entry(test_user, test_db):
    workout_response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
        }
    )
    assert workout_response.status_code == 200
    workout_id = workout_response.json()["id"]
    
    # Test invalid weight
    response = client.post(
        f"/workouts/{workout_id}/entries",
        json={
            "exercise_name": "Squat",
            "sets": 3,
            "reps": 10,
            "weight": -10,
            "notes": "Invalid weight"
        }
    )
    assert response.status_code == 422

def test_search_workouts(test_user, test_db):
    # Create test workout
    client.post(
        "/workouts/",
        json={
            "notes": "Test workout",
            "user_id": test_user.id
        }
    )
    
    response = client.get("/workouts/search/?exercise_name=Squat")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_exercise_stats(test_user, test_db):
    # Create test workout with entries
    workout_response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
        }
    )
    assert workout_response.status_code == 200
    workout = workout_response.json()
    
    client.post(
        f"/workouts/{workout['id']}/entries",
        json={
            "exercise_name": "Squat",
            "sets": 3,
            "reps": 10,
            "weight": 225.0,
            "notes": "Test set"
        }
    )
    
    response = client.get("/workouts/stats/exercise/Squat")
    assert response.status_code == 200
    assert "average_weight" in response.json()

def test_exercise_stats_no_data(test_db):
    response = client.get("/workouts/stats/exercise/NonexistentExercise")
    assert response.status_code == 200
    data = response.json()
    assert data["average_weight"] == 0
    assert data["total_sets"] == 0

def test_category_stats(test_user, test_db):
    # Create workout with entries
    workout_response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
        }
    )
    assert workout_response.status_code == 200
    workout = workout_response.json()
    
    client.post(
        f"/workouts/{workout['id']}/entries",
        json={
            "exercise_name": "Bench Press",
            "category": "Chest",
            "sets": 3,
            "reps": 10,
            "weight": 225.0,
            "notes": "Test set"
        }
    )
    
    response = client.get("/workouts/stats/category/Chest")
    assert response.status_code == 200
    data = response.json()
    assert "exercises" in data
    assert len(data["exercises"]) > 0
    assert data["exercises"][0]["name"] == "Bench Press"

def test_category_stats_no_data(test_db):
    response = client.get("/workouts/stats/category/NonexistentCategory")
    assert response.status_code == 200
    data = response.json()
    assert len(data["exercises"]) == 0

def test_personal_records(test_user, test_db):
    # Create workout with entries
    workout_response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
        }
    )
    assert workout_response.status_code == 200
    workout = workout_response.json()
    
    client.post(
        f"/workouts/{workout['id']}/entries",
        json={
            "exercise_name": "Deadlift",
            "category": "Back",
            "sets": 1,
            "reps": 5,
            "weight": 315.0,
            "notes": "New PR"
        }
    )
    
    response = client.get(f"/workouts/users/{test_user.id}/personal-records")  # Updated URL
    assert response.status_code == 200
    data = response.json()
    assert "records" in data
    assert len(data["records"]) > 0
    assert data["records"][0]["exercise"] == "Deadlift"
    assert data["records"][0]["max_weight"] == 315.0

def test_invalid_date_range_search(test_db):
    response = client.get(
        "/workouts/search/?start_date=2025-01-01"
    )
    assert response.status_code == 200
    assert len(response.json()) == 0

def test_workout_not_found():
    response = client.get("/workouts/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Workout not found"

def test_workout_create_with_invalid_user(test_db):
    # Since we're now using the authenticated user, we need to test this differently
    # This test is now testing that we can create a workout successfully
    response = client.post(
        "/workouts/",
        json={
            "notes": "Test workout"
        }
    )
    assert response.status_code == 200
    assert "id" in response.json()

def test_workout_stats_invalid_period(test_db):
    response = client.get("/workouts/stats/exercise/Squat?days=0")
    assert response.status_code == 422

def test_workout_category_stats_invalid_date(test_db):
    response = client.get("/workouts/stats/category/Legs?days=-1")
    assert response.status_code == 422
