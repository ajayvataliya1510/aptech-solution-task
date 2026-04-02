import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { AuthResponse, ApiResponse } from '../types/api';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const useLogin = () => {
  const navigate = useNavigate();

  return useMutation<AuthResponse, any, Record<string, string>>({
    mutationFn: async (credentials: Record<string, string>) => {
      const response = await api.post('/auth/login', credentials) as ApiResponse<AuthResponse>;
      return response.data;
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back, ' + data.user.name + '!');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed');
    }
  });
};

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation<any, any, Record<string, string>>({
    mutationFn: async (credentials: Record<string, string>) => {
      const response = await api.post('/auth/register', credentials) as ApiResponse<any>;
      return response.data;
    },
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Registration failed');
    }
  });
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
