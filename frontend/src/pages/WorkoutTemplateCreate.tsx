import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from 'react-query';
import { 
  createWorkoutTemplate, 
  getWorkoutTemplate, 
  updateWorkoutTemplate, 
  getAllExercises 
} from '../services/workout.service';
import { 
  WorkoutTemplateCreate as TemplateCreateType, 
  TemplateExerciseCreate 
} from '../types';

const initialTemplate: TemplateCreateType = {
  name: '',
  description: '',
  exercises: []
};

const initialExercise: TemplateExerciseCreate = {
  exercise_name: '',
  sets: 3,
  reps: 10,
  weight: 0,
  order: 1,
  category: 'Other'
};

const WorkoutTemplateCreate: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<TemplateCreateType>(initialTemplate);
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const [exerciseOptions, setExerciseOptions] = useState<string[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<string[]>([]);

  // Fetch template if editing
  const { data: existingTemplate, isLoading: isTemplateLoading } = useQuery(
    ['workout-template', id],
    () => getWorkoutTemplate(Number(id)),
    {
      enabled: !!id,
      onSuccess: (data) => {
        setTemplate({
          name: data.name,
          description: data.description || '',
          exercises: data.exercises.map(e => ({
            exercise_name: e.exercise_name,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight,
            order: e.order,
            notes: e.notes,
            category: e.category
          }))
        });
      }
    }
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
      setFilteredExercises([]);
    }
  }, [exercises]);

  const createMutation = useMutation(
    (templateData: TemplateCreateType) => createWorkoutTemplate(templateData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries('workout-templates');
        navigate(`/templates/${data.id}`);
      },
      onError: (error: any) => {
        alert(`Error creating template: ${error.message}`);
      }
    }
  );
  
  const updateMutation = useMutation(
    (templateData: TemplateCreateType) => updateWorkoutTemplate(Number(id), templateData),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['workout-template', id]);
        queryClient.invalidateQueries('workout-templates');
        navigate(`/templates/${data.id}`);
      },
      onError: (error: any) => {
        alert(`Error updating template: ${error.message}`);
      }
    }
  );

  const handleTemplateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTemplate({
      ...template,
      [name]: value
    });
  };

  const handleAddExercise = () => {
    const updatedExercises = [...(template.exercises || [])];
    
    const newExercise = {
      ...initialExercise,
      order: updatedExercises.length + 1
    };
    
    updatedExercises.push(newExercise);
    setTemplate({ ...template, exercises: updatedExercises });
    setSelectedExerciseIndex(updatedExercises.length - 1);
  };

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (selectedExerciseIndex === null || !template.exercises) return;
    
    const { name, value, type } = e.target;
    const updatedExercises = [...template.exercises];
    
    let newValue: any = value;
    if (name === 'sets' || name === 'reps' || name === 'order') {
      newValue = Number(value);
    } else if (name === 'weight') {
      newValue = parseFloat(value);
    }
    
    updatedExercises[selectedExerciseIndex] = {
      ...updatedExercises[selectedExerciseIndex],
      [name]: newValue
    };
    
    setTemplate({ ...template, exercises: updatedExercises });
  };
  
  const handleExerciseSearch = (searchText: string) => {
    if (!exerciseOptions) return;
    
    if (!searchText) {
      setFilteredExercises([]);
      return;
    }
    
    const filtered = exerciseOptions.filter(
      exercise => exercise.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredExercises(filtered);
  };
  
  const handleExerciseSelect = (exerciseName: string) => {
    if (selectedExerciseIndex === null || !template.exercises) return;
    
    const updatedExercises = [...template.exercises];
    
    // Hardcoded categories for common exercises
    let category = 'Other';
    
    if (exerciseName.includes('Bench Press') || exerciseName.includes('Push Up')) {
      category = 'Chest';
    } else if (exerciseName.includes('Squat') || exerciseName.includes('Leg Press') || exerciseName.includes('Lunge')) {
      category = 'Legs';
    } else if (exerciseName.includes('Deadlift') || exerciseName.includes('Row') || exerciseName.includes('Pull Up')) {
      category = 'Back';
    } else if (exerciseName.includes('Shoulder Press') || exerciseName.includes('Lateral Raise')) {
      category = 'Shoulders';
    } else if (exerciseName.includes('Curl') || exerciseName.includes('Tricep')) {
      category = 'Arms';
    } else if (exerciseName.includes('Crunch') || exerciseName.includes('Plank')) {
      category = 'Core';
    }
    
    updatedExercises[selectedExerciseIndex] = {
      ...updatedExercises[selectedExerciseIndex],
      exercise_name: exerciseName,
      category
    };
    
    setTemplate({ ...template, exercises: updatedExercises });
    
    // Clear the filtered exercises after selection
    setFilteredExercises([]);
  };

  const handleDeleteExercise = (exerciseIndex: number) => {
    if (!template.exercises) return;
    
    const updatedExercises = [...template.exercises];
    updatedExercises.splice(exerciseIndex, 1);
    
    // Update order for remaining exercises
    const reorderedExercises = updatedExercises.map((exercise, idx) => ({
      ...exercise,
      order: idx + 1
    }));
    
    setTemplate({ ...template, exercises: reorderedExercises });
    setSelectedExerciseIndex(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!template.name) {
      alert('Please enter a template name');
      return;
    }
    
    if (id) {
      updateMutation.mutate(template);
    } else {
      createMutation.mutate(template);
    }
  };

  // Show loading state when fetching template for editing
  if (id && isTemplateLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading workout template...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {id ? 'Edit Workout Template' : 'Create Workout Template'}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Template Details</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={template.name}
                  onChange={handleTemplateChange}
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
                  value={template.description || ''}
                  onChange={handleTemplateChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
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
                
                {template.exercises && template.exercises.length > 0 ? (
                  <div className="space-y-2">
                    {template.exercises.map((exercise, index) => (
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
                            {exercise.sets} sets × {exercise.reps} reps
                            {exercise.weight ? ` @ ${exercise.weight} lbs` : ''}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteExercise(index);
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
              
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  {createMutation.isLoading || updateMutation.isLoading 
                    ? (id ? 'Updating...' : 'Creating...') 
                    : (id ? 'Update Template' : 'Create Template')}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="md:col-span-1">
          {selectedExerciseIndex !== null && template.exercises && (
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
                      template.exercises[selectedExerciseIndex].exercise_name
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
                    template.exercises[selectedExerciseIndex].category || ''
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
                      template.exercises[selectedExerciseIndex].sets
                    }
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="reps" className="block text-gray-700 font-medium mb-2">
                    Reps
                  </label>
                  <input
                    type="number"
                    id="reps"
                    name="reps"
                    min="1"
                    value={
                      template.exercises[selectedExerciseIndex].reps
                    }
                    onChange={handleExerciseChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="weight" className="block text-gray-700 font-medium mb-2">
                  Weight (lbs) - Optional
                </label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  min="0"
                  step="2.5"
                  value={
                    template.exercises[selectedExerciseIndex].weight || 0
                  }
                  onChange={handleExerciseChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="notes" className="block text-gray-700 font-medium mb-2">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={
                    template.exercises[selectedExerciseIndex].notes || ''
                  }
                  onChange={handleExerciseChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WorkoutTemplateCreate;