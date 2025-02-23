import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app import models

def check_db():
    db = SessionLocal()
    try:
        # Check users
        users = db.query(models.User).all()
        print(f"Users in database: {len(users)}")
        for user in users:
            print(f"User {user.id}: {user.email}")

        # Check workout sessions
        sessions = db.query(models.WorkoutSession).all()
        print(f"\nWorkout sessions: {len(sessions)}")
        for session in sessions:
            print(f"Session {session.id}: user_id={session.user_id}")

        # Check workout entries
        entries = db.query(models.WorkoutEntry).all()
        print(f"\nWorkout entries: {len(entries)}")
        for entry in entries:
            print(f"Entry {entry.id}: session_id={entry.session_id}")

    finally:
        db.close()

if __name__ == "__main__":
    check_db()
