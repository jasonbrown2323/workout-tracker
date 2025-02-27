import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from .. import models, schemas
from ..utils.auth import get_current_active_user

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.WorkoutPlan)
def create_workout_plan(
    plan: schemas.WorkoutPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Create a new workout plan."""
    try:
        # Create new workout plan
        db_plan = models.WorkoutPlan(
            name=plan.name,
            description=plan.description,
            user_id=current_user.id
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        
        # Add templates if provided
        if plan.template_ids:
            for template_id in plan.template_ids:
                template = db.query(models.WorkoutTemplate).filter(models.WorkoutTemplate.id == template_id).first()
                if template:
                    db_plan.templates.append(template)
            
            db.commit()
            db.refresh(db_plan)
        
        return db_plan
    except Exception as e:
        logger.error(f"Error creating workout plan: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating workout plan: {str(e)}")

@router.get("/", response_model=List[schemas.WorkoutPlan])
def read_workout_plans(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get all workout plans for the current user."""
    plans = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return plans

@router.get("/{plan_id}", response_model=schemas.WorkoutPlan)
def read_workout_plan(
    plan_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Get a specific workout plan by ID."""
    plan = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.id == plan_id,
        models.WorkoutPlan.user_id == current_user.id
    ).first()
    
    if not plan:
        raise HTTPException(status_code=404, detail="Workout plan not found")
    
    return plan

@router.put("/{plan_id}", response_model=schemas.WorkoutPlan)
def update_workout_plan(
    plan_id: int, 
    plan_update: schemas.WorkoutPlanUpdate, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Update a workout plan."""
    db_plan = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.id == plan_id,
        models.WorkoutPlan.user_id == current_user.id
    ).first()
    
    if not db_plan:
        raise HTTPException(status_code=404, detail="Workout plan not found")
    
    # Update basic fields
    update_data = plan_update.model_dump(exclude_unset=True)
    if "template_ids" in update_data:
        template_ids = update_data.pop("template_ids")
        
        # Clear existing templates
        db_plan.templates = []
        
        # Add new templates
        if template_ids:
            for template_id in template_ids:
                template = db.query(models.WorkoutTemplate).filter(models.WorkoutTemplate.id == template_id).first()
                if template:
                    db_plan.templates.append(template)
    
    # Update remaining fields
    for key, value in update_data.items():
        setattr(db_plan, key, value)
    
    db.commit()
    db.refresh(db_plan)
    return db_plan

@router.delete("/{plan_id}")
def delete_workout_plan(
    plan_id: int, 
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_active_user)
):
    """Delete a workout plan."""
    db_plan = db.query(models.WorkoutPlan).filter(
        models.WorkoutPlan.id == plan_id,
        models.WorkoutPlan.user_id == current_user.id
    ).first()
    
    if not db_plan:
        raise HTTPException(status_code=404, detail="Workout plan not found")
    
    db.delete(db_plan)
    db.commit()
    
    return {"detail": "Workout plan deleted successfully"}