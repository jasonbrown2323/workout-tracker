import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.WorkoutTemplate)
def create_workout_template(
    template: schemas.WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new workout template with exercises."""
    try:
        # Create new template
        db_template = models.WorkoutTemplate(
            name=template.name,
            description=template.description
        )
        db.add(db_template)
        db.commit()
        db.refresh(db_template)
        
        # Add exercises if provided
        if template.exercises:
            for exercise in template.exercises:
                db_exercise = models.TemplateExercise(
                    template_id=db_template.id,
                    **exercise.model_dump()
                )
                db.add(db_exercise)
            
            db.commit()
            db.refresh(db_template)
        
        return db_template
    except Exception as e:
        logger.error(f"Error creating workout template: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating workout template: {str(e)}")

@router.get("/", response_model=List[schemas.WorkoutTemplate])
def read_workout_templates(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all workout templates."""
    templates = db.query(models.WorkoutTemplate).offset(skip).limit(limit).all()
    return templates

@router.get("/{template_id}", response_model=schemas.WorkoutTemplate)
def read_workout_template(
    template_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific workout template by ID."""
    template = db.query(models.WorkoutTemplate).filter(
        models.WorkoutTemplate.id == template_id
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Workout template not found")
    
    return template

@router.put("/{template_id}", response_model=schemas.WorkoutTemplate)
def update_workout_template(
    template_id: int, 
    template_update: schemas.WorkoutTemplateUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a workout template (basic info only)."""
    db_template = db.query(models.WorkoutTemplate).filter(
        models.WorkoutTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Workout template not found")
    
    # Update fields
    update_data = template_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_template, key, value)
    
    db.commit()
    db.refresh(db_template)
    return db_template

@router.delete("/{template_id}")
def delete_workout_template(
    template_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a workout template and its exercises."""
    db_template = db.query(models.WorkoutTemplate).filter(
        models.WorkoutTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Workout template not found")
    
    # Delete related template exercises
    db.query(models.TemplateExercise).filter(
        models.TemplateExercise.template_id == template_id
    ).delete()
    
    # Delete template
    db.delete(db_template)
    db.commit()
    
    return {"detail": "Workout template deleted successfully"}

# Template Exercise endpoints
@router.post("/{template_id}/exercises", response_model=schemas.TemplateExercise)
def add_template_exercise(
    template_id: int,
    exercise: schemas.TemplateExerciseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Add an exercise to a template."""
    db_template = db.query(models.WorkoutTemplate).filter(
        models.WorkoutTemplate.id == template_id
    ).first()
    
    if not db_template:
        raise HTTPException(status_code=404, detail="Workout template not found")
    
    db_exercise = models.TemplateExercise(
        template_id=template_id,
        **exercise.model_dump()
    )
    db.add(db_exercise)
    db.commit()
    db.refresh(db_exercise)
    
    return db_exercise

@router.put("/{template_id}/exercises/{exercise_id}", response_model=schemas.TemplateExercise)
def update_template_exercise(
    template_id: int,
    exercise_id: int,
    exercise_update: schemas.TemplateExerciseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a template exercise."""
    db_exercise = db.query(models.TemplateExercise).filter(
        models.TemplateExercise.id == exercise_id,
        models.TemplateExercise.template_id == template_id
    ).first()
    
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Template exercise not found")
    
    # Update fields
    update_data = exercise_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_exercise, key, value)
    
    db.commit()
    db.refresh(db_exercise)
    return db_exercise

@router.delete("/{template_id}/exercises/{exercise_id}")
def delete_template_exercise(
    template_id: int,
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a template exercise."""
    db_exercise = db.query(models.TemplateExercise).filter(
        models.TemplateExercise.id == exercise_id,
        models.TemplateExercise.template_id == template_id
    ).first()
    
    if not db_exercise:
        raise HTTPException(status_code=404, detail="Template exercise not found")
    
    db.delete(db_exercise)
    db.commit()
    
    return {"detail": "Template exercise deleted successfully"}