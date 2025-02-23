import pytest
from sqlalchemy import text
from app.database import get_db
from sqlalchemy.orm.session import Session

def test_get_db():
    db = next(get_db())
    assert isinstance(db, Session)
    db.close()

def test_db_session_closes():
    db = None
    try:
        db = next(get_db())
        # Simulate an error
        raise ValueError("Test error")
    except ValueError:
        pass
    finally:
        if db:
            # Verify db can still be used (not closed prematurely)
            db.execute(text("SELECT 1"))
