import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getWorkoutPrograms } from '../services/workout.service';
import { WorkoutProgram } from '../types';
import { useAuth } from '../hooks/useAuth';

const WorkoutProgramsList: React.FC = () => {
  const { user } = useAuth();
  const [showPublicOnly, setShowPublicOnly] = useState(false);

  const { data: programs, isLoading, error } = useQuery<WorkoutProgram[]>(
    ['workout-programs', showPublicOnly],
    () => getWorkoutPrograms(showPublicOnly)
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading workout programs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>Error loading workout programs. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Workout Programs</h1>
        <div className="flex gap-4">
          <div className="flex items-center">
            <label htmlFor="public-filter" className="mr-2 text-gray-700">
              Show public only:
            </label>
            <input
              id="public-filter"
              type="checkbox"
              checked={showPublicOnly}
              onChange={(e) => setShowPublicOnly(e.target.checked)}
              className="form-checkbox h-5 w-5 text-indigo-600"
            />
          </div>
          <Link
            to="/programs/create"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
          >
            Create Program
          </Link>
        </div>
      </div>

      {programs && programs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programs.map((program) => (
            <div
              key={program.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">{program.name}</h2>
                  {program.is_public && (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Public
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4 text-sm">
                  {program.description || 'No description provided'}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <div>Duration: {program.duration_weeks} weeks</div>
                  <div>Workouts: {program.workouts.length}</div>
                </div>
                <div className="flex justify-between items-center">
                  <Link
                    to={`/programs/${program.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Details
                  </Link>
                  {user && program.creator_id === user.id && (
                    <Link
                      to={`/programs/${program.id}/edit`}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Edit
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-500 mb-4">No workout programs found</p>
          <Link
            to="/programs/create"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
          >
            Create Your First Program
          </Link>
        </div>
      )}
    </div>
  );
};

export default WorkoutProgramsList;