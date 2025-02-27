import api from './api';
import {
  WorkoutSession,
  WorkoutSessionCreate,
  WorkoutSessionUpdate,
  WorkoutEntry,
  WorkoutEntryCreate,
  WorkoutEntryUpdate,
  ExerciseStats,
  CategoryStats,
  PersonalRecords,
  PlateCalculation,
  WorkoutProgram,
  WorkoutProgramCreate,
  ProgramWorkout,
  ProgramExercise,
  ProgramExerciseCreate,
  UserProgramProgress,
  WorkoutTemplate,
  WorkoutTemplateCreate,
  TemplateExercise,
  TemplateExerciseCreate,
  WorkoutPlan,
  WorkoutPlanCreate
} from '../types';

// Workout Sessions
export const getWorkouts = async (): Promise<WorkoutSession[]> => {
  const response = await api.get('/workouts');
  return response.data;
};

export const getWorkout = async (id: number): Promise<WorkoutSession> => {
  const response = await api.get(`/workouts/${id}`);
  return response.data;
};

export const createWorkout = async (
  workout: WorkoutSessionCreate
): Promise<WorkoutSession> => {
  const response = await api.post('/workouts', workout);
  return response.data;
};

export const updateWorkout = async (
  id: number,
  workout: WorkoutSessionUpdate
): Promise<WorkoutSession> => {
  const response = await api.put(`/workouts/${id}`, workout);
  return response.data;
};

export const deleteWorkout = async (id: number): Promise<void> => {
  await api.delete(`/workouts/${id}`);
};

export const searchWorkouts = async (params: {
  start_date?: string;
  end_date?: string;
  exercise_name?: string;
}): Promise<WorkoutSession[]> => {
  const response = await api.get('/workouts/search', { params });
  return response.data;
};

// Workout Entries
export const getWorkoutEntries = async (
  sessionId: number
): Promise<WorkoutEntry[]> => {
  const response = await api.get(`/workouts/${sessionId}/entries`);
  return response.data;
};

export const createWorkoutEntry = async (
  sessionId: number,
  entry: WorkoutEntryCreate
): Promise<WorkoutEntry> => {
  const response = await api.post(`/workouts/${sessionId}/entries`, entry);
  return response.data;
};

export const updateWorkoutEntry = async (
  sessionId: number,
  entryId: number,
  entry: WorkoutEntryUpdate
): Promise<WorkoutEntry> => {
  const response = await api.put(
    `/workouts/${sessionId}/entries/${entryId}`,
    entry
  );
  return response.data;
};

export const deleteWorkoutEntry = async (
  sessionId: number,
  entryId: number
): Promise<void> => {
  await api.delete(`/workouts/${sessionId}/entries/${entryId}`);
};

// Stats
export const getExerciseStats = async (
  exerciseName: string,
  days: number = 30
): Promise<ExerciseStats> => {
  const response = await api.get(`/workouts/stats/exercise/${exerciseName}`, {
    params: { days },
  });
  return response.data;
};

export const getCategoryStats = async (
  category: string,
  days: number = 30
): Promise<CategoryStats> => {
  const response = await api.get(`/workouts/stats/category/${category}`, {
    params: { days },
  });
  return response.data;
};

export const getPersonalRecords = async (
  userId: number
): Promise<PersonalRecords> => {
  const response = await api.get(`/workouts/users/${userId}/personal-records`);
  return response.data;
};

// Utilities
export const calculatePlates = async (
  weight: number
): Promise<PlateCalculation> => {
  const response = await api.get(`/workouts/calculate-plates/${weight}`);
  return response.data;
};

// Exercises
export const getAllExercises = async (): Promise<string[]> => {
  const response = await api.get('/exercises');
  return response.data;
};

// Workout Programs
export const getWorkoutPrograms = async (publicOnly: boolean = false): Promise<WorkoutProgram[]> => {
  const response = await api.get('/workout-programs', {
    params: { public_only: publicOnly }
  });
  return response.data;
};

export const getWorkoutProgram = async (id: number): Promise<WorkoutProgram> => {
  const response = await api.get(`/workout-programs/${id}`);
  return response.data;
};

export const createWorkoutProgram = async (
  program: WorkoutProgramCreate
): Promise<WorkoutProgram> => {
  const response = await api.post('/workout-programs', program);
  return response.data;
};

export const updateWorkoutProgram = async (
  id: number,
  program: Partial<WorkoutProgramCreate>
): Promise<WorkoutProgram> => {
  const response = await api.put(`/workout-programs/${id}`, program);
  return response.data;
};

export const deleteWorkoutProgram = async (id: number): Promise<void> => {
  await api.delete(`/workout-programs/${id}`);
};

export const addExerciseToProgram = async (
  workoutId: number,
  exercise: ProgramExerciseCreate
): Promise<ProgramExercise> => {
  const response = await api.post(`/workout-programs/workouts/${workoutId}/exercises`, exercise);
  return response.data;
};

export const assignProgramToUser = async (programId: number): Promise<UserProgramProgress> => {
  const response = await api.post(`/workout-programs/${programId}/assign`);
  return response.data;
};

export const getUserProgramProgress = async (): Promise<UserProgramProgress[]> => {
  const response = await api.get('/workout-programs/progress');
  return response.data;
};

export const updateProgramProgress = async (
  progressId: number, 
  data: Partial<UserProgramProgress>
): Promise<UserProgramProgress> => {
  const response = await api.put(`/workout-programs/progress/${progressId}`, data);
  return response.data;
};

export const importProgramFromCSV = async (file: File): Promise<WorkoutProgram> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/workout-programs/import/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

// Workout Templates
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  const response = await api.get('/workout-templates');
  return response.data;
};

export const getWorkoutTemplate = async (id: number): Promise<WorkoutTemplate> => {
  const response = await api.get(`/workout-templates/${id}`);
  return response.data;
};

export const createWorkoutTemplate = async (
  template: WorkoutTemplateCreate
): Promise<WorkoutTemplate> => {
  const response = await api.post('/workout-templates', template);
  return response.data;
};

export const updateWorkoutTemplate = async (
  id: number,
  template: Partial<WorkoutTemplateCreate>
): Promise<WorkoutTemplate> => {
  const response = await api.put(`/workout-templates/${id}`, template);
  return response.data;
};

export const deleteWorkoutTemplate = async (id: number): Promise<void> => {
  await api.delete(`/workout-templates/${id}`);
};

export const addExerciseToTemplate = async (
  templateId: number,
  exercise: TemplateExerciseCreate
): Promise<TemplateExercise> => {
  const response = await api.post(`/workout-templates/${templateId}/exercises`, exercise);
  return response.data;
};

export const updateTemplateExercise = async (
  templateId: number,
  exerciseId: number,
  exercise: Partial<TemplateExerciseCreate>
): Promise<TemplateExercise> => {
  const response = await api.put(`/workout-templates/${templateId}/exercises/${exerciseId}`, exercise);
  return response.data;
};

export const deleteTemplateExercise = async (
  templateId: number,
  exerciseId: number
): Promise<void> => {
  await api.delete(`/workout-templates/${templateId}/exercises/${exerciseId}`);
};

// Workout Plans
export const getWorkoutPlans = async (): Promise<WorkoutPlan[]> => {
  const response = await api.get('/workout-plans');
  return response.data;
};

export const getWorkoutPlan = async (id: number): Promise<WorkoutPlan> => {
  const response = await api.get(`/workout-plans/${id}`);
  return response.data;
};

export const createWorkoutPlan = async (
  plan: WorkoutPlanCreate
): Promise<WorkoutPlan> => {
  const response = await api.post('/workout-plans', plan);
  return response.data;
};

export const updateWorkoutPlan = async (
  id: number,
  plan: Partial<WorkoutPlanCreate>
): Promise<WorkoutPlan> => {
  const response = await api.put(`/workout-plans/${id}`, plan);
  return response.data;
};

export const deleteWorkoutPlan = async (id: number): Promise<void> => {
  await api.delete(`/workout-plans/${id}`);
};