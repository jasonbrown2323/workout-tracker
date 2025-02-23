import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from .. import models, schemas
from ..utils.plate_calculator import PlateCalculator

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/", response_model=schemas.WorkoutSession)
def create_workout(workout: schemas.WorkoutSessionCreate, db: Session = Depends(get_db)):
    try:
        # Log incoming request
        logger.info(f"Attempting to create workout with data: {workout.model_dump()}")
        
        # Verify user exists with detailed logging
        user = db.query(models.User).filter(models.User.id == workout.user_id).first()
        logger.info(f"User query result for id {workout.user_id}: {user}")
        
        if not user:
            logger.error(f"User not found: {workout.user_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"User with id {workout.user_id} not found"
            )

        db_workout = models.WorkoutSession(**workout.model_dump())
        db.add(db_workout)
        db.commit()
        db.refresh(db_workout)
        logger.info(f"Successfully created workout {db_workout.id}")
        return db_workout
    except Exception as e:
        logger.error(f"Error creating workout: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating workout: {str(e)}"
        )

@router.get("/", response_model=List[schemas.WorkoutSession])
def read_workouts(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    workouts = db.query(models.WorkoutSession).offset(skip).limit(limit).all()
    return workouts

@router.get("/{workout_id}", response_model=schemas.WorkoutSession)
def read_workout(workout_id: int, db: Session = Depends(get_db)):
    workout = db.query(models.WorkoutSession).filter(models.WorkoutSession.id == workout_id).first()
    if workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    return workout

@router.put("/{workout_id}", response_model=schemas.WorkoutSession)
def update_workout(
    workout_id: int,
    workout: schemas.WorkoutSessionUpdate,
    db: Session = Depends(get_db)
):
    db_workout = db.query(models.WorkoutSession).filter(models.WorkoutSession.id == workout_id).first()
    if db_workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    for key, value in workout.model_dump(exclude_unset=True).items():
        setattr(db_workout, key, value)
    
    db.commit()
    db.refresh(db_workout)
    return db_workout

@router.delete("/{workout_id}")
def delete_workout(workout_id: int, db: Session = Depends(get_db)):
    db_workout = db.query(models.WorkoutSession).filter(models.WorkoutSession.id == workout_id).first()
    if db_workout is None:
        raise HTTPException(status_code=404, detail="Workout not found")
    
    db.delete(db_workout)
    db.commit()
    return {"detail": "Workout deleted"}

@router.get("/search/", response_model=List[schemas.WorkoutSession])
def search_workouts(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    exercise_name: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.WorkoutSession)
    
    if start_date:
        query = query.filter(models.WorkoutSession.date >= start_date)
    if end_date:
        query = query.filter(models.WorkoutSession.date <= end_date)
    if exercise_name:
        query = query.join(models.WorkoutEntry).filter(
            models.WorkoutEntry.exercise_name.ilike(f"%{exercise_name}%")
        )
    
    return query.all()

@router.get("/stats/exercise/{exercise_name}")
def get_exercise_stats(
    exercise_name: str,
    days: int = Query(30, gt=0, le=365),
    db: Session = Depends(get_db)
):
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    stats = db.query(
        func.avg(models.WorkoutEntry.weight).label('avg_weight'),
        func.max(models.WorkoutEntry.weight).label('max_weight'),
        func.avg(models.WorkoutEntry.reps).label('avg_reps'),
        func.count(models.WorkoutEntry.id).label('total_sets')
    ).filter(
        and_(
            models.WorkoutEntry.exercise_name.ilike(f"%{exercise_name}%"),
            models.WorkoutSession.date >= cutoff_date
        )
    ).join(models.WorkoutSession).first()
    
    return {
        "exercise": exercise_name,
        "period_days": days,
        "average_weight": float(stats.avg_weight) if stats.avg_weight else 0,
        "max_weight": float(stats.max_weight) if stats.max_weight else 0,
        "average_reps": float(stats.avg_reps) if stats.avg_reps else 0,
        "total_sets": stats.total_sets
    }

@router.get("/stats/category/{category}")
def get_category_stats(
    category: str,
    days: int = Query(30, gt=0, le=365),
    db: Session = Depends(get_db)
):
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    stats = db.query(
        models.WorkoutEntry.exercise_name,
        func.max(models.WorkoutEntry.weight).label('personal_record'),
        func.sum(
            models.WorkoutEntry.sets * 
            models.WorkoutEntry.reps * 
            models.WorkoutEntry.weight
        ).label('total_volume')
    ).filter(
        and_(
            models.WorkoutEntry.category == category,
            models.WorkoutSession.date >= cutoff_date
        )
    ).join(models.WorkoutSession).group_by(
        models.WorkoutEntry.exercise_name
    ).all()
    
    return {
        "category": category,
        "period_days": days,
        "exercises": [
            {
                "name": name,
                "personal_record": float(pr) if pr else 0,
                "total_volume": float(volume) if volume else 0
            }
            for name, pr, volume in stats
        ]
    }

@router.get("/users/{user_id}/personal-records")  # Changed from "/personal-records"
def get_personal_records(
    user_id: int,
    db: Session = Depends(get_db)
):
    records = db.query(
        models.WorkoutEntry.exercise_name,
        models.WorkoutEntry.category,
        func.max(models.WorkoutEntry.weight).label('max_weight'),
        func.max(models.WorkoutEntry.reps).label('max_reps')
    ).join(
        models.WorkoutSession
    ).filter(
        models.WorkoutSession.user_id == user_id
    ).group_by(
        models.WorkoutEntry.exercise_name,
        models.WorkoutEntry.category
    ).all()
    
    return {
        "user_id": user_id,
        "records": [
            {
                "exercise": name,
                "category": category,
                "max_weight": float(weight) if weight else 0,
                "max_reps": reps
            }
            for name, category, weight, reps in records
        ]
    }

@router.get("/calculate-plates/{weight}")
def calculate_plates(weight: float):
    return PlateCalculator.calculate_plates(weight)
