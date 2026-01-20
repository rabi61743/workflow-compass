// Letter Templates React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { templatesApi, LetterTemplate } from '@/lib/api/templates';

const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (params: Record<string, any>) => [...templateKeys.lists(), params] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  categories: () => [...templateKeys.all, 'categories'] as const,
};

interface TemplateListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
}

export function useTemplateList(params: TemplateListParams = {}) {
  return useQuery({
    queryKey: templateKeys.list(params),
    queryFn: () => templatesApi.list(params),
  });
}

export function useTemplate(id: string, enabled = true) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => templatesApi.getById(id),
    enabled: enabled && !!id,
  });
}

export function useTemplateCategories() {
  return useQuery({
    queryKey: templateKeys.categories(),
    queryFn: () => templatesApi.getCategories(),
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { name: string; name_nepali?: string; category: string; content: string }) =>
      templatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create template');
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; name_nepali: string; category: string; content: string; is_active: boolean }> }) =>
      templatesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      queryClient.invalidateQueries({ queryKey: templateKeys.detail(variables.id) });
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update template');
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => templatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete template');
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => templatesApi.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success('Template duplicated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to duplicate template');
    },
  });
}
