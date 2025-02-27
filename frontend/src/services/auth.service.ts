import api from './api';
import { User, UserCreate } from '../types';
import { jwtDecode } from 'jwt-decode';

// Token types
interface Token {
  access_token: string;
  token_type: string;
}

interface DecodedToken {
  sub: string; // email
  exp: number;
}

export const login = async (email: string, password: string): Promise<User> => {
  try {
    // Use proper token-based auth with our new backend endpoint
    const response = await api.post('/auth/token', 
      new URLSearchParams({
        'username': email, // OAuth2 spec uses 'username' even though we use email
        'password': password,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const tokenData = response.data as Token;
    
    // Store the token
    localStorage.setItem('token', tokenData.access_token);
    
    // Get user details with the token
    const userResponse = await api.get('/auth/me');
    const user = userResponse.data as User;
    
    // Store user in localStorage
    localStorage.setItem('user', JSON.stringify(user));
    
    return user;
  } catch (error) {
    console.error('Login error:', error);
    throw new Error('Invalid credentials');
  }
};

export const register = async (userData: UserCreate): Promise<User> => {
  try {
    // Register the user
    const response = await api.post('/users', userData);
    const newUser = response.data as User;
    
    // Auto-login after registration
    await login(userData.email, userData.password);
    
    return newUser;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = (): void => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};

export const getCurrentUser = (): User | null => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return null;
  }
  
  try {
    // Check if token is expired
    const decoded = jwtDecode<DecodedToken>(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      // Token is expired
      logout();
      return null;
    }
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Token validation error:', error);
    logout();
    return null;
  }
};