import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import { useMutation } from 'react-query';
import { useAuth } from '../hooks/useAuth';
import * as workoutService from '../services/workout.service';
import { WorkoutEntryCreate, WorkoutSessionCreate } from '../types';

// Validation schemas
const WorkoutEntrySchema = Yup.object().shape({
  exercise_name: Yup.string()
    .required('Exercise name is required')
    .min(2, 'Too short')
    .max(50, 'Too long'),
  sets: Yup.number()
    .required('Sets are required')
    .positive('Must be positive')
    .max(20, 'Maximum 20 sets'),
  reps: Yup.number()
    .required('Reps are required')
    .positive('Must be positive')
    .max(100, 'Maximum 100 reps'),
  weight: Yup.number()
    .required('Weight is required')
    .min(0, 'Cannot be negative')
    .max(2000, 'Maximum 2000 lbs'),
  notes: Yup.string().max(500, 'Notes too long'),
  category: Yup.string().oneOf(
    ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core', 'Cardio', 'Other', ''],
    'Invalid category'
  ),
  difficulty: Yup.number().min(1, 'Minimum 1').max(10, 'Maximum 10'),
});

const WorkoutSchema = Yup.object().shape({
  date: Yup.date().required('Date is required').max(new Date(), 'Cannot be in the future'),
  notes: Yup.string().max(500, 'Notes too long'),
  entries: Yup.array().of(WorkoutEntrySchema),
});

const CreateWorkout: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initial form values
  const initialValues = {
    date: new Date().toISOString().slice(0, 10), // Format as YYYY-MM-DD
    notes: '',
    entries: [
      {
        exercise_name: '',
        sets: 3,
        reps: 10,
        weight: 0,
        category: '',
        notes: '',
        difficulty: 5,
      },
    ],
  };

  // Mutation for creating workout session
  const createWorkoutMutation = useMutation(
    async (values: {
      date: string;
      notes: string;
      entries: WorkoutEntryCreate[];
    }) => {
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Create the workout session
      const workoutData: WorkoutSessionCreate = {
        user_id: user.id,
        date: new Date(values.date).toISOString(),
        notes: values.notes,
      };

      const workout = await workoutService.createWorkout(workoutData);

      // Add each exercise entry
      for (const entry of values.entries) {
        await workoutService.createWorkoutEntry(workout.id, entry);
      }

      return workout;
    },
    {
      onSuccess: (workout) => {
        navigate(`/workouts/${workout.id}`);
      },
      onError: (error: any) => {
        setSubmitError(error.message || 'Failed to create workout');
      },
    }
  );

  const handleSubmit = (values: any) => {
    createWorkoutMutation.mutate(values);
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          You need to be logged in to create a workout
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Log New Workout</h1>
        <p className="text-gray-600">Record your exercises, sets, reps, and weights</p>
      </div>

      {submitError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {submitError}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <Formik
          initialValues={initialValues}
          validationSchema={WorkoutSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isSubmitting }) => (
            <Form>
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Workout Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <Field
                      type="date"
                      id="date"
                      name="date"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <ErrorMessage
                      name="date"
                      component="div"
                      className="text-red-500 mt-1 text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                    Workout Notes (optional)
                  </label>
                  <Field
                    as="textarea"
                    id="notes"
                    name="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="How did the workout feel? Any achievements or setbacks?"
                  />
                  <ErrorMessage
                    name="notes"
                    component="div"
                    className="text-red-500 mt-1 text-sm"
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Exercises</h2>
                </div>

                <FieldArray name="entries">
                  {({ push, remove }) => (
                    <div>
                      {values.entries.map((entry, index) => (
                        <div
                          key={index}
                          className="p-4 border border-gray-200 rounded-lg mb-4"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-800">
                              Exercise #{index + 1}
                            </h3>
                            {values.entries.length > 1 && (
                              <button
                                type="button"
                                onClick={() => remove(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <label
                                htmlFor={`entries.${index}.exercise_name`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Exercise Name
                              </label>
                              <Field
                                type="text"
                                id={`entries.${index}.exercise_name`}
                                name={`entries.${index}.exercise_name`}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. Bench Press"
                              />
                              <ErrorMessage
                                name={`entries.${index}.exercise_name`}
                                component="div"
                                className="text-red-500 mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`entries.${index}.category`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Category
                              </label>
                              <Field
                                as="select"
                                id={`entries.${index}.category`}
                                name={`entries.${index}.category`}
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
                              </Field>
                              <ErrorMessage
                                name={`entries.${index}.category`}
                                component="div"
                                className="text-red-500 mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`entries.${index}.sets`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Sets
                              </label>
                              <Field
                                type="number"
                                id={`entries.${index}.sets`}
                                name={`entries.${index}.sets`}
                                min="1"
                                max="20"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <ErrorMessage
                                name={`entries.${index}.sets`}
                                component="div"
                                className="text-red-500 mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`entries.${index}.reps`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Reps
                              </label>
                              <Field
                                type="number"
                                id={`entries.${index}.reps`}
                                name={`entries.${index}.reps`}
                                min="1"
                                max="100"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <ErrorMessage
                                name={`entries.${index}.reps`}
                                component="div"
                                className="text-red-500 mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`entries.${index}.weight`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Weight (lbs)
                              </label>
                              <Field
                                type="number"
                                id={`entries.${index}.weight`}
                                name={`entries.${index}.weight`}
                                step="0.5"
                                min="0"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <ErrorMessage
                                name={`entries.${index}.weight`}
                                component="div"
                                className="text-red-500 mt-1 text-sm"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`entries.${index}.difficulty`}
                                className="block text-sm font-medium text-gray-700 mb-1"
                              >
                                Difficulty (1-10)
                              </label>
                              <Field
                                type="number"
                                id={`entries.${index}.difficulty`}
                                name={`entries.${index}.difficulty`}
                                min="1"
                                max="10"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              />
                              <ErrorMessage
                                name={`entries.${index}.difficulty`}
                                component="div"
                                className="text-red-500 mt-1 text-sm"
                              />
                            </div>
                          </div>
                          <div>
                            <label
                              htmlFor={`entries.${index}.notes`}
                              className="block text-sm font-medium text-gray-700 mb-1"
                            >
                              Notes (optional)
                            </label>
                            <Field
                              as="textarea"
                              id={`entries.${index}.notes`}
                              name={`entries.${index}.notes`}
                              rows={2}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              placeholder="Any notes about this exercise"
                            />
                            <ErrorMessage
                              name={`entries.${index}.notes`}
                              component="div"
                              className="text-red-500 mt-1 text-sm"
                            />
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          push({
                            exercise_name: '',
                            sets: 3,
                            reps: 10,
                            weight: 0,
                            category: '',
                            notes: '',
                            difficulty: 5,
                          })
                        }
                        className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                      >
                        + Add Another Exercise
                      </button>
                    </div>
                  )}
                </FieldArray>
              </div>

              <div className="flex justify-end space-x-4">
                <Link
                  to="/workouts"
                  className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-indigo-600 rounded-md text-white hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Workout'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default CreateWorkout;