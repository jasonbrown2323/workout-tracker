import logging
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_active_user
from ..utils.plate_calculator import PlateCalculator
import csv
import io

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.WorkoutProgram)
def create_workout_program(
    program: schemas.WorkoutProgramCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new workout program with workouts and exercises."""
    try:
        # Create new program
        db_program = models.WorkoutProgram(
            name=program.name,
            description=program.description,
            duration_weeks=program.duration_weeks,
            is_public=program.is_public,
            creator_id=current_user.id
        )
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        
        # Add workouts if provided
        if program.workouts:
            for workout in program.workouts:
                db_workout = models.ProgramWorkout(
                    program_id=db_program.id,
                    name=workout.name,
                    week_number=workout.week_number,
                    day_number=workout.day_number,
                    order=workout.order,
                    template_id=workout.template_id
                )
                db.add(db_workout)
                db.commit()
                db.refresh(db_workout)
                
                # Add exercises if provided
                if workout.exercises:
                    for exercise in workout.exercises:
                        # Automatically detect barbell exercises
                        is_barbell = any(barbell_term in exercise.exercise_name.lower() 
                                        for barbell_term in ["barbell", "bench press", "squat", "deadlift"])
                        
                        db_exercise = models.ProgramExercise(
                            program_workout_id=db_workout.id,
                            exercise_name=exercise.exercise_name,
                            sets=exercise.sets,
                            initial_reps=exercise.initial_reps,
                            target_reps=exercise.target_reps,
                            initial_weight=exercise.initial_weight,
                            progression_strategy=exercise.progression_strategy,
                            progression_value=exercise.progression_value,
                            progression_frequency=exercise.progression_frequency,
                            order=exercise.order,
                            notes=exercise.notes,
                            category=exercise.category,
                            is_barbell_exercise=is_barbell or exercise.is_barbell_exercise
                        )
                        db.add(db_exercise)
                
                db.commit()
        
        db.refresh(db_program)
        return db_program
    except Exception as e:
        logger.error(f"Error creating workout program: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating workout program: {str(e)}")

@router.get("/", response_model=List[schemas.WorkoutProgram])
def read_workout_programs(
    skip: int = 0, 
    limit: int = 100, 
    public_only: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    """Get a list of workout programs."""
    query = db.query(models.WorkoutProgram)
    
    if public_only:
        query = query.filter(models.WorkoutProgram.is_public == True)
    else:
        # Show public programs and user's own programs
        query = query.filter(
            (models.WorkoutProgram.is_public == True) | 
            (models.WorkoutProgram.creator_id == current_user.id)
        )
    
    programs = query.offset(skip).limit(limit).all()
    return programs

@router.get("/{program_id}", response_model=schemas.WorkoutProgram)
def read_workout_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_active_user)
):
    """Get a specific workout program by ID."""
    program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    
    if not program:
        raise HTTPException(status_code=404, detail="Workout program not found")
    
    # Check if user has access (public program or own program)
    if not program.is_public and program.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this program")
    
    return program

@router.put("/{program_id}", response_model=schemas.WorkoutProgram)
def update_workout_program(
    program_id: int,
    program: schemas.WorkoutProgramUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a workout program's basic information."""
    db_program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    
    if not db_program:
        raise HTTPException(status_code=404, detail="Workout program not found")
    
    # Only the creator can update the program
    if db_program.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this program")
    
    update_data = program.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_program, key, value)
    
    db.commit()
    db.refresh(db_program)
    return db_program

@router.delete("/{program_id}")
def delete_workout_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a workout program."""
    db_program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    
    if not db_program:
        raise HTTPException(status_code=404, detail="Workout program not found")
    
    # Only the creator can delete the program
    if db_program.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this program")
    
    # Delete the program and all associated data (cascade should handle this)
    db.delete(db_program)
    db.commit()
    
    return {"detail": "Workout program deleted"}

@router.post("/import/csv", response_model=schemas.WorkoutProgram)
async def import_program_from_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Import a workout program from a CSV file."""
    try:
        contents = await file.read()
        buffer = io.StringIO(contents.decode('utf-8'))
        reader = csv.DictReader(buffer)
        
        # Extract program metadata from the first row
        program_data = {}
        workouts_data = []
        
        # Process CSV data
        current_workout = None
        for row in reader:
            if row.get('type') == 'program':
                program_data = {
                    'name': row.get('name', 'Imported Program'),
                    'description': row.get('description', ''),
                    'duration_weeks': int(row.get('duration_weeks', 8)),
                    'is_public': row.get('is_public', '').lower() == 'true'
                }
            elif row.get('type') == 'workout':
                if current_workout:
                    workouts_data.append(current_workout)
                    
                current_workout = {
                    'name': row.get('name', f"Week {row.get('week', 1)} Day {row.get('day', 1)}"),
                    'week_number': int(row.get('week', 1)),
                    'day_number': int(row.get('day', 1)),
                    'order': int(row.get('order', 0)),
                    'exercises': []
                }
            elif row.get('type') == 'exercise' and current_workout:
                exercise = {
                    'exercise_name': row.get('name', 'Exercise'),
                    'sets': int(row.get('sets', 3)),
                    'initial_reps': int(row.get('initial_reps', 8)),
                    'target_reps': int(row.get('target_reps', 12)),
                    'initial_weight': float(row.get('initial_weight', 0)) if row.get('initial_weight') else None,
                    'progression_strategy': row.get('progression', 'linear'),
                    'progression_value': float(row.get('progression_value', 5)),
                    'progression_frequency': int(row.get('progression_frequency', 1)),
                    'order': int(row.get('order', 0)),
                    'notes': row.get('notes', ''),
                    'category': row.get('category', ''),
                    'is_barbell_exercise': row.get('is_barbell', '').lower() == 'true'
                }
                current_workout['exercises'].append(exercise)
        
        # Add the last workout if exists
        if current_workout:
            workouts_data.append(current_workout)
        
        # Create the program
        program_create = schemas.ProgramImport(
            **program_data,
            workouts=workouts_data
        )
        
        # Convert to proper format for database
        db_program = models.WorkoutProgram(
            name=program_create.name,
            description=program_create.description,
            duration_weeks=program_create.duration_weeks,
            is_public=program_create.is_public,
            creator_id=current_user.id
        )
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        
        # Add workouts and exercises
        for workout_data in program_create.workouts:
            db_workout = models.ProgramWorkout(
                program_id=db_program.id,
                name=workout_data.get('name'),
                week_number=workout_data.get('week_number'),
                day_number=workout_data.get('day_number'),
                order=workout_data.get('order', 0)
            )
            db.add(db_workout)
            db.commit()
            db.refresh(db_workout)
            
            for exercise_data in workout_data.get('exercises', []):
                # Auto-detect barbell exercises if not specified
                is_barbell = exercise_data.get('is_barbell_exercise', False)
                if not is_barbell:
                    is_barbell = any(barbell_term in exercise_data.get('exercise_name', '').lower() 
                                    for barbell_term in ["barbell", "bench press", "squat", "deadlift"])
                
                db_exercise = models.ProgramExercise(
                    program_workout_id=db_workout.id,
                    exercise_name=exercise_data.get('exercise_name'),
                    sets=exercise_data.get('sets'),
                    initial_reps=exercise_data.get('initial_reps'),
                    target_reps=exercise_data.get('target_reps'),
                    initial_weight=exercise_data.get('initial_weight'),
                    progression_strategy=exercise_data.get('progression_strategy'),
                    progression_value=exercise_data.get('progression_value'),
                    progression_frequency=exercise_data.get('progression_frequency'),
                    order=exercise_data.get('order', 0),
                    notes=exercise_data.get('notes'),
                    category=exercise_data.get('category'),
                    is_barbell_exercise=is_barbell
                )
                db.add(db_exercise)
            
            db.commit()
        
        db.refresh(db_program)
        return db_program
    
    except Exception as e:
        logger.error(f"Error importing program from CSV: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error importing program: {str(e)}")

@router.post("/import/json", response_model=schemas.WorkoutProgram)
async def import_program_from_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Import a workout program from a JSON file."""
    try:
        contents = await file.read()
        program_data = json.loads(contents.decode('utf-8'))
        
        # Validate the JSON structure
        if 'name' not in program_data or 'workouts' not in program_data:
            raise ValueError("Invalid JSON format: missing required fields")
        
        # Create the program
        db_program = models.WorkoutProgram(
            name=program_data.get('name'),
            description=program_data.get('description', ''),
            duration_weeks=program_data.get('duration_weeks', 8),
            is_public=program_data.get('is_public', False),
            creator_id=current_user.id
        )
        db.add(db_program)
        db.commit()
        db.refresh(db_program)
        
        # Add workouts and exercises
        for workout_data in program_data.get('workouts', []):
            db_workout = models.ProgramWorkout(
                program_id=db_program.id,
                name=workout_data.get('name'),
                week_number=workout_data.get('week_number'),
                day_number=workout_data.get('day_number'),
                order=workout_data.get('order', 0),
                template_id=workout_data.get('template_id')
            )
            db.add(db_workout)
            db.commit()
            db.refresh(db_workout)
            
            for exercise_data in workout_data.get('exercises', []):
                # Auto-detect barbell exercises if not specified
                is_barbell = exercise_data.get('is_barbell_exercise', False)
                if not is_barbell:
                    is_barbell = any(barbell_term in exercise_data.get('exercise_name', '').lower() 
                                    for barbell_term in ["barbell", "bench press", "squat", "deadlift"])
                
                db_exercise = models.ProgramExercise(
                    program_workout_id=db_workout.id,
                    exercise_name=exercise_data.get('exercise_name'),
                    sets=exercise_data.get('sets'),
                    initial_reps=exercise_data.get('initial_reps'),
                    target_reps=exercise_data.get('target_reps'),
                    initial_weight=exercise_data.get('initial_weight'),
                    progression_strategy=exercise_data.get('progression_strategy', 'linear'),
                    progression_value=exercise_data.get('progression_value', 5.0),
                    progression_frequency=exercise_data.get('progression_frequency', 1),
                    order=exercise_data.get('order', 0),
                    notes=exercise_data.get('notes'),
                    category=exercise_data.get('category'),
                    is_barbell_exercise=is_barbell
                )
                db.add(db_exercise)
            
            db.commit()
        
        db.refresh(db_program)
        return db_program
    
    except Exception as e:
        logger.error(f"Error importing program from JSON: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Error importing program: {str(e)}")

@router.post("/{program_id}/start", response_model=schemas.UserProgramProgress)
def start_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Start a workout program for the current user."""
    # Check if program exists
    program = db.query(models.WorkoutProgram).filter(models.WorkoutProgram.id == program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Workout program not found")
    
    # Check if user already has an active instance of this program
    existing_progress = db.query(models.UserProgramProgress).filter(
        models.UserProgramProgress.user_id == current_user.id,
        models.UserProgramProgress.program_id == program_id,
        models.UserProgramProgress.is_active == True
    ).first()
    
    if existing_progress:
        raise HTTPException(status_code=400, detail="You already have an active instance of this program")
    
    # Create new progress tracking
    user_progress = models.UserProgramProgress(
        user_id=current_user.id,
        program_id=program_id,
        current_week=1,
        current_day=1,
        is_active=True
    )
    db.add(user_progress)
    db.commit()
    db.refresh(user_progress)
    
    # Initialize exercise progress for first workout
    first_workout = db.query(models.ProgramWorkout).filter(
        models.ProgramWorkout.program_id == program_id,
        models.ProgramWorkout.week_number == 1,
        models.ProgramWorkout.day_number == 1
    ).first()
    
    if first_workout:
        for exercise in first_workout.exercises:
            exercise_progress = models.ExerciseProgress(
                user_progress_id=user_progress.id,
                program_exercise_id=exercise.id,
                current_weight=exercise.initial_weight,
                current_reps_target=exercise.initial_reps
            )
            db.add(exercise_progress)
        
        db.commit()
    
    return user_progress

@router.get("/user/active", response_model=List[schemas.UserProgramProgress])
def get_active_programs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all active workout programs for the current user."""
    active_programs = db.query(models.UserProgramProgress).filter(
        models.UserProgramProgress.user_id == current_user.id,
        models.UserProgramProgress.is_active == True
    ).all()
    
    return active_programs

@router.get("/user/workout/today", response_model=schemas.WorkoutExecution)
def get_todays_workout(
    program_progress_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get today's workout based on the user's progress in a program."""
    # Get user's progress
    progress = db.query(models.UserProgramProgress).filter(
        models.UserProgramProgress.id == program_progress_id,
        models.UserProgramProgress.user_id == current_user.id
    ).first()
    
    if not progress or not progress.is_active:
        raise HTTPException(status_code=404, detail="Active program progress not found")
    
    # Get the workout for current week/day
    workout = db.query(models.ProgramWorkout).filter(
        models.ProgramWorkout.program_id == progress.program_id,
        models.ProgramWorkout.week_number == progress.current_week,
        models.ProgramWorkout.day_number == progress.current_day
    ).first()
    
    if not workout:
        raise HTTPException(status_code=404, detail="No workout found for today")
    
    # Get exercise progress
    exercise_sets = []
    for exercise in workout.exercises:
        # Find the user's progress for this exercise
        exercise_progress = db.query(models.ExerciseProgress).filter(
            models.ExerciseProgress.user_progress_id == progress.id,
            models.ExerciseProgress.program_exercise_id == exercise.id
        ).first()
        
        # If no progress exists yet, initialize it
        if not exercise_progress:
            exercise_progress = models.ExerciseProgress(
                user_progress_id=progress.id,
                program_exercise_id=exercise.id,
                current_weight=exercise.initial_weight,
                current_reps_target=exercise.target_reps
            )
            db.add(exercise_progress)
            db.commit()
            db.refresh(exercise_progress)
        
        # Create an exercise set for each set
        for set_num in range(1, exercise.sets + 1):
            exercise_set = schemas.ExerciseSetWithPlates(
                exercise_id=exercise.id,
                exercise_name=exercise.exercise_name,
                set_number=set_num,
                target_reps=exercise_progress.current_reps_target,
                target_weight=exercise_progress.current_weight or 0,
                is_barbell_exercise=exercise.is_barbell_exercise,
                plate_calculation=None
            )
            
            # Add plate calculation if it's a barbell exercise
            if exercise.is_barbell_exercise and exercise_progress.current_weight:
                exercise_set.plate_calculation = PlateCalculator.calculate_plates(exercise_progress.current_weight)
            
            exercise_sets.append(exercise_set)
    
    return schemas.WorkoutExecution(
        workout_id=workout.id,
        workout_name=workout.name,
        exercises=exercise_sets
    )

@router.post("/user/workout/complete", response_model=schemas.UserProgramProgress)
def complete_workout(
    program_progress_id: int,
    completed_sets: List[schemas.CompletedExerciseSetCreate],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Complete a workout and update progress."""
    # Get user's progress
    progress = db.query(models.UserProgramProgress).filter(
        models.UserProgramProgress.id == program_progress_id,
        models.UserProgramProgress.user_id == current_user.id
    ).first()
    
    if not progress or not progress.is_active:
        raise HTTPException(status_code=404, detail="Active program progress not found")
    
    # Create a workout session to record this completed workout
    workout = db.query(models.ProgramWorkout).filter(
        models.ProgramWorkout.program_id == progress.program_id,
        models.ProgramWorkout.week_number == progress.current_week,
        models.ProgramWorkout.day_number == progress.current_day
    ).first()
    
    if not workout:
        raise HTTPException(status_code=404, detail="No workout found for today")
    
    # Create a workout session
    session = models.WorkoutSession(
        user_id=current_user.id,
        notes=f"Program: {progress.program.name} - Week {progress.current_week}, Day {progress.current_day}"
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    # Process completed sets
    for set_data in completed_sets:
        # Find the corresponding exercise progress
        exercise_progress = db.query(models.ExerciseProgress).filter(
            models.ExerciseProgress.id == set_data.exercise_progress_id
        ).first()
        
        if not exercise_progress or exercise_progress.user_progress_id != progress.id:
            continue  # Skip if not found or not part of this progress
        
        # Record the completed set
        completed_set = models.CompletedExerciseSet(
            exercise_progress_id=exercise_progress.id,
            workout_session_id=session.id,
            set_number=set_data.set_number,
            reps_completed=set_data.reps_completed,
            weight_used=set_data.weight_used,
            notes=set_data.notes
        )
        db.add(completed_set)
        
        # Also create a workout entry for consistency with the existing system
        program_exercise = exercise_progress.program_exercise
        workout_entry = models.WorkoutEntry(
            session_id=session.id,
            exercise_name=program_exercise.exercise_name,
            sets=1,  # One entry per set
            reps=set_data.reps_completed,
            weight=set_data.weight_used,
            notes=set_data.notes,
            category=program_exercise.category
        )
        db.add(workout_entry)
        
        # Update the exercise progress based on performance
        if set_data.reps_completed >= exercise_progress.current_reps_target:
            # Calculate if it's time to increase weight
            completed_sets_count = db.query(models.CompletedExerciseSet).filter(
                models.CompletedExerciseSet.exercise_progress_id == exercise_progress.id
            ).count()
            
            if completed_sets_count % program_exercise.progression_frequency == 0:
                # Apply progression
                if program_exercise.progression_strategy == "linear":
                    if exercise_progress.current_weight:
                        exercise_progress.current_weight += program_exercise.progression_value
                
                # Update last_update
                exercise_progress.last_update = datetime.utcnow()
    
    db.commit()
    
    # Advance to the next workout day
    next_day = progress.current_day + 1
    next_week = progress.current_week
    
    # Check if we need to move to the next week
    max_day_in_week = db.query(models.ProgramWorkout.day_number).filter(
        models.ProgramWorkout.program_id == progress.program_id,
        models.ProgramWorkout.week_number == progress.current_week
    ).order_by(models.ProgramWorkout.day_number.desc()).first()
    
    if max_day_in_week and next_day > max_day_in_week[0]:
        next_day = 1
        next_week += 1
    
    # Check if program is complete
    if next_week > progress.program.duration_weeks:
        progress.is_active = False
        progress.completed_at = datetime.utcnow()
    else:
        progress.current_day = next_day
        progress.current_week = next_week
        
        # Initialize exercise progress for the next workout
        next_workout = db.query(models.ProgramWorkout).filter(
            models.ProgramWorkout.program_id == progress.program_id,
            models.ProgramWorkout.week_number == next_week,
            models.ProgramWorkout.day_number == next_day
        ).first()
        
        if next_workout:
            for exercise in next_workout.exercises:
                existing = db.query(models.ExerciseProgress).filter(
                    models.ExerciseProgress.user_progress_id == progress.id,
                    models.ExerciseProgress.program_exercise_id == exercise.id
                ).first()
                
                if not existing:
                    # Initialize with either default values or based on previous performance
                    exercise_progress = models.ExerciseProgress(
                        user_progress_id=progress.id,
                        program_exercise_id=exercise.id,
                        current_weight=exercise.initial_weight,
                        current_reps_target=exercise.initial_reps
                    )
                    db.add(exercise_progress)
    
    db.commit()
    db.refresh(progress)
    return progress