from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime, date
import re

# User schemas
class UserBase(BaseModel):
    email: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    is_active: bool
    
    class Config:
        from_attributes = True

# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Workout session schemas
class WorkoutSessionBase(BaseModel):
    notes: Optional[str] = None
    
class WorkoutSessionCreate(WorkoutSessionBase):
    date: Optional[datetime] = None
    
    @validator('date', pre=True)
    def validate_date(cls, v):
        if v and isinstance(v, datetime):
            if v > datetime.now():
                raise ValueError("Date cannot be in the future")
        return v

class WorkoutSessionUpdate(WorkoutSessionBase):
    date: Optional[datetime] = None
    
    @validator('date', pre=True)
    def validate_date(cls, v):
        if v and isinstance(v, datetime):
            if v > datetime.now():
                raise ValueError("Date cannot be in the future")
        return v

class WorkoutSession(WorkoutSessionBase):
    id: int
    date: datetime
    user_id: int
    entries: List["WorkoutEntry"] = []
    
    class Config:
        from_attributes = True

# Workout entry schemas
class WorkoutEntryBase(BaseModel):
    exercise_name: str
    sets: int
    reps: int
    weight: Optional[float] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    difficulty: Optional[int] = None
    
    @validator('exercise_name')
    def validate_exercise_name(cls, v):
        if len(v.strip()) < 2:
            raise ValueError("Exercise name must be at least 2 characters")
        return v
    
    @validator('weight')
    def validate_weight(cls, v):
        if v is not None and v < 0:
            raise ValueError("Weight cannot be negative")
        return v

class WorkoutEntryCreate(WorkoutEntryBase):
    pass

class WorkoutEntryUpdate(WorkoutEntryBase):
    exercise_name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None

class WorkoutEntry(WorkoutEntryBase):
    id: int
    session_id: int
    
    class Config:
        from_attributes = True

# Workout plan schemas
class WorkoutPlanBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkoutPlanCreate(WorkoutPlanBase):
    template_ids: Optional[List[int]] = None

class WorkoutPlanUpdate(WorkoutPlanBase):
    name: Optional[str] = None
    description: Optional[str] = None
    template_ids: Optional[List[int]] = None

class WorkoutPlan(WorkoutPlanBase):
    id: int
    created_at: datetime
    user_id: int
    templates: List["WorkoutTemplate"] = []
    
    class Config:
        from_attributes = True

# Workout template schemas
class TemplateExerciseBase(BaseModel):
    exercise_name: str
    sets: int
    reps: int
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    order: int = 0

class TemplateExerciseCreate(TemplateExerciseBase):
    pass

class TemplateExerciseUpdate(TemplateExerciseBase):
    exercise_name: Optional[str] = None
    sets: Optional[int] = None
    reps: Optional[int] = None
    rest_seconds: Optional[int] = None
    notes: Optional[str] = None
    category: Optional[str] = None
    order: Optional[int] = None

class TemplateExercise(TemplateExerciseBase):
    id: int
    template_id: int
    
    class Config:
        from_attributes = True

class WorkoutTemplateBase(BaseModel):
    name: str
    description: Optional[str] = None

class WorkoutTemplateCreate(WorkoutTemplateBase):
    exercises: Optional[List[TemplateExerciseCreate]] = None

class WorkoutTemplateUpdate(WorkoutTemplateBase):
    name: Optional[str] = None
    description: Optional[str] = None
    exercises: Optional[List[TemplateExerciseCreate]] = None

class WorkoutTemplate(WorkoutTemplateBase):
    id: int
    exercises: List[TemplateExercise] = []
    
    class Config:
        from_attributes = True

# Stats schemas
class ExerciseStats(BaseModel):
    exercise_name: str
    average_weight: float
    max_weight: float
    total_sets: int
    date_range: List[date]

class CategoryStats(BaseModel):
    category: str
    total_sets: int
    exercise_count: int
    exercise_list: List[str]

class PersonalRecord(BaseModel):
    exercise_name: str
    weight: float
    reps: int
    date: datetime

class ExercisePersonalRecords(BaseModel):
    exercise: str
    records: List[PersonalRecord]

class PersonalRecordsResponse(BaseModel):
    exercises: List[ExercisePersonalRecords]

# Plate calculator schema
class PlateCalculation(BaseModel):
    target_weight: float
    bar_weight: float
    weight_per_side: float
    plates_per_side: List[float]
    actual_weight: float
    error: Optional[str] = None

# New schemas for workout programs

class ProgramExerciseBase(BaseModel):
    exercise_name: str
    sets: int
    initial_reps: int
    target_reps: int
    initial_weight: Optional[float] = None
    progression_strategy: str = "linear"
    progression_value: float = 5.0
    progression_frequency: int = 1
    order: int = 0
    notes: Optional[str] = None
    category: Optional[str] = None
    is_barbell_exercise: bool = False

class ProgramExerciseCreate(ProgramExerciseBase):
    pass

class ProgramExercise(ProgramExerciseBase):
    id: int
    program_workout_id: int
    
    class Config:
        from_attributes = True

class ProgramWorkoutBase(BaseModel):
    name: str
    week_number: int
    day_number: int
    order: int = 0
    template_id: Optional[int] = None

class ProgramWorkoutCreate(ProgramWorkoutBase):
    exercises: Optional[List[ProgramExerciseCreate]] = None

class ProgramWorkout(ProgramWorkoutBase):
    id: int
    program_id: int
    exercises: List[ProgramExercise] = []
    
    class Config:
        from_attributes = True

class WorkoutProgramBase(BaseModel):
    name: str
    description: Optional[str] = None
    duration_weeks: int = 8
    is_public: bool = False

class WorkoutProgramCreate(WorkoutProgramBase):
    workouts: Optional[List[ProgramWorkoutCreate]] = None

class WorkoutProgramUpdate(WorkoutProgramBase):
    name: Optional[str] = None
    description: Optional[str] = None
    duration_weeks: Optional[int] = None
    is_public: Optional[bool] = None

class WorkoutProgram(WorkoutProgramBase):
    id: int
    created_at: datetime
    creator_id: int
    workouts: List[ProgramWorkout] = []
    
    class Config:
        from_attributes = True

class UserProgramProgressBase(BaseModel):
    program_id: int
    current_week: int = 1
    current_day: int = 1
    is_active: bool = True

class UserProgramProgressCreate(UserProgramProgressBase):
    pass

class UserProgramProgressUpdate(BaseModel):
    current_week: Optional[int] = None
    current_day: Optional[int] = None
    is_active: Optional[bool] = None
    completed_at: Optional[datetime] = None

class UserProgramProgress(UserProgramProgressBase):
    id: int
    user_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

class ExerciseProgressBase(BaseModel):
    program_exercise_id: int
    current_weight: Optional[float] = None
    current_reps_target: int

class ExerciseProgressCreate(ExerciseProgressBase):
    pass

class ExerciseProgressUpdate(BaseModel):
    current_weight: Optional[float] = None
    current_reps_target: Optional[int] = None

class ExerciseProgress(ExerciseProgressBase):
    id: int
    user_progress_id: int
    last_update: datetime
    
    class Config:
        from_attributes = True

class CompletedExerciseSetBase(BaseModel):
    set_number: int
    reps_completed: int
    weight_used: Optional[float] = None
    notes: Optional[str] = None

class CompletedExerciseSetCreate(CompletedExerciseSetBase):
    pass

class CompletedExerciseSet(CompletedExerciseSetBase):
    id: int
    exercise_progress_id: int
    workout_session_id: Optional[int] = None
    completed_at: datetime
    
    class Config:
        from_attributes = True

class TodaysWorkout(BaseModel):
    program_name: str
    week: int
    day: int
    workout_name: str
    exercises: List[ExerciseProgress]

class ExerciseSetWithPlates(BaseModel):
    exercise_id: int
    exercise_name: str
    set_number: int
    target_reps: int
    target_weight: float
    is_barbell_exercise: bool
    plate_calculation: Optional[PlateCalculation] = None

class WorkoutExecution(BaseModel):
    workout_id: int
    workout_name: str
    exercises: List[ExerciseSetWithPlates]

class ProgramImport(BaseModel):
    name: str
    description: Optional[str] = None
    duration_weeks: int
    is_public: bool = False
    workouts: List[dict]
    
# Update forward references
WorkoutSession.model_rebuild()
WorkoutPlan.model_rebuild()