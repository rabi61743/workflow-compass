// Chalani Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chalaniApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';
import type { LetterStatus, LetterPriority } from '@/lib/types';

interface ChalaniListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: LetterStatus;
  priority?: LetterPriority;
  receiver_type?: 'internal' | 'external';
  from_date?: string;
  to_date?: string;
  fiscal_year?: string;
}

// List Chalani letters
export function useChalaniList(params: ChalaniListParams = {}) {
  return useQuery({
    queryKey: queryKeys.chalani.list(params),
    queryFn: () => chalaniApi.list(params),
  });
}

// Get single Chalani by ID
export function useChalani(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chalani.detail(id),
    queryFn: () => chalaniApi.getById(id),
    enabled: !!id && enabled,
  });
}

// Get Chalani workflow history
export function useChalaniWorkflow(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.chalani.workflow(id),
    queryFn: () => chalaniApi.getWorkflowHistory(id),
    enabled: !!id && enabled,
  });
}

// Create Chalani mutation
export function useCreateChalani() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chalaniApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Chalani created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create Chalani');
    },
  });
}

// Update Chalani mutation
export function useUpdateChalani() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => chalaniApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.lists() });
      toast.success('Chalani updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update Chalani');
    },
  });
}

// Delete Chalani mutation
export function useDeleteChalani() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: chalaniApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Chalani deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete Chalani');
    },
  });
}

// Perform workflow action on Chalani
export function useChalaniAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: any }) => chalaniApi.performAction(id, action),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.workflow(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Action completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform action');
    },
  });
}

// Dispatch Chalani
export function useDispatchChalani() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, details }: { id: string; details: { method: string; remarks?: string } }) => 
      chalaniApi.dispatch(id, details),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Chalani dispatched successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to dispatch Chalani');
    },
  });
}

// Upload attachment
export function useUploadChalaniAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => chalaniApi.uploadAttachment(id, file),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.detail(id) });
      toast.success('Attachment uploaded successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload attachment');
    },
  });
}

// Delete attachment
export function useDeleteChalaniAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ chalaniId, attachmentId }: { chalaniId: string; attachmentId: string }) => 
      chalaniApi.deleteAttachment(chalaniId, attachmentId),
    onSuccess: (_, { chalaniId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.chalani.detail(chalaniId) });
      toast.success('Attachment deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete attachment');
    },
  });
}

// Get next Chalani number
export function useNextChalaniNumber(fiscalYear: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.chalani.all, 'next-number', fiscalYear],
    queryFn: () => chalaniApi.getNextNumber(fiscalYear),
    enabled: !!fiscalYear && enabled,
  });
}
