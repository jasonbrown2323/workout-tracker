import axios from 'axios';

// Automatically determine API URL:
// 1. Use environment variable if set (for production Docker builds)
// 2. Otherwise use relative URL '/api' for use with reverse proxy
// 3. Fall back to local development server
const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;