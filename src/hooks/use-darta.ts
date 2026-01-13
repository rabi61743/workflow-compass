// Darta Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dartaApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';
import type { LetterStatus, LetterPriority } from '@/lib/types';

interface DartaListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: LetterStatus;
  priority?: LetterPriority;
  from_date?: string;
  to_date?: string;
  fiscal_year?: string;
}

// List Darta letters
export function useDartaList(params: DartaListParams = {}) {
  return useQuery({
    queryKey: queryKeys.darta.list(params),
    queryFn: () => dartaApi.list(params),
  });
}

// Get single Darta by ID
export function useDarta(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.darta.detail(id),
    queryFn: () => dartaApi.getById(id),
    enabled: !!id && enabled,
  });
}

// Get Darta workflow history
export function useDartaWorkflow(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.darta.workflow(id),
    queryFn: () => dartaApi.getWorkflowHistory(id),
    enabled: !!id && enabled,
  });
}

// Create Darta mutation
export function useCreateDarta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dartaApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Darta created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create Darta');
    },
  });
}

// Update Darta mutation
export function useUpdateDarta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => dartaApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.lists() });
      toast.success('Darta updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update Darta');
    },
  });
}

// Delete Darta mutation
export function useDeleteDarta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: dartaApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Darta deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete Darta');
    },
  });
}

// Perform workflow action on Darta
export function useDartaAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: any }) => dartaApi.performAction(id, action),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.workflow(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.myTasks({}) });
      toast.success('Action completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform action');
    },
  });
}

// Upload attachment
export function useUploadDartaAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => dartaApi.uploadAttachment(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.detail(id) });
      toast.success('Attachment uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload attachment');
    },
  });
}

// Delete attachment
export function useDeleteDartaAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ dartaId, attachmentId }: { dartaId: string; attachmentId: string }) => 
      dartaApi.deleteAttachment(dartaId, attachmentId),
    onSuccess: (_, { dartaId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.darta.detail(dartaId) });
      toast.success('Attachment deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete attachment');
    },
  });
}

// Get next Darta number
export function useNextDartaNumber(fiscalYear: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.darta.all, 'next-number', fiscalYear],
    queryFn: () => dartaApi.getNextNumber(fiscalYear),
    enabled: !!fiscalYear && enabled,
  });
}
