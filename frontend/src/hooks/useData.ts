import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ApiResponse, Project, Task, ExportJob, Pagination } from '../types/api';

// --- Projects ---
export const useProjects = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['projects', page, limit],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project[]>>(`/projects?page=${page}&limit=${limit}`);
      return data;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const { data } = await api.post<ApiResponse<Project>>('/projects', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// --- Tasks ---
export const useTasks = (projectId: string, filters: { status?: string; priority?: string } = {}) => {
  return useQuery({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ project_id: projectId });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      
      const { data } = await api.get<ApiResponse<Task[]>>(`/tasks?${params.toString()}`);
      return data.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Task>) => {
      const { data } = await api.post<ApiResponse<Task>>('/tasks', payload);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Task> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Task>>(`/tasks/${id}`, payload);
      return data.data;
    },
    // Optimistic UI updates are handled at the component level using onMutate
    onSettled: (_, __, variables) => {
       // We can invalidate gracefully but we will do it cautiously to not jitter optimistic state
       queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
    }
  });
};

// --- Exports ---
export const useTriggerExport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { data } = await api.post<ApiResponse<{ exportId: string }>>(`/projects/${projectId}/export`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
    }
  });
};

export const useExportHistory = () => {
  return useQuery({
    queryKey: ['exports'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExportJob[]>>('/exports');
      return data.data;
    }
  });
};

export const useExportStatus = (exportId: string | null) => {
  return useQuery({
    queryKey: ['export', exportId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ExportJob>>(`/exports/${exportId}`);
      return data.data;
    },
    enabled: !!exportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 3000; // Poll every 3s
    }
  });
};
