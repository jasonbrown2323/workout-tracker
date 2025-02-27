import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import * as workoutService from '../services/workout.service';
import { WorkoutEntry, WorkoutEntryUpdate } from '../types';

interface RouteParams {
  id: string;
  [key: string]: string;
}

const WorkoutDetail: React.FC = () => {
  const { id } = useParams<RouteParams>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workoutId = parseInt(id || '0');
  
  const [editMode, setEditMode] = useState(false);
  const [notes, setNotes] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<WorkoutEntryUpdate>({});

  // Fetch workout details
  const { data: workout, isLoading, error } = useQuery(
    ['workout', workoutId],
    () => workoutService.getWorkout(workoutId),
    {
      enabled: !!workoutId && !!user,
      onSuccess: (data) => {
        setNotes(data.notes || '');
      },
    }
  );

  // Update workout mutation
  const updateWorkoutMutation = useMutation(
    (notes: string) => workoutService.updateWorkout(workoutId, { notes }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workout', workoutId]);
        setEditMode(false);
      },
    }
  );

  // Update workout entry mutation
  const updateEntryMutation = useMutation(
    ({ entryId, data }: { entryId: number; data: WorkoutEntryUpdate }) =>
      workoutService.updateWorkoutEntry(workoutId, entryId, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workout', workoutId]);
        setEditingEntryId(null);
        setEditFormData({});
      },
    }
  );

  // Delete workout entry mutation
  const deleteEntryMutation = useMutation(
    (entryId: number) => workoutService.deleteWorkoutEntry(workoutId, entryId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['workout', workoutId]);
      },
    }
  );

  // Delete workout mutation
  const deleteWorkoutMutation = useMutation(
    () => workoutService.deleteWorkout(workoutId),
    {
      onSuccess: () => {
        navigate('/workouts');
      },
    }
  );

  const handleSaveNotes = () => {
    updateWorkoutMutation.mutate(notes);
  };

  const handleEditEntry = (entry: WorkoutEntry) => {
    setEditingEntryId(entry.id);
    setEditFormData({
      exercise_name: entry.exercise_name,
      sets: entry.sets,
      reps: entry.reps,
      weight: entry.weight,
      notes: entry.notes,
      category: entry.category,
      difficulty: entry.difficulty,
    });
  };

  const handleUpdateEntry = () => {
    if (editingEntryId !== null) {
      updateEntryMutation.mutate({
        entryId: editingEntryId,
        data: editFormData,
      });
    }
  };

  const handleDeleteEntry = (entryId: number) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      deleteEntryMutation.mutate(entryId);
    }
  };

  const handleDeleteWorkout = () => {
    if (window.confirm('Are you sure you want to delete this entire workout?')) {
      deleteWorkoutMutation.mutate();
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    // Handle numeric fields
    if (name === 'sets' || name === 'reps' || name === 'difficulty') {
      setEditFormData({
        ...editFormData,
        [name]: parseInt(value),
      });
    } else if (name === 'weight') {
      setEditFormData({
        ...editFormData,
        [name]: parseFloat(value),
      });
    } else {
      setEditFormData({
        ...editFormData,
        [name]: value,
      });
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          You need to be logged in to view workout details
        </h2>
        <Link
          to="/login"
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading workout details...</p>
      </div>
    );
  }

  if (error || !workout) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">
          Error loading workout. The workout may have been deleted or doesn't exist.
        </p>
        <Link
          to="/workouts"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          Back to Workouts
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Workout: {format(new Date(workout.date), 'MMMM d, yyyy')}
        </h1>
        <div className="flex space-x-3">
          <Link
            to={`/workouts/${workoutId}/entries/add`}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
          >
            Add Exercise
          </Link>
          <button
            onClick={handleDeleteWorkout}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Delete Workout
          </button>
        </div>
      </div>

      {/* Workout Notes */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Workout Notes</h2>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="text-indigo-600 hover:text-indigo-800"
            >
              Edit Notes
            </button>
          ) : (
            <div className="flex space-x-2">
              <button
                onClick={handleSaveNotes}
                className="text-green-600 hover:text-green-800"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setNotes(workout.notes || '');
                }}
                className="text-red-600 hover:text-red-800"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {!editMode ? (
          <p className="text-gray-700">
            {workout.notes || <span className="text-gray-400">No notes for this workout</span>}
          </p>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            rows={4}
            placeholder="Add notes about this workout..."
          />
        )}
      </div>

      {/* Exercises List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Exercises</h2>
        
        {workout.entries.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              No exercises have been added to this workout yet.
            </p>
            <Link
              to={`/workouts/${workoutId}/entries/add`}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Add Your First Exercise
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {workout.entries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                {editingEntryId === entry.id ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Exercise Name
                        </label>
                        <input
                          type="text"
                          name="exercise_name"
                          value={editFormData.exercise_name || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category
                        </label>
                        <select
                          name="category"
                          value={editFormData.category || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select category</option>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Sets
                        </label>
                        <input
                          type="number"
                          name="sets"
                          value={editFormData.sets || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reps
                        </label>
                        <input
                          type="number"
                          name="reps"
                          value={editFormData.reps || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Weight (lbs)
                        </label>
                        <input
                          type="number"
                          name="weight"
                          step="0.5"
                          value={editFormData.weight || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Difficulty (1-10)
                        </label>
                        <input
                          type="number"
                          name="difficulty"
                          min="1"
                          max="10"
                          value={editFormData.difficulty || ''}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        value={editFormData.notes || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                      />
                    </div>
                    <div className="mt-4 flex justify-end space-x-2">
                      <button
                        onClick={handleUpdateEntry}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingEntryId(null);
                          setEditFormData({});
                        }}
                        className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-medium text-gray-800">
                          {entry.exercise_name}
                          {entry.category && (
                            <span className="ml-2 text-sm text-gray-500">
                              ({entry.category})
                            </span>
                          )}
                        </h3>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-gray-500 text-sm">Sets:</span>{' '}
                            <span className="font-medium">{entry.sets}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">Reps:</span>{' '}
                            <span className="font-medium">{entry.reps}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 text-sm">Weight:</span>{' '}
                            <span className="font-medium">{entry.weight} lbs</span>
                          </div>
                        </div>
                        {entry.difficulty && (
                          <div className="mt-1">
                            <span className="text-gray-500 text-sm">Difficulty:</span>{' '}
                            <span className="font-medium">{entry.difficulty}/10</span>
                          </div>
                        )}
                        {entry.notes && (
                          <div className="mt-2 text-gray-700 text-sm">
                            <p>{entry.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditEntry(entry)}
                          className="text-indigo-600 hover:text-indigo-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutDetail;