import React from 'react';
import { useQuery } from 'react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getWorkoutTemplate, deleteWorkoutTemplate } from '../services/workout.service';
import { WorkoutTemplate } from '../types';
import { useAuth } from '../hooks/useAuth';

const WorkoutTemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: template, isLoading, error } = useQuery<WorkoutTemplate>(
    ['workout-template', id],
    () => getWorkoutTemplate(Number(id))
  );

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteWorkoutTemplate(Number(id));
        navigate('/templates');
      } catch (err) {
        console.error('Error deleting template:', err);
        alert('Failed to delete template. Please try again.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading template details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
        <p>Error loading template details. Please try again later.</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
        <p>Template not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{template.name}</h1>
          {template.description && (
            <p className="text-gray-600 mb-2">{template.description}</p>
          )}
        </div>
        
        {user && template.creator_id === user.id && (
          <div className="mt-4 sm:mt-0 space-x-2">
            <Link
              to={`/templates/${template.id}/edit`}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded"
            >
              Edit Template
            </Link>
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Exercises</h2>
        
        {template.exercises.length === 0 ? (
          <p className="text-gray-500">No exercises in this template.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exercise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sets x Reps
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Weight
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {template.exercises
                  .sort((a, b) => a.order - b.order)
                  .map((exercise) => (
                    <tr key={exercise.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {exercise.exercise_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.sets} x {exercise.reps}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {exercise.weight ? `${exercise.weight} lbs` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {exercise.notes || 'N/A'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutTemplateDetail;