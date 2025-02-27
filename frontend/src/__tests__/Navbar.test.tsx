import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import { AuthProvider } from '../hooks/useAuth';
import * as authService from '../services/auth.service';

// Mock the auth service
jest.mock('../services/auth.service');

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders navbar with unauthenticated user links', () => {
    // Mock getCurrentUser to return null (unauthenticated)
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for brand name
    expect(screen.getByText('WorkoutTracker')).toBeInTheDocument();

    // Check for unauthenticated navigation links
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();

    // Check for common navigation links
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Workouts')).toBeInTheDocument();
    expect(screen.getByText('Log Workout')).toBeInTheDocument();
  });

  test('renders navbar with authenticated user links', () => {
    // Mock getCurrentUser to return a user (authenticated)
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      id: 1,
      email: 'test@example.com',
    });

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check for authenticated navigation links
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();

    // Login and Register links should not be visible
    expect(screen.queryByText('Login')).toBeNull();
    expect(screen.queryByText('Register')).toBeNull();
  });

  test('toggles mobile menu when button is clicked', () => {
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Mobile menu should be closed initially
    const mobileMenuButton = screen.getByRole('button', { name: /Open main menu/i });
    expect(mobileMenuButton).toBeInTheDocument();

    // Mobile menu content should not be visible initially
    expect(screen.queryByText('Login', { selector: '.md\\:hidden .block' })).toBeNull();

    // Click the menu button to open mobile menu
    fireEvent.click(mobileMenuButton);

    // Mobile menu content should now be visible
    expect(screen.getByText('Login', { selector: '.md\\:hidden .block' })).toBeInTheDocument();
  });

  test('logs out user when logout button is clicked', () => {
    // Mock getCurrentUser to return a user
    (authService.getCurrentUser as jest.Mock).mockReturnValue({
      id: 1,
      email: 'test@example.com',
    });
    
    // Mock logout function
    (authService.logout as jest.Mock).mockImplementation(() => {});

    render(
      <BrowserRouter>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </BrowserRouter>
    );

    // Find and click logout button
    const logoutButton = screen.getByText('Log out');
    fireEvent.click(logoutButton);

    // Check if logout function was called
    expect(authService.logout).toHaveBeenCalled();
  });
});