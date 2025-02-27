import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  getWorkoutProgram, 
  assignProgramToUser, 
  deleteWorkoutProgram 
} from '../services/workout.service';
import { useAuth } from '../hooks/useAuth';

const WorkoutProgramDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [selectedWeek, setSelectedWeek] = useState(1);

  const { data: program, isLoading, error } = useQuery(
    ['workout-program', id],
    () => getWorkoutProgram(Number(id))
  );

  const assignMutation = useMutation(
    () => assignProgramToUser(Number(id)),
    {
      onSuccess: () => {
        alert('Program assigned to you successfully!');
        queryClient.invalidateQueries('user-program-progress');
      },
      onError: (error: any) => {
        alert(`Error assigning program: ${error.message}`);
      }
    }
  );

  const deleteMutation = useMutation(
    () => deleteWorkoutProgram(Number(id)),
    {
      onSuccess: () => {
        navigate('/programs');
        queryClient.invalidateQueries('workout-programs');
      },
      onError: (error: any) => {
        alert(`Error deleting program: ${error.message}`);
      }
    }
  );

  const confirmDelete = () => {
    if (window.confirm('Are you sure you want to delete this program?')) {
      deleteMutation.mutate();
    }
  };

  const handleAssign = () => {
    assignMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading workout program...</div>
      </div>
    );
  }

  if (error || !program) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>Error loading workout program. Please try again later.</p>
      </div>
    );
  }

  // Find the workouts for the selected week
  const weekWorkouts = program.workouts.filter(
    (workout) => workout.week_number === selectedWeek
  ).sort((a, b) => a.day_number - b.day_number);

  // Generate week tabs
  const weekTabs = [];
  for (let i = 1; i <= program.duration_weeks; i++) {
    weekTabs.push(
      <button
        key={i}
        className={`px-4 py-2 ${
          selectedWeek === i
            ? 'bg-indigo-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        } rounded-t-lg`}
        onClick={() => setSelectedWeek(i)}
      >
        Week {i}
      </button>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{program.name}</h1>
            <div className="flex items-center mb-2">
              <span className="text-gray-500 mr-2">Creator: </span>
              <span className="font-medium">{program.creator_id === user?.id ? 'You' : `User #${program.creator_id}`}</span>
              {program.is_public && (
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full ml-2">
                  Public
                </span>
              )}
            </div>
            <p className="text-gray-600">{program.description || 'No description provided'}</p>
          </div>
          <div className="flex space-x-2">
            {user && (
              <button
                onClick={handleAssign}
                disabled={assignMutation.isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
              >
                {assignMutation.isLoading ? 'Assigning...' : 'Start Program'}
              </button>
            )}
            {user && program.creator_id === user.id && (
              <>
                <Link
                  to={`/programs/${program.id}/edit`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded"
                >
                  Edit
                </Link>
                <button
                  onClick={confirmDelete}
                  disabled={deleteMutation.isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded disabled:opacity-50"
                >
                  {deleteMutation.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-wrap gap-2 mb-4">{weekTabs}</div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold mb-4">Week {selectedWeek} Workouts</h2>
            {weekWorkouts.length > 0 ? (
              <div className="space-y-4">
                {weekWorkouts.map((workout) => (
                  <div
                    key={workout.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <h3 className="text-lg font-medium text-indigo-600">
                      Day {workout.day_number}: {workout.name}
                    </h3>
                    {workout.exercises && workout.exercises.length > 0 ? (
                      <div className="mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Exercises:</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Exercise
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Sets
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Reps
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Weight
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Progression
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {workout.exercises.map((exercise) => (
                                <tr key={exercise.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="font-medium text-gray-900">
                                      {exercise.exercise_name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {exercise.category || 'Uncategorized'}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {exercise.sets}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {exercise.initial_reps} → {exercise.target_reps}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    {exercise.initial_weight} lbs
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm">
                                      {exercise.progression_strategy === 'weight'
                                        ? `+${exercise.progression_value} lbs per ${exercise.progression_frequency} session(s)`
                                        : `+${exercise.progression_value} reps per ${exercise.progression_frequency} session(s)`}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500 italic mt-2">No exercises defined for this workout</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No workouts scheduled for week {selectedWeek}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutProgramDetail;