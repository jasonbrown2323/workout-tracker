from typing import List

class BarbellExerciseDetector:
    """Utility class to detect if an exercise is a barbell exercise."""
    
    # List of common barbell exercise names and keywords
    BARBELL_EXERCISES = [
        "barbell",
        "bench press",
        "squat",
        "deadlift",
        "overhead press", 
        "ohp",
        "row",
        "powerclean",
        "clean and jerk",
        "snatch",
        "front squat",
        "sumo deadlift",
        "romanian deadlift",
        "good morning",
        "push press",
        "military press"
    ]
    
    @staticmethod
    def is_barbell_exercise(exercise_name: str) -> bool:
        """
        Determines if an exercise is a barbell exercise based on its name.
        
        Args:
            exercise_name: The name of the exercise to check
            
        Returns:
            True if the exercise is likely a barbell exercise, False otherwise
        """
        exercise_lower = exercise_name.lower()
        
        # Check if any of the barbell exercise keywords are in the exercise name
        for keyword in BarbellExerciseDetector.BARBELL_EXERCISES:
            if keyword in exercise_lower:
                return True
        
        return False
    
    @staticmethod
    def get_barbell_exercises() -> List[str]:
        """
        Returns a list of common barbell exercises.
        
        Returns:
            List of common barbell exercise names and keywords
        """
        return BarbellExerciseDetector.BARBELL_EXERCISES.copy()