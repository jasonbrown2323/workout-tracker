import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { 
  createWorkoutProgram, 
  importProgramFromCSV,
  getWorkoutTemplates,
  getWorkoutProgram,
  updateWorkoutProgram,
  getAllExercises
} from '../services/workout.service';
import { 
  WorkoutProgramCreate as ProgramCreateType, 
  ProgramWorkoutCreate, 
  ProgramExerciseCreate,
  WorkoutTemplate
} from '../types';

const initialProgram: ProgramCreateType = {
  name: '',
  description: '',
  duration_weeks: 4,
  is_public: false,
  workouts: []
};

const initialWorkout: ProgramWorkoutCreate = {
  name: '',
  week_number: 1,
  day_number: 1,
  order: 1,
  exercises: []
};

const initialExercise: ProgramExerciseCreate = {
  exercise_name: '',
  sets: 3,
  initial_reps: 8,
  target_reps: 12,
  initial_weight: 0,
  progression_strategy: 'weight',
  progression_value: 5,
  progression_frequency: 1,
  order: 1,
  category: 'Other'
};

const WorkoutProgramCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [program, setProgram] = useState<ProgramCreateType>(initialProgram);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState<number | null>(null);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);

  // Fetch program if editing
  const { data: existingProgram, isLoading: isProgramLoading } = useQuery(
    ['workout-program', id],
    () => getWorkoutProgram(Number(id)),
    {
      enabled: !!id,
      onSuccess: (data) => {
        setProgram({
          name: data.name,
          description: data.description || '',
          duration_weeks: data.duration_weeks,
          is_public: data.is_public,
          workouts: data.workouts.map(w => ({
            name: w.name,
            week_number: w.week_number,
            day_number: w.day_number,
            order: w.order,
            template_id: w.template_id,
            exercises: w.exercises.map(e => ({
              exercise_name: e.exercise_name,
              sets: e.sets,
              initial_reps: e.initial_reps,
              target_reps: e.target_reps,
              initial_weight: e.initial_weight,
              progression_strategy: e.progression_strategy,
              progression_value: e.progression_value,
              progression_frequency: e.progression_frequency,
              order: e.order,
              notes: e.notes,
              category: e.category,
              is_barbell_exercise: e.is_barbell_exercise
            }))
          }))
        });
      }
    }
  );
  
  // Fetch templates for template selection
  const { data: templates } = useQuery<WorkoutTemplate[]>(
    'workout-templates',
    getWorkoutTemplates
  );
  
  // Fetch exercise options
  const { data: exercises } = useQuery<string[]>(
    'exercises',
    getAllExercises
  );
  
  // Set exercise options and filtered list
  useEffect(() => {
    if (exercises && exercises.length > 0) {
      setExerciseOptions(exercises);
      setFilteredExercises(exercises);
    }
  }, [exercises]);

  const createMutation = useMutation(
    (programData: ProgramCreateType) => createWorkoutProgram(programData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('workout-programs');
        navigate(`/programs/${data.id}`);
      },
      onError: (error: any) => {
        alert(`Error creating program: ${error.message}`);
      }
    }
  );
  
  const updateMutation = useMutation(
    (programData: ProgramCreateType) => updateWorkoutProgram(Number(id), programData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['workout-program', id]);
        queryClient.invalidateQueries('workout-programs');
        navigate(`/programs/${data.id}`);
      },
      onError: (error: any) => {
        alert(`Error updating program: ${error.message}`);
      }
    }
  );

  const importMutation = useMutation(
    (file: File) => importProgramFromCSV(file),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('workout-programs');
        navigate(`/programs/${data.id}`);
      },
      onError: (error: any) => {
        alert(`Error importing program: ${error.message}`);
        setImportLoading(false);
      }
    }
  );

  const handleProgramChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    
    setProgram({
      ...program,
      [name]: newValue
    });
  };

  const handleAddWorkout = () => {
    const newWorkouts = [...(program.workouts || [])];
    
    // Find the highest day number in the selected week
    const weekWorkouts = newWorkouts.filter(w => w.week_number === initialWorkout.week_number);
    const highestDayNumber = weekWorkouts.length > 0 
      ? Math.max(...weekWorkouts.map(w => w.day_number)) 
      : 0;
    
    const newWorkout = {
      ...initialWorkout,
      day_number: highestDayNumber + 1,
      order: newWorkouts.length + 1
    };
    
    newWorkouts.push(newWorkout);
    setProgram({ ...program, workouts: newWorkouts });
    setSelectedWorkoutIndex(newWorkouts.length - 1);
    setSelectedExerciseIndex(null);
  };

  const handleWorkoutChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (selectedWorkoutIndex === null || !program.workouts) return;
    
    const { name, value } = e.target;
    const updatedWorkouts = [...program.workouts];
    updatedWorkouts[selectedWorkoutIndex] = {
      ...updatedWorkouts[selectedWorkoutIndex],
      [name]: name === 'week_number' || name === 'day_number' || name === 'order' || name === 'template_id'
        ? Number(value)
        : value
    };
    
    setProgram({ ...program, workouts: updatedWorkouts });
  };

  const handleAddExercise = () => {
    if (selectedWorkoutIndex === null || !program.workouts) return;
    
    const updatedWorkouts = [...program.workouts];
    const workout = updatedWorkouts[selectedWorkoutIndex];
    const exercises = [...(workout.exercises || [])];
    
    const newExercise = {
      ...initialExercise,
      order: exercises.length + 1
    };
    
    exercises.push(newExercise);
    updatedWorkouts[selectedWorkoutIndex] = { ...workout, exercises };
    
    setProgram({ ...program, workouts: updatedWorkouts });
    setSelectedExerciseIndex(exercises.length - 1);
  };

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (
      selectedWorkoutIndex === null || 
      selectedExerciseIndex === null || 
      !program.workouts ||
      !program.workouts[selectedWorkoutIndex].exercises
    ) return;
    
    const { name, value, type } = e.target;
    const updatedWorkouts = [...program.workouts];
    const workout = updatedWorkouts[selectedWorkoutIndex];
    const exercises = [...(workout.exercises || [])];
    
    let newValue: any = value;
    if (
      name === 'sets' || 
      name === 'initial_reps' || 
      name === 'target_reps' || 
      name === 'order' ||
      name === 'progression_frequency'
    ) {
      newValue = Number(value);
    } else if (name === 'initial_weight' || name === 'progression_value') {
      newValue = parseFloat(value);
    } else if (name === 'is_barbell_exercise') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    exercises[selectedExerciseIndex] = {
      ...exercises[selectedExerciseIndex],
      [name]: newValue
    };
    
    updatedWorkouts[selectedWorkoutIndex] = { ...workout, exercises };
    setProgram({ ...program, workouts: updatedWorkouts });
  };
  
  const handleExerciseSearch = (searchText: string) => {
    if (!exerciseOptions) return;
    
    if (!searchText) {
      setFilteredExercises(exerciseOptions);
      return;
    }
    
    const filtered = exerciseOptions.filter(
      exercise => exercise.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredExercises(filtered);
  };
  
  const handleExerciseSelect = (exerciseName: string) => {
    if (
      selectedWorkoutIndex === null || 
      selectedExerciseIndex === null || 
      !program.workouts ||
      !program.workouts[selectedWorkoutIndex].exercises
    ) return;
    
    const updatedWorkouts = [...program.workouts];
    const workout = updatedWorkouts[selectedWorkoutIndex];
    const exercises = [...(workout.exercises || [])];
    
    // Hardcoded categories and barbell status for common exercises
    let category = 'Other';
    let isBarbell = false;
    
    if (exerciseName.includes('Bench Press') || exerciseName.includes('Push Up')) {
      category = 'Chest';
      isBarbell = exerciseName.includes('Bench Press');
    } else if (exerciseName.includes('Squat') || exerciseName.includes('Leg Press') || exerciseName.includes('Lunge')) {
      category = 'Legs';
      isBarbell = exerciseName.includes('Squat') && !exerciseName.includes('Smith');
    } else if (exerciseName.includes('Deadlift') || exerciseName.includes('Row') || exerciseName.includes('Pull Up')) {
      category = 'Back';
      isBarbell = exerciseName.includes('Deadlift') || exerciseName.includes('Barbell Row');
    } else if (exerciseName.includes('Shoulder Press') || exerciseName.includes('Lateral Raise')) {
      category = 'Shoulders';
      isBarbell = exerciseName.includes('Overhead Press') || exerciseName.includes('Military Press');
    } else if (exerciseName.includes('Curl') || exerciseName.includes('Tricep')) {
      category = 'Arms';
      isBarbell = exerciseName.includes('Barbell Curl');
    } else if (exerciseName.includes('Crunch') || exerciseName.includes('Plank')) {
      category = 'Core';
    }
    
    exercises[selectedExerciseIndex] = {
      ...exercises[selectedExerciseIndex],
      exercise_name: exerciseName,
      category,
      is_barbell_exercise: isBarbell
    };
    
    updatedWorkouts[selectedWorkoutIndex] = { ...workout, exercises };
    setProgram({ ...program, workouts: updatedWorkouts });
    
    // Clear the filtered exercises after selection
    setFilteredExercises([]);
  };

  const handleDeleteWorkout = (index: number) => {
    if (!program.workouts) return;
    
    const updatedWorkouts = [...program.workouts];
    updatedWorkouts.splice(index, 1);
    
    // Update order for remaining workouts
    const reorderedWorkouts = updatedWorkouts.map((workout, idx) => ({
      ...workout,
      order: idx + 1
    }));
    
    setProgram({ ...program, workouts: reorderedWorkouts });
    setSelectedWorkoutIndex(null);
    setSelectedExerciseIndex(null);
  };

  const handleDeleteExercise = (workoutIndex: number, exerciseIndex: number) => {
    if (!program.workouts || !program.workouts[workoutIndex].exercises) return;
    
    const updatedWorkouts = [...program.workouts];
    const workout = updatedWorkouts[workoutIndex];
    const exercises = [...(workout.exercises || [])];
    exercises.splice(exerciseIndex, 1);
    
    // Update order for remaining exercises
    const reorderedExercises = exercises.map((exercise, idx) => ({
      ...exercise,
      order: idx + 1
    }));
    
    updatedWorkouts[workoutIndex] = { ...workout, exercises: reorderedExercises };
    setProgram({ ...program, workouts: updatedWorkouts });
    setSelectedExerciseIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!program.name) {
      alert('Please enter a program name');
      return;
    }
    
    if (!program.workouts || program.workouts.length === 0) {
      alert('Please add at least one workout to your program');
      return;
    }
    
    if (id) {
      updateMutation.mutate(program);
    } else {
      createMutation.mutate(program);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to import');
      return;
    }
    
    setImportLoading(true);
    importMutation.mutate(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTemplateSelect = (templateId: number) => {
    if (selectedWorkoutIndex === null || !program.workouts) return;
    if (!templates) return;
    
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const updatedWorkouts = [...program.workouts];
    updatedWorkouts[selectedWorkoutIndex] = {
      ...updatedWorkouts[selectedWorkoutIndex],
      template_id: templateId,
      name: template.name
    };
    
    setProgram({ ...program, workouts: updatedWorkouts });
  };

  // Show loading state when fetching program for editing
  if (id && isProgramLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading workout program...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {id ? 'Edit Workout Program' : 'Create Workout Program'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Program Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Program Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={program.name}
                  onChange={handleProgramChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="description" className="block text-gray-700 font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={program.description || ''}
                  onChange={handleProgramChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="duration_weeks" className="block text-gray-700 font-medium mb-2">
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    id="duration_weeks"
                    name="duration_weeks"
                    min="1"
                    max="52"
                    value={program.duration_weeks}
                    onChange={handleProgramChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_public"
                    name="is_public"
                    checked={program.is_public}
                    onChange={handleProgramChange}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_public" className="ml-2 block text-gray-700">
                    Make this program public
                  </label>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Workouts</h3>
                  <button
                    type="button"
                    onClick={handleAddWorkout}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Workout
                  </button>
                </div>
                
                {program.workouts && program.workouts.length > 0 ? (
                  <div className="space-y-2">
                    {program.workouts.map((workout, index) => (
                      <div
                        key={index}
                        className={`border ${
                          selectedWorkoutIndex === index
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        } rounded-md p-3 cursor-pointer flex justify-between items-center`}
                        onClick={() => {
                          setSelectedWorkoutIndex(index);
                          setSelectedExerciseIndex(null);
                        }}
                      >
                        <div>
                          <span className="font-medium">
                            {workout.name || `Workout ${index + 1}`}
                          </span>
                          <span className="text-gray-500 ml-2">
                            (Week {workout.week_number}, Day {workout.day_number})
                          </span>
                          {workout.exercises && (
                            <span className="text-xs text-gray-500 ml-2">
                              {workout.exercises.length} exercises
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteWorkout(index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center p-4 border border-dashed border-gray-300 rounded-md">
                    No workouts added yet. Click "Add Workout" to get started.
                  </div>
                )}
              </div>
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading 
                    ? (id ? 'Updating...' : 'Creating...') 
                    : (id ? 'Update Program' : 'Create Program')}
                </button>
              </div>
            </form>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Import from CSV</h2>
            <form onSubmit={handleImport}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={importLoading || !file}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  {importLoading ? 'Importing...' : 'Import Program'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-1">
          {selectedWorkoutIndex !== null && program.workouts && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Edit Workout</h2>
              <div className="mb-4">
                <label htmlFor="workout-name" className="block text-gray-700 font-medium mb-2">
                  Workout Name
                </label>
                <input
                  type="text"
                  id="workout-name"
                  name="name"
                  value={program.workouts[selectedWorkoutIndex].name || ''}
                  onChange={handleWorkoutChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="week_number" className="block text-gray-700 font-medium mb-2">
                    Week
                  </label>
                  <input
                    type="number"
                    id="week_number"
                    name="week_number"
                    min="1"
                    max={program.duration_weeks}
                    value={program.workouts[selectedWorkoutIndex].week_number}
                    onChange={handleWorkoutChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="day_number" className="block text-gray-700 font-medium mb-2">
                    Day
                  </label>
                  <input
                    type="number"
                    id="day_number"
                    name="day_number"
                    min="1"
                    max="7"
                    value={program.workouts[selectedWorkoutIndex].day_number}
                    onChange={handleWorkoutChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              {templates && templates.length > 0 && (
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">
                    Use Template (Optional)
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={program.workouts[selectedWorkoutIndex].template_id || ''}
                    onChange={(e) => handleTemplateSelect(Number(e.target.value))}
                  >
                    <option value="">Select a template...</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">Exercises</h3>
                  <button
                    type="button"
                    onClick={handleAddExercise}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    + Add Exercise
                  </button>
                </div>
                
                {program.workouts[selectedWorkoutIndex].exercises &&
                program.workouts[selectedWorkoutIndex].exercises!.length > 0 ? (
                  <div className="space-y-2">
                    {program.workouts[selectedWorkoutIndex].exercises!.map((exercise, index) => (
                      <div
                        key={index}
                        className={`border ${
                          selectedExerciseIndex === index
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        } rounded-md p-3 cursor-pointer flex justify-between items-center`}
                        onClick={() => setSelectedExerciseIndex(index)}
                      >
                        <div>
                          <span className="font-medium">
                            {exercise.exercise_name || `Exercise ${index + 1}`}
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            {exercise.sets} sets, {exercise.initial_reps}-{exercise.target_reps} reps
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(selectedWorkoutIndex, index);
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500 italic text-center p-4 border border-dashed border-gray-300 rounded-md">
                    No exercises added yet. Click "Add Exercise" to get started.
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedExerciseIndex !== null &&
            selectedWorkoutIndex !== null &&
            program.workouts &&
            program.workouts[selectedWorkoutIndex].exercises && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Edit Exercise</h2>
                <div className="mb-4">
                  <label htmlFor="exercise_name" className="block text-gray-700 font-medium mb-2">
                    Exercise Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="exercise_name"
                      name="exercise_name"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .exercise_name
                      }
                      onChange={(e) => {
                        handleExerciseChange(e);
                        handleExerciseSearch(e.target.value);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      autoComplete="off"
                    />
                    {filteredExercises.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md max-h-60 overflow-y-auto">
                        {filteredExercises.map((exercise, idx) => (
                          <div
                            key={idx}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleExerciseSelect(exercise)}
                          >
                            {exercise}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="category" className="block text-gray-700 font-medium mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={
                      program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                        .category || ''
                    }
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">Select category...</option>
                    <option value="Chest">Chest</option>
                    <option value="Back">Back</option>
                    <option value="Legs">Legs</option>
                    <option value="Shoulders">Shoulders</option>
                    <option value="Arms">Arms</option>
                    <option value="Core">Core</option>
                    <option value="Cardio">Cardio</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="sets" className="block text-gray-700 font-medium mb-2">
                      Sets
                    </label>
                    <input
                      type="number"
                      id="sets"
                      name="sets"
                      min="1"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex].sets
                      }
                      onChange={handleExerciseChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="initial_weight" className="block text-gray-700 font-medium mb-2">
                      Starting Weight (lbs)
                    </label>
                    <input
                      type="number"
                      id="initial_weight"
                      name="initial_weight"
                      min="0"
                      step="2.5"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .initial_weight
                      }
                      onChange={handleExerciseChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="initial_reps" className="block text-gray-700 font-medium mb-2">
                      Starting Reps
                    </label>
                    <input
                      type="number"
                      id="initial_reps"
                      name="initial_reps"
                      min="1"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .initial_reps
                      }
                      onChange={handleExerciseChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="target_reps" className="block text-gray-700 font-medium mb-2">
                      Target Reps
                    </label>
                    <input
                      type="number"
                      id="target_reps"
                      name="target_reps"
                      min="1"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .target_reps
                      }
                      onChange={handleExerciseChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label
                    htmlFor="progression_strategy"
                    className="block text-gray-700 font-medium mb-2"
                  >
                    Progression Strategy
                  </label>
                  <select
                    id="progression_strategy"
                    name="progression_strategy"
                    value={
                      program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                        .progression_strategy
                    }
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="weight">Increase Weight</option>
                    <option value="reps">Increase Reps</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label
                      htmlFor="progression_value"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Progression Value
                    </label>
                    <input
                      type="number"
                      id="progression_value"
                      name="progression_value"
                      min="0"
                      step="2.5"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .progression_value
                      }
                      onChange={handleExerciseChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor="progression_frequency"
                      className="block text-gray-700 font-medium mb-2"
                    >
                      Every X Sessions
                    </label>
                    <input
                      type="number"
                      id="progression_frequency"
                      name="progression_frequency"
                      min="1"
                      value={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .progression_frequency
                      }
                      onChange={handleExerciseChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_barbell_exercise"
                      name="is_barbell_exercise"
                      checked={
                        program.workouts[selectedWorkoutIndex].exercises![selectedExerciseIndex]
                          .is_barbell_exercise || false
                      }
                      onChange={handleExerciseChange}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_barbell_exercise" className="ml-2 block text-gray-700">
                      This is a barbell exercise
                    </label>
                  </div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutProgramCreate;