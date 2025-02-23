from pydantic import BaseModel, EmailStr, ConfigDict, Field, field_validator
from typing import Optional, List
from datetime import datetime, date
import re

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

VALID_CATEGORIES = ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other']

class WorkoutEntryBase(BaseModel):
    exercise_name: str = Field(..., min_length=2, max_length=50, pattern="^[a-zA-Z0-9 -]+$")
    sets: int = Field(..., gt=0, le=20)
    reps: int = Field(..., gt=0, le=100)
    weight: float = Field(..., ge=0, le=2000)  # max 2000 lbs/kg
    notes: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None)  # Make category optional
    difficulty: Optional[int] = Field(None, ge=1, le=10)  # 1-10 scale

    @field_validator('exercise_name')
    @classmethod
    def validate_exercise_name(cls, v: str) -> str:
        if not re.match("^[a-zA-Z0-9 -]+$", v):
            raise ValueError('Exercise name can only contain letters, numbers, spaces, and hyphens')
        return v.title()

    @field_validator('category')
    @classmethod
    def validate_category(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in VALID_CATEGORIES:
            raise ValueError(f'Category must be one of: {", ".join(VALID_CATEGORIES)}')
        return v

class WorkoutEntryCreate(WorkoutEntryBase):
    pass

class WorkoutEntryUpdate(BaseModel):
    exercise_name: Optional[str] = Field(None, min_length=2, max_length=50, pattern="^[a-zA-Z0-9 -]+$")
    sets: Optional[int] = Field(None, gt=0, le=20)
    reps: Optional[int] = Field(None, gt=0, le=100)
    weight: Optional[float] = Field(None, ge=0, le=2000)
    notes: Optional[str] = Field(None, max_length=500)
    category: Optional[str] = Field(None)
    difficulty: Optional[int] = Field(None, ge=1, le=10)
    
    model_config = ConfigDict(from_attributes=True)

class WorkoutEntry(WorkoutEntryBase):
    id: int
    session_id: int
    model_config = ConfigDict(from_attributes=True)

class WorkoutSessionBase(BaseModel):
    notes: Optional[str] = Field(None, max_length=500)
    date: Optional[datetime] = Field(default_factory=datetime.utcnow)

    @field_validator('date')
    @classmethod
    def validate_date(cls, v: datetime) -> datetime:
        if v > datetime.utcnow():
            raise ValueError('Workout date cannot be in the future')
        return v

class WorkoutSessionCreate(WorkoutSessionBase):
    user_id: int

class WorkoutSession(WorkoutSessionBase):
    id: int
    date: datetime
    user_id: int
    entries: List[WorkoutEntry] = []
    model_config = ConfigDict(from_attributes=True)

class WorkoutSessionUpdate(BaseModel):
    notes: Optional[str] = None
    date: Optional[datetime] = None

class WorkoutEntryUpdate(BaseModel):
    exercise_name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    weight: Optional[float] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[int] = Field(None, ge=1, le=10)  # 1-10 scale
