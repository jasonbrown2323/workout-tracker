import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { getWorkoutTemplates } from '../services/workout.service';
import { WorkoutTemplate } from '../types';
import { useAuth } from '../hooks/useAuth';

const WorkoutTemplatesList: React.FC = () => {
  const { user } = useAuth();

  const { data: templates, isLoading, error } = useQuery<WorkoutTemplate[]>(
    'workout-templates',
    getWorkoutTemplates
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading workout templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>Error loading workout templates. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Workout Templates</h1>
        <Link
          to="/templates/create"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
        >
          Create Template
        </Link>
      </div>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">{template.name}</h2>
                <p className="text-gray-600 mb-4 text-sm">
                  {template.description || 'No description provided'}
                </p>
                <div className="text-sm text-gray-500 mb-4">
                  <div>Exercises: {template.exercises.length}</div>
                </div>
                <div className="flex justify-between items-center">
                  <Link
                    to={`/templates/${template.id}`}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    View Details
                  </Link>
                  {user && template.creator_id === user.id && (
                    <Link
                      to={`/templates/${template.id}/edit`}
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
          <p className="text-gray-500 mb-4">No workout templates found</p>
          <Link
            to="/templates/create"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
          >
            Create Your First Template
          </Link>
        </div>
      )}
    </div>
  );
};

export default WorkoutTemplatesList;