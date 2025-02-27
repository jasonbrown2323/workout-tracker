from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Float, Text, Table
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime

# Association table for many-to-many relationship between WorkoutPlan and WorkoutTemplate
workout_plan_template = Table('workout_plan_template',
    Base.metadata,
    Column('plan_id', Integer, ForeignKey('workout_plans.id')),
    Column('template_id', Integer, ForeignKey('workout_templates.id'))
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    workouts = relationship("WorkoutSession", back_populates="user")
    workout_plans = relationship("WorkoutPlan", back_populates="user")
    created_programs = relationship("WorkoutProgram", back_populates="creator")
    program_progress = relationship("UserProgramProgress", back_populates="user")

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

class WorkoutPlan(Base):
    __tablename__ = "workout_plans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(Integer, ForeignKey("users.id"))
    # Relationships
    user = relationship("User", back_populates="workout_plans")
    templates = relationship("WorkoutTemplate", secondary=workout_plan_template, back_populates="plans")

class WorkoutTemplate(Base):
    __tablename__ = "workout_templates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    # Relationships
    plans = relationship("WorkoutPlan", secondary=workout_plan_template, back_populates="templates")
    exercises = relationship("TemplateExercise", back_populates="template")

class TemplateExercise(Base):
    __tablename__ = "template_exercises"
    id = Column(Integer, primary_key=True, index=True)
    template_id = Column(Integer, ForeignKey("workout_templates.id"))
    exercise_name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(Integer, nullable=False)
    rest_seconds = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    order = Column(Integer, default=0)  # For ordering exercises within a template
    # Relationships
    template = relationship("WorkoutTemplate", back_populates="exercises")

# New models for Workout Programs with progressive overload

class WorkoutProgram(Base):
    __tablename__ = "workout_programs"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    duration_weeks = Column(Integer, default=8)  # Typical program length
    created_at = Column(DateTime, default=datetime.utcnow)
    is_public = Column(Boolean, default=False)
    creator_id = Column(Integer, ForeignKey("users.id"))
    
    # Relationships
    creator = relationship("User", back_populates="created_programs")
    workouts = relationship("ProgramWorkout", back_populates="program")
    active_users = relationship("UserProgramProgress", back_populates="program")

class ProgramWorkout(Base):
    __tablename__ = "program_workouts"
    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("workout_programs.id"))
    template_id = Column(Integer, ForeignKey("workout_templates.id"), nullable=True)
    name = Column(String, nullable=False)
    week_number = Column(Integer, nullable=False)
    day_number = Column(Integer, nullable=False)
    order = Column(Integer, default=0)  # For ordering workouts within a day
    
    # Relationships
    program = relationship("WorkoutProgram", back_populates="workouts")
    template = relationship("WorkoutTemplate")
    exercises = relationship("ProgramExercise", back_populates="program_workout")

class ProgramExercise(Base):
    __tablename__ = "program_exercises"
    id = Column(Integer, primary_key=True, index=True)
    program_workout_id = Column(Integer, ForeignKey("program_workouts.id"))
    exercise_name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    initial_reps = Column(Integer, nullable=False)
    target_reps = Column(Integer, nullable=False)
    initial_weight = Column(Float, nullable=True)
    progression_strategy = Column(String, default="linear")  # linear, undulating, etc.
    progression_value = Column(Float, default=5.0)  # e.g., add 5 lbs each session
    progression_frequency = Column(Integer, default=1)  # e.g., every 1 workout
    order = Column(Integer, default=0)  # Ordering within workout
    notes = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    is_barbell_exercise = Column(Boolean, default=False)
    
    # Relationships
    program_workout = relationship("ProgramWorkout", back_populates="exercises")

class UserProgramProgress(Base):
    __tablename__ = "user_program_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    program_id = Column(Integer, ForeignKey("workout_programs.id"))
    current_week = Column(Integer, default=1)
    current_day = Column(Integer, default=1)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    user = relationship("User", back_populates="program_progress")
    program = relationship("WorkoutProgram", back_populates="active_users")
    exercise_progress = relationship("ExerciseProgress", back_populates="user_progress")

class ExerciseProgress(Base):
    __tablename__ = "exercise_progress"
    id = Column(Integer, primary_key=True, index=True)
    user_progress_id = Column(Integer, ForeignKey("user_program_progress.id"))
    program_exercise_id = Column(Integer, ForeignKey("program_exercises.id"))
    current_weight = Column(Float, nullable=True)
    current_reps_target = Column(Integer, nullable=False)
    last_update = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user_progress = relationship("UserProgramProgress", back_populates="exercise_progress")
    program_exercise = relationship("ProgramExercise")
    completed_sets = relationship("CompletedExerciseSet", back_populates="exercise_progress")

class CompletedExerciseSet(Base):
    __tablename__ = "completed_exercise_sets"
    id = Column(Integer, primary_key=True, index=True)
    exercise_progress_id = Column(Integer, ForeignKey("exercise_progress.id"))
    workout_session_id = Column(Integer, ForeignKey("workout_sessions.id"), nullable=True)
    set_number = Column(Integer, nullable=False)
    reps_completed = Column(Integer, nullable=False)
    weight_used = Column(Float, nullable=True)
    completed_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    
    # Relationships
    exercise_progress = relationship("ExerciseProgress", back_populates="completed_sets")
    workout_session = relationship("WorkoutSession")
