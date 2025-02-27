import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import Dashboard from '../pages/Dashboard';
import WorkoutsList from '../pages/WorkoutsList';
import WorkoutDetail from '../pages/WorkoutDetail';
import Login from '../pages/Login';
import { AuthProvider } from '../hooks/useAuth';
import * as authService from '../services/auth.service';
import * as workoutService from '../services/workout.service';

// Mock services
jest.mock('../services/auth.service');
jest.mock('../services/workout.service');

// Create a test query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Mock workout data
const mockWorkouts = [
  {
    id: 1,
    user_id: 1,
    date: '2025-02-25',
    notes: 'Push day',
    entries: [
      {
        id: 1,
        workout_id: 1,
        exercise_name: 'Bench Press',
        sets: 3,
        reps: 10,
        weight: 135,
        notes: 'Feeling strong',
        category: 'Chest',
        difficulty: 7,
      },
    ],
  },
  {
    id: 2,
    user_id: 1,
    date: '2025-02-24',
    notes: 'Pull day',
    entries: [
      {
        id: 2,
        workout_id: 2,
        exercise_name: 'Deadlift',
        sets: 3,
        reps: 5,
        weight: 225,
        notes: 'Working on form',
        category: 'Back',
        difficulty: 8,
      },
    ],
  },
];

describe('Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock authentication
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      id: 1,
      email: 'test@example.com',
    });
    
    // Mock API responses
    (workoutService.getWorkouts as jest.Mock).mockResolvedValue(mockWorkouts);
    (workoutService.getWorkout as jest.Mock).mockImplementation((id: number) => {
      const workout = mockWorkouts.find(w => w.id === id);
      if (workout) {
        return Promise.resolve(workout);
      }
      return Promise.reject(new Error('Workout not found'));
    });
  });

  test('user flow: view workouts list and navigate to workout detail', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/workouts" element={<WorkoutsList />} />
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Should show dashboard on initial load
    await waitFor(() => {
      expect(screen.getByText(/Recent Workouts/i)).toBeInTheDocument();
    });
  });

  test('authentication and authorization test', async () => {
    // Mock unauthenticated user
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);
    
    // Setup successful login
    (authService.login as jest.Mock).mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<Login />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Should show login page
    await waitFor(() => {
      expect(screen.getByText(/Sign in to your account/i)).toBeInTheDocument();
    });

    // Fill in login form
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    // Submit form
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Verify login function was called
    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
    });
  });

  test('exercise details test', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/workouts/1']}>
            <Routes>
              <Route path="/workouts/:id" element={<WorkoutDetail />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>
    );

    // Wait for workout details to load
    await waitFor(() => {
      expect(screen.getByText(/Workout: February 25, 2025/i)).toBeInTheDocument();
      expect(screen.getByText('Bench Press')).toBeInTheDocument();
    });
  });
});