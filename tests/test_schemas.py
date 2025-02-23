import pytest
from datetime import datetime, timedelta
from app.schemas import WorkoutSessionBase, WorkoutEntryBase

def test_future_date_validation():
    future_date = datetime.utcnow() + timedelta(days=1)
    with pytest.raises(ValueError, match="Workout date cannot be in the future"):
        WorkoutSessionBase(date=future_date)

def test_invalid_exercise_name():
    with pytest.raises(
        ValueError,
        match="String should match pattern"  # Updated to match actual Pydantic error
    ):
        WorkoutEntryBase(
            exercise_name="!!!Invalid!!!",
            category="Legs",
            sets=3,
            reps=10,
            weight=225.0
        )

def test_invalid_weight():
    with pytest.raises(ValueError):
        WorkoutEntryBase(
            exercise_name="Squat",
            category="Legs",
            sets=3,
            reps=10,
            weight=-100  # Invalid negative weight
        )

def test_workout_session_default_date():
    session = WorkoutSessionBase()
    assert session.date is not None
    assert session.notes is None

def test_workout_entry_required_fields():
    with pytest.raises(ValueError):
        WorkoutEntryBase()  # Missing required fields
