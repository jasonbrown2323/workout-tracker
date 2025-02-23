from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float, Text
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    workouts = relationship("WorkoutSession", back_populates="user")

class WorkoutSession(Base):
    __tablename__ = "workout_sessions"
    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    notes = Column(Text)
    user = relationship("User", back_populates="workouts")
    entries = relationship("WorkoutEntry", back_populates="session")

class WorkoutEntry(Base):
    __tablename__ = "workout_entries"
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("workout_sessions.id"))
    exercise_name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    weight = Column(Float)
    notes = Column(Text)
    category = Column(String, nullable=True)  # Make nullable
    difficulty = Column(Integer, nullable=True)
    session = relationship("WorkoutSession", back_populates="entries")
