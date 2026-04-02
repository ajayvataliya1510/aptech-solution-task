import axios from 'axios';
import { AuthResponse, ApiResponse } from '../types/api';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    // We can store tokens in localStorage for a simple SPA approach (or cookies)
    if (typeof window !== 'undefined') {
       const token = localStorage.getItem('accessToken');
       if (token && config.headers) {
         config.headers.Authorization = `Bearer ${token}`;
       }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // If the backend returns success: false with 200 OK, treat it as an error
    if (response.data && response.data.success === false) {
      return Promise.reject(response.data.error || { message: 'Unknown error' });
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't already retried this exact request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        if (typeof window !== 'undefined') {
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token available');
            
            // Re-fetch token using separate axios call to avoid interceptor loop
            const response = await axios.post<ApiResponse<AuthResponse>>(`${API_URL}/auth/refresh`, {
              refreshToken
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);

            // Re-bind token properly correctly formatting the authorization header
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            
            // Execute the initial failed query
            const retryResponse = await axios(originalRequest);
            return retryResponse.data;
        }
      } catch (refreshError) {
        if (typeof window !== 'undefined') {
           localStorage.removeItem('accessToken');
           localStorage.removeItem('refreshToken');
           localStorage.removeItem('user');
           // Redirect to unauthenticated portal directly
           window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
