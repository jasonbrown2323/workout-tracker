import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../hooks/useAuth';
import * as authService from '../services/auth.service';

// Mock the auth service
jest.mock('../services/auth.service');

// Wrapper component for the hook
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('useAuth Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear localStorage before each test
    localStorage.clear();
  });

  test('initializes with null user and loading state', () => {
    // Mock getCurrentUser to return null
    (authService.getCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state should be no user and loading
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('initializes with stored user', () => {
    // Mock stored user
    const mockUser = { id: 1, email: 'test@example.com' };
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Should initialize with the stored user
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });

  test('login function sets user state', async () => {
    // Mock login function
    const mockUser = { id: 1, email: 'test@example.com' };
    (authService.login as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call login function
    await act(async () => {
      await result.current.login('test@example.com', 'password123');
    });

    // User state should be updated
    expect(result.current.user).toEqual(mockUser);
  });

  test('register function sets user state', async () => {
    // Mock register function
    const mockUser = { id: 1, email: 'new@example.com' };
    (authService.register as jest.Mock).mockResolvedValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Call register function
    await act(async () => {
      await result.current.register('new@example.com', 'password123');
    });

    // User state should be updated
    expect(result.current.user).toEqual(mockUser);
  });

  test('logout function clears user state', async () => {
    // Mock stored user initially
    const mockUser = { id: 1, email: 'test@example.com' };
    (authService.getCurrentUser as jest.Mock).mockReturnValue(mockUser);

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Verify initial state
    expect(result.current.user).toEqual(mockUser);

    // Call logout function
    act(() => {
      result.current.logout();
    });

    // User state should be cleared
    expect(result.current.user).toBeNull();
    expect(authService.logout).toHaveBeenCalled();
  });
});