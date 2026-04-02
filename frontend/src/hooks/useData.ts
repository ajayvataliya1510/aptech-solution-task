import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { ApiResponse, Project, Task, ExportJob, Pagination } from '../types/api';
import toast from 'react-hot-toast';

// --- Projects ---
export const useProjects = (page = 1, limit = 10) => {
  return useQuery<ApiResponse<Project[]>>({
    queryKey: ['projects', page, limit],
    queryFn: async () => {
      const response = await api.get(`/projects?page=${page}&limit=${limit}`) as ApiResponse<Project[]>;
      return response;
    },
  });
};

export const useProject = (id: string) => {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`) as ApiResponse<Project>;
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation<Project, any, { name: string; description?: string }>({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const response = await api.post('/projects', payload) as ApiResponse<Project>;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create project');
    }
  });
};

// --- Tasks ---
export const useTasks = (projectId: string, filters: { status?: string; priority?: string } = {}) => {
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams({ project_id: projectId });
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      
      const response = await api.get(`/tasks?${params.toString()}`) as ApiResponse<Task[]>;
      return response.data;
    },
    enabled: !!projectId,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, any, Partial<Task>>({
    mutationFn: async (payload: Partial<Task>) => {
      const response = await api.post('/tasks', payload) as ApiResponse<Task>;
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] });
      toast.success('Task added to workspace');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create task');
    }
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  return useMutation<Task, any, Partial<Task> & { id: string }>({
    mutationFn: async ({ id, ...payload }: Partial<Task> & { id: string }) => {
      const response = await api.put(`/tasks/${id}`, payload) as ApiResponse<Task>;
      return response.data;
    },
    // Optimistic UI updates are handled at the component level using onMutate
    onSettled: (_, __, variables) => {
       // We can invalidate gracefully but we will do it cautiously to not jitter optimistic state
       queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update task');
    }
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  return useMutation<void, any, { id: string; project_id: string }>({
    mutationFn: async ({ id }) => {
      await api.delete(`/tasks/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.project_id] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.project_id] });
      toast.success('Task permanently deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Could not delete task');
    }
  });
};

export const useAddMember = () => {
  const queryClient = useQueryClient();
  return useMutation<void, any, { projectId: string; email: string }>({
    mutationFn: async ({ projectId, email }) => {
      await api.post(`/projects/${projectId}/members`, { email });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Member added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add member');
    }
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation<void, any, { projectId: string; userId: string }>({
    mutationFn: async ({ projectId, userId }) => {
      await api.delete(`/projects/${projectId}/members/${userId}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      toast.success('Member removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove member');
    }
  });
};

// --- Exports ---
export const useTriggerExport = () => {
  const queryClient = useQueryClient();
  return useMutation<{ exportId: string }, any, string>({
    mutationFn: async (projectId: string) => {
      const response = await api.post(`/projects/${projectId}/export`) as ApiResponse<{ exportId: string }>;
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exports'] });
      toast.success('Export job queued successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Export failed to start');
    }
  });
};

export const useExportHistory = () => {
  return useQuery<ExportJob[]>({
    queryKey: ['exports'],
    queryFn: async () => {
      const response = await api.get('/exports') as ApiResponse<ExportJob[]>;
      return response.data;
    }
  });
};

export const useExportStatus = (exportId: string | null) => {
  return useQuery<ExportJob>({
    queryKey: ['export', exportId],
    queryFn: async () => {
      const response = await api.get(`/exports/${exportId}`) as ApiResponse<ExportJob>;
      return response.data;
    },
    enabled: !!exportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'completed' || status === 'failed') return false;
      return 3000; // Poll every 3s
    }
  });
};
