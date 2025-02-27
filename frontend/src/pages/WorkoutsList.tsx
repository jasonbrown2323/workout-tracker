import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import * as workoutService from '../services/workout.service';
import { WorkoutSession } from '../types';

const WorkoutsList: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch all workouts
  const { data: workouts, isLoading, error } = useQuery('workouts', workoutService.getWorkouts, {
    enabled: !!user,
  });

  // Filter workouts based on search criteria
  const filteredWorkouts = workouts
    ? workouts
        .filter((workout: WorkoutSession) => {
          // Filter by search term (exercise name)
          if (searchTerm && !workout.entries.some(entry => 
            entry.exercise_name.toLowerCase().includes(searchTerm.toLowerCase())
          )) {
            return false;
          }
          
          // Filter by start date
          if (startDate && new Date(workout.date) < new Date(startDate)) {
            return false;
          }
          
          // Filter by end date
          if (endDate && new Date(workout.date) > new Date(endDate)) {
            return false;
          }
          
          return true;
        })
        // Sort by date (newest first)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          You need to be logged in to view your workouts
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

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          Your Workouts
        </h1>
        <Link
          to="/workouts/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
        >
          + New Workout
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Search & Filter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="search"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Search Exercise
            </label>
            <input
              type="text"
              id="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="E.g., Bench Press"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="start-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Start Date
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label
              htmlFor="end-date"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              End Date
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Workouts List */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading workouts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-500">Error loading workouts. Please try again later.</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              {searchTerm || startDate || endDate
                ? "No workouts match your search criteria."
                : "You haven't logged any workouts yet."}
            </p>
            {!searchTerm && !startDate && !endDate && (
              <Link
                to="/workouts/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Log Your First Workout
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exercises
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredWorkouts.map((workout: WorkoutSession) => (
                  <tr key={workout.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(workout.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {workout.entries.length > 0 ? (
                        <div>
                          <span className="font-medium">
                            {workout.entries.length} exercise{workout.entries.length !== 1 ? 's' : ''}
                          </span>
                          <ul className="mt-1 text-sm text-gray-500">
                            {workout.entries.slice(0, 3).map((entry, idx) => (
                              <li key={idx} className="truncate">
                                • {entry.exercise_name}
                              </li>
                            ))}
                            {workout.entries.length > 3 && (
                              <li className="italic">
                                + {workout.entries.length - 3} more
                              </li>
                            )}
                          </ul>
                        </div>
                      ) : (
                        <span className="text-gray-400">No exercises</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {workout.notes ? (
                        <span className="truncate block max-w-xs">
                          {workout.notes}
                        </span>
                      ) : (
                        <span className="text-gray-400">No notes</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        to={`/workouts/${workout.id}`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this workout?')) {
                            workoutService.deleteWorkout(workout.id);
                            // You'd typically invalidate the query here to refetch the data
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
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

export default WorkoutsList;