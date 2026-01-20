// File Tracking React Query hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { queryKeys } from './query-config';
import { fileTrackingApi, FileTracker } from '@/lib/api/file-tracking';

interface FileTrackerListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  office_id?: string;
}

export function useFileTrackerList(params: FileTrackerListParams = {}) {
  return useQuery({
    queryKey: queryKeys.files.list(params),
    queryFn: () => fileTrackingApi.list(params),
  });
}

export function useFileTracker(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.files.detail(id),
    queryFn: () => fileTrackingApi.getById(id),
    enabled: enabled && !!id,
  });
}

export function useFileTrackerStats() {
  return useQuery({
    queryKey: [...queryKeys.files.all, 'stats'],
    queryFn: () => fileTrackingApi.getStats(),
  });
}

export function useFileTrackerCategories() {
  return useQuery({
    queryKey: [...queryKeys.files.all, 'categories'],
    queryFn: () => fileTrackingApi.getCategories(),
  });
}

export function useCreateFileTracker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { title: string; description?: string; category: string; office_id?: string }) =>
      fileTrackingApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
      toast.success('File tracker created successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create file tracker');
    },
  });
}

export function useUpdateFileTracker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ title: string; description: string; category: string }> }) =>
      fileTrackingApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(variables.id) });
      toast.success('File tracker updated successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to update file tracker');
    },
  });
}

export function useDeleteFileTracker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => fileTrackingApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
      toast.success('File tracker deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to delete file tracker');
    },
  });
}

export function useCloseFileTracker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => fileTrackingApi.close(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(id) });
      toast.success('File closed successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to close file');
    },
  });
}

export function useReopenFileTracker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => fileTrackingApi.reopen(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(id) });
      toast.success('File reopened successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to reopen file');
    },
  });
}

export function useLinkDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ fileId, documentType, documentId }: { fileId: string; documentType: 'darta' | 'chalani'; documentId: string }) =>
      fileTrackingApi.linkDocument(fileId, { document_type: documentType, document_id: documentId }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(variables.fileId) });
      toast.success('Document linked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to link document');
    },
  });
}

export function useUnlinkDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ fileId, documentType, documentId }: { fileId: string; documentType: string; documentId: string }) =>
      fileTrackingApi.unlinkDocument(fileId, documentType, documentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.files.detail(variables.fileId) });
      toast.success('Document unlinked successfully');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to unlink document');
    },
  });
}
