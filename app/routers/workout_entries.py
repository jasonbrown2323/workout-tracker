from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from .. import models, schemas
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/{session_id}/entries", response_model=schemas.WorkoutEntry)
def create_workout_entry(
    session_id: int,
    entry: schemas.WorkoutEntryCreate,
    db: Session = Depends(get_db)
):
    try:
        session = db.query(models.WorkoutSession).filter(
            models.WorkoutSession.id == session_id
        ).first()
        
        if not session:
            # Change this to return 404 immediately
            raise HTTPException(
                status_code=404,
                detail="Workout session not found"
            )
        
        db_entry = models.WorkoutEntry(**entry.model_dump(), session_id=session_id)
        db.add(db_entry)
        db.commit()
        db.refresh(db_entry)
        return db_entry
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Log other exceptions and return 500
        logger.error(f"Error creating entry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}/entries", response_model=List[schemas.WorkoutEntry])
def read_workout_entries(session_id: int, db: Session = Depends(get_db)):
    entries = db.query(models.WorkoutEntry).filter(models.WorkoutEntry.session_id == session_id).all()
    return entries

@router.put("/{session_id}/entries/{entry_id}", response_model=schemas.WorkoutEntry)
def update_workout_entry(
    session_id: int,
    entry_id: int,
    entry: schemas.WorkoutEntryUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_entry = db.query(models.WorkoutEntry).filter(
            models.WorkoutEntry.session_id == session_id,
            models.WorkoutEntry.id == entry_id
        ).first()
        
        if db_entry is None:
            raise HTTPException(status_code=404, detail=f"Entry not found: session_id={session_id}, entry_id={entry_id}")
        
        update_data = entry.model_dump(exclude_unset=True)
        logger.info(f"Updating entry {entry_id} with data: {update_data}")
        
        for key, value in update_data.items():
            setattr(db_entry, key, value)
        
        db.commit()
        db.refresh(db_entry)
        return db_entry
    except Exception as e:
        logger.error(f"Error updating entry: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{session_id}/entries/{entry_id}")
def delete_workout_entry(
    session_id: int,
    entry_id: int,
    db: Session = Depends(get_db)
):
    db_entry = db.query(models.WorkoutEntry).filter(
        models.WorkoutEntry.session_id == session_id,
        models.WorkoutEntry.id == entry_id
    ).first()
    
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(db_entry)
    db.commit()
    return {"detail": "Entry deleted"}
