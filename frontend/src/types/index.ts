// User related types
export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface UserCreate {
  email: string;
  password: string;
}

// Workout related types
export interface WorkoutEntry {
  id: number;
  session_id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
  category?: string;
  difficulty?: number;
}

export interface WorkoutEntryCreate {
  exercise_name: string;
  sets: number;
  reps: number;
  weight: number;
  notes?: string;
  category?: string;
  difficulty?: number;
}

export interface WorkoutEntryUpdate {
  exercise_name?: string;
  sets?: number;
  reps?: number;
  weight?: number;
  notes?: string;
  category?: string;
  difficulty?: number;
}

export interface WorkoutSession {
  id: number;
  date: string;
  user_id: number;
  notes?: string;
  entries: WorkoutEntry[];
}

export interface WorkoutSessionCreate {
  user_id: number;
  date?: string;
  notes?: string;
}

export interface WorkoutSessionUpdate {
  date?: string;
  notes?: string;
}

// Stats related types
export interface ExerciseStats {
  exercise: string;
  period_days: number;
  average_weight: number;
  max_weight: number;
  average_reps: number;
  total_sets: number;
}

export interface CategoryExercise {
  name: string;
  personal_record: number;
  total_volume: number;
}

export interface CategoryStats {
  category: string;
  period_days: number;
  exercises: CategoryExercise[];
}

export interface PersonalRecord {
  exercise: string;
  category: string;
  max_weight: number;
  max_reps: number;
}

export interface PersonalRecords {
  user_id: number;
  records: PersonalRecord[];
}

export interface PlateCalculation {
  target_weight: number;
  bar_weight: number;
  weight_per_side: number;
  plates_per_side: number[];
  actual_weight: number;
}

// Workout Programs types
export interface ProgramExercise {
  id: number;
  program_workout_id: number;
  exercise_name: string;
  sets: number;
  initial_reps: number;
  target_reps: number;
  initial_weight: number;
  progression_strategy: string;
  progression_value: number;
  progression_frequency: number;
  order: number;
  notes?: string;
  category?: string;
  is_barbell_exercise?: boolean;
}

export interface ProgramExerciseCreate {
  exercise_name: string;
  sets: number;
  initial_reps: number;
  target_reps: number;
  initial_weight: number;
  progression_strategy: string;
  progression_value: number;
  progression_frequency: number;
  order: number;
  notes?: string;
  category?: string;
  is_barbell_exercise?: boolean;
}

export interface ProgramWorkout {
  id: number;
  program_id: number;
  name: string;
  week_number: number;
  day_number: number;
  order: number;
  template_id?: number;
  exercises: ProgramExercise[];
}

export interface ProgramWorkoutCreate {
  name: string;
  week_number: number;
  day_number: number;
  order: number;
  template_id?: number;
  exercises?: ProgramExerciseCreate[];
}

export interface WorkoutProgram {
  id: number;
  name: string;
  description?: string;
  duration_weeks: number;
  is_public: boolean;
  creator_id: number;
  workouts: ProgramWorkout[];
}

export interface WorkoutProgramCreate {
  name: string;
  description?: string;
  duration_weeks: number;
  is_public: boolean;
  workouts?: ProgramWorkoutCreate[];
}

export interface UserProgramProgress {
  id: number;
  user_id: number;
  program_id: number;
  current_week: number;
  current_day: number;
  start_date: string;
  is_active: boolean;
}

export interface ExerciseProgress {
  id: number;
  progress_id: number;
  program_exercise_id: number;
  current_weight: number;
  current_reps: number;
  completed_sets: number[];
}

// Workout Templates types
export interface TemplateExercise {
  id: number;
  template_id: number;
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
  order: number;
  notes?: string;
  category?: string;
}

export interface TemplateExerciseCreate {
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
  order: number;
  notes?: string;
  category?: string;
}

export interface WorkoutTemplate {
  id: number;
  name: string;
  description?: string;
  creator_id: number;
  exercises: TemplateExercise[];
}

export interface WorkoutTemplateCreate {
  name: string;
  description?: string;
  exercises?: TemplateExerciseCreate[];
}

// Workout Plans types
export interface WorkoutPlan {
  id: number;
  name: string;
  description?: string;
  user_id: number;
  duration_weeks: number;
  days_per_week: number;
}

export interface WorkoutPlanCreate {
  name: string;
  description?: string;
  duration_weeks: number;
  days_per_week: number;
}