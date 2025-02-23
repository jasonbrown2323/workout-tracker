from fastapi import FastAPI
from app.routers import health, users, workouts, workout_entries
from .database import engine, init_db
from . import models

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Initialize database tables
init_db()

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(workouts.router, prefix="/workouts", tags=["workouts"])
app.include_router(workout_entries.router, prefix="/workouts", tags=["workout-entries"])