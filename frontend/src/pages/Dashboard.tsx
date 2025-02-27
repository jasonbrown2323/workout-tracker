import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { useAuth } from '../hooks/useAuth';
import * as workoutService from '../services/workout.service';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch recent workouts
  const { data: workouts, isLoading: workoutsLoading } = useQuery(
    'recent-workouts',
    workoutService.getWorkouts,
    {
      enabled: !!user,
      select: (data) => {
        // Sort by date (most recent first) and limit to 5
        return [...data]
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
      },
    }
  );

  // Fetch personal records if user is logged in
  const { data: personalRecords, isLoading: recordsLoading } = useQuery(
    ['personal-records', user?.id],
    () => workoutService.getPersonalRecords(user!.id),
    {
      enabled: !!user,
    }
  );

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Welcome to WorkoutTracker
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Track your fitness progress and achieve your goals
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/login"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="bg-gray-100 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user.email}
        </h1>
        <p className="text-gray-600">
          Here's a summary of your recent fitness activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-col space-y-3">
            <Link
              to="/workouts/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md text-center hover:bg-indigo-700 transition-colors"
            >
              Log New Workout
            </Link>
            <Link
              to="/workouts"
              className="bg-gray-100 text-gray-800 px-4 py-2 rounded-md text-center hover:bg-gray-200 transition-colors"
            >
              View All Workouts
            </Link>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Your Stats
          </h2>
          {recordsLoading ? (
            <p className="text-gray-500">Loading personal records...</p>
          ) : personalRecords && personalRecords.records.length > 0 ? (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Personal Records</h3>
              <div className="space-y-2">
                {personalRecords.records.slice(0, 3).map((record, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span>
                      {record.exercise} ({record.category})
                    </span>
                    <span className="font-semibold">
                      {record.max_weight} lbs x {record.max_reps} reps
                    </span>
                  </div>
                ))}
              </div>
              <Link
                to="/profile"
                className="text-indigo-600 hover:text-indigo-800 mt-3 inline-block"
              >
                View All Records
              </Link>
            </div>
          ) : (
            <p className="text-gray-500">
              You haven't logged any workouts yet. Start logging to track your
              personal records!
            </p>
          )}
        </div>
      </div>

      {/* Recent Workouts Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Recent Workouts
        </h2>
        {workoutsLoading ? (
          <p className="text-gray-500">Loading recent workouts...</p>
        ) : workouts && workouts.length > 0 ? (
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
                {workouts.map((workout) => (
                  <tr key={workout.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(new Date(workout.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      {workout.entries.length > 0 ? (
                        <span>
                          {workout.entries.length} exercise
                          {workout.entries.length !== 1 ? 's' : ''}
                        </span>
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
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">
              You haven't logged any workouts yet.
            </p>
            <Link
              to="/workouts/create"
              className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Log Your First Workout
            </Link>
          </div>
        )}
        
        {workouts && workouts.length > 0 && (
          <div className="mt-4 text-right">
            <Link
              to="/workouts"
              className="text-indigo-600 hover:text-indigo-800"
            >
              View All Workouts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;