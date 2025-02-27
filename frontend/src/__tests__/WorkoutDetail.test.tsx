import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import WorkoutDetail from '../pages/WorkoutDetail';
import { AuthProvider } from '../hooks/useAuth';
import * as authService from '../services/auth.service';
import * as workoutService from '../services/workout.service';

// Mock services
jest.mock('../services/auth.service');
jest.mock('../services/workout.service');

// Mock window.confirm
window.confirm = jest.fn(() => true);

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const mockWorkout = {
  id: 1,
  user_id: 1,
  date: '2025-02-25',
  notes: 'Test workout notes',
  entries: [
    {
      id: 1,
      workout_id: 1,
      exercise_name: 'Bench Press',
      sets: 3,
      reps: 10,
      weight: 135,
      notes: 'Feeling strong today',
      category: 'Chest',
      difficulty: 7,
    },
    {
      id: 2,
      workout_id: 1,
      exercise_name: 'Squat',
      sets: 4,
      reps: 8,
      weight: 225,
      notes: 'Working on form',
      category: 'Legs',
      difficulty: 8,
    },
  ],
};

describe('WorkoutDetail Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock getCurrentUser to return a user
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      id: 1,
      email: 'test@example.com',
    });
    
    // Mock getWorkout with a successful mock workout response
    (workoutService.getWorkout as jest.Mock).mockResolvedValue(mockWorkout);

    // Mock the other workout service functions that will be called
    (workoutService.updateWorkout as jest.Mock).mockResolvedValue({
      ...mockWorkout,
      notes: 'Updated notes',
    });

    (workoutService.updateWorkoutEntry as jest.Mock).mockResolvedValue({
      id: 1,
      workout_id: 1,
      exercise_name: 'Incline Bench Press',
      sets: 4,
      reps: 8,
      weight: 145,
      notes: 'Updated exercise notes',
      category: 'Chest',
      difficulty: 8,
    });

    (workoutService.deleteWorkoutEntry as jest.Mock).mockResolvedValue({ success: true });
    (workoutService.deleteWorkout as jest.Mock).mockResolvedValue({ success: true });
  });

  const renderComponent = (workoutId: string = '1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={[`/workouts/${workoutId}`]}>
            <Routes>
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  test('renders workout details correctly', async () => {
    renderComponent();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Workout: February 25, 2025/i)).toBeInTheDocument();
    });

    // Check notes section
    expect(screen.getByText('Test workout notes')).toBeInTheDocument();
    expect(screen.getByText('Edit Notes')).toBeInTheDocument();

    // Check exercises
    expect(screen.getByText('Bench Press')).toBeInTheDocument();
    expect(screen.getByText('Squat')).toBeInTheDocument();
  });

  test('displays login prompt when user is not authenticated', async () => {
    // Mock getCurrentUser to return null (unauthenticated)
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    renderComponent();

    // Should display login prompt
    expect(screen.getByText('You need to be logged in to view workout details')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  test('displays error when workout is not found', async () => {
    // Mock getWorkout to throw an error
    (workoutService.getWorkout as jest.Mock).mockRejectedValue(new Error('Workout not found'));

    renderComponent();

    // Wait for error to display
    await waitFor(() => {
      expect(screen.getByText(/Error loading workout/i)).toBeInTheDocument();
    });
    
    expect(screen.getByText('Back to Workouts')).toBeInTheDocument();
  });
});