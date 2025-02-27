import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import * as workoutService from '../services/workout.service';
import { PersonalRecord } from '../types';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();

  // Fetch personal records if user is logged in
  const { data: personalRecords, isLoading: recordsLoading } = useQuery(
    ['personal-records', user?.id],
    () => workoutService.getPersonalRecords(user!.id),
    {
      enabled: !!user,
    }
  );

  // Group records by category
  const recordsByCategory = React.useMemo(() => {
    if (!personalRecords?.records) return {};

    return personalRecords.records.reduce(
      (acc: { [key: string]: PersonalRecord[] }, record) => {
        const category = record.category || 'Uncategorized';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(record);
        return acc;
      },
      {}
    );
  }, [personalRecords]);

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          You need to be logged in to view your profile
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Your Profile</h1>
        <p className="text-gray-600">View your account info and workout statistics</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Account Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <div className="mt-1 text-gray-800">{user.email}</div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={logout}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>

        {/* Personal Records Card */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Records</h2>
          
          {recordsLoading ? (
            <p className="text-gray-500">Loading personal records...</p>
          ) : !personalRecords || personalRecords.records.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">You haven't logged any workouts yet.</p>
              <Link
                to="/workouts/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors"
              >
                Log Your First Workout
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(recordsByCategory).map(([category, records]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium text-gray-800 mb-3">{category}</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Exercise
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max Weight
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Max Reps
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {records.map((record, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">
                              {record.exercise}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.max_weight} lbs
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {record.max_reps}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Additional sections could be added here - workout statistics, goals, etc. */}
    </div>
  );
};

export default Profile;