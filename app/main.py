from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import health, users, workouts, workout_entries, auth, workout_plans, workout_templates, workout_programs
from .database import engine, init_db
from . import models
import os

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Initialize database tables
init_db()

# Configure CORS
# Get allowed origins from environment or use a default for development
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:3002,http://192.168.123.101:3002")
allowed_origins = allowed_origins_str.split(",") if allowed_origins_str != "*" else ["*"]
print(f"CORS enabled for origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)
print(f"CORS middleware added with origins: {'all origins' if '*' in allowed_origins else allowed_origins}")

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(workout_entries.router, prefix="/workouts", tags=["workout-entries"])
app.include_router(workout_plans.router, prefix="/workout-plans", tags=["workout-plans"])
app.include_router(workout_templates.router, prefix="/workout-templates", tags=["workout-templates"])
app.include_router(workout_programs.router, prefix="/workout-programs", tags=["workout-programs"])

# Add endpoint for exercise names
@app.get("/exercises", response_model=list[str])
async def get_all_exercises():
    # This is a simple hardcoded list of common exercises
    # In a real application, you would want to store these in the database
    return [
        "Bench Press", "Incline Bench Press", "Decline Bench Press", "Push Up", 
        "Squat", "Front Squat", "Leg Press", "Lunge", "Romanian Deadlift",
        "Deadlift", "Sumo Deadlift", "Barbell Row", "Pull Up", "Lat Pulldown",
        "Shoulder Press", "Military Press", "Lateral Raise", "Face Pull",
        "Bicep Curl", "Hammer Curl", "Barbell Curl", "Tricep Extension", "Skull Crusher",
        "Crunch", "Plank", "Russian Twist", "Leg Raise", "Calf Raise",
        "Chest Fly", "Cable Crossover", "Dip", "Close Grip Bench Press",
        "Hack Squat", "Goblet Squat", "Bulgarian Split Squat", "Step Up",
        "Good Morning", "Hip Thrust", "Glute Bridge", "Cable Row",
        "T-Bar Row", "Chin Up", "One Arm Dumbbell Row", "Shrug",
        "Upright Row", "Reverse Fly", "Arnold Press", "Push Press",
        "Concentration Curl", "Preacher Curl", "Spider Curl", "Cable Curl",
        "Tricep Pushdown", "Overhead Tricep Extension", "Diamond Push Up",
        "Ab Wheel Rollout", "Mountain Climber", "Hanging Leg Raise",
        "Standing Calf Raise", "Seated Calf Raise"
    ]