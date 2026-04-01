import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { AuthResponse, ApiResponse } from '../types/api';
import { useRouter } from 'next/navigation';

export const useLogin = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
      return data.data; // Extracts AuthResponse
    },
    onSuccess: (data) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    },
  });
};

export const useRegister = () => {
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: Record<string, string>) => {
      const { data } = await api.post<ApiResponse<any>>('/auth/register', credentials);
      return data.data;
    },
    onSuccess: () => {
      router.push('/login');
    },
  });
};

export const logout = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};
