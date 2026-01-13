// Paperless-ngx Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paperlessApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';

interface DocumentListParams {
  page?: number;
  page_size?: number;
  query?: string;
  correspondent?: number;
  document_type?: number;
  tags?: number[];
}

// List documents
export function usePaperlessDocuments(params: DocumentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.paperless.documents.list(params),
    queryFn: () => paperlessApi.listDocuments(params),
  });
}

// Get single document
export function usePaperlessDocument(id: number, enabled = true) {
  return useQuery({
    queryKey: queryKeys.paperless.documents.detail(id),
    queryFn: () => paperlessApi.getDocument(id),
    enabled: !!id && enabled,
  });
}

// Search documents
export function usePaperlessSearch(query: string, page: number = 1, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.paperless.documents.all(), 'search', query, page],
    queryFn: () => paperlessApi.searchDocuments(query, page),
    enabled: !!query && query.length >= 2 && enabled,
  });
}

// Get correspondents
export function usePaperlessCorrespondents() {
  return useQuery({
    queryKey: queryKeys.paperless.correspondents(),
    queryFn: () => paperlessApi.listCorrespondents(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get document types
export function usePaperlessDocumentTypes() {
  return useQuery({
    queryKey: queryKeys.paperless.documentTypes(),
    queryFn: () => paperlessApi.listDocumentTypes(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get tags
export function usePaperlessTags() {
  return useQuery({
    queryKey: queryKeys.paperless.tags(),
    queryFn: () => paperlessApi.listTags(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Get statistics
export function usePaperlessStatistics() {
  return useQuery({
    queryKey: queryKeys.paperless.statistics(),
    queryFn: () => paperlessApi.getStatistics(),
  });
}

// Upload document
export function useUploadPaperlessDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ file, metadata }: { file: File; metadata?: any }) => 
      paperlessApi.uploadDocument(file, metadata),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.statistics() });
      toast.success('Document uploaded - processing in background');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload document');
    },
  });
}

// Update document
export function useUpdatePaperlessDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      paperlessApi.updateDocument(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.documents.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.documents.all() });
      toast.success('Document updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update document');
    },
  });
}

// Delete document
export function useDeletePaperlessDocument() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: paperlessApi.deleteDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.documents.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.statistics() });
      toast.success('Document deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete document');
    },
  });
}

// Create correspondent
export function useCreatePaperlessCorrespondent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (name: string) => paperlessApi.createCorrespondent(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.correspondents() });
      toast.success('Correspondent created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create correspondent');
    },
  });
}

// Create document type
export function useCreatePaperlessDocumentType() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (name: string) => paperlessApi.createDocumentType(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.documentTypes() });
      toast.success('Document type created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create document type');
    },
  });
}

// Create tag
export function useCreatePaperlessTag() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ name, color }: { name: string; color?: string }) => 
      paperlessApi.createTag(name, color),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.tags() });
      toast.success('Tag created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });
}

// Bulk edit documents
export function useBulkEditPaperlessDocuments() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ documents, method, data }: { 
      documents: number[]; 
      method: string; 
      data?: any 
    }) => paperlessApi.bulkEdit(documents, method, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.paperless.documents.all() });
      toast.success('Bulk operation completed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform bulk operation');
    },
  });
}

// Download document (returns blob URL)
export function useDownloadPaperlessDocument() {
  return useMutation({
    mutationFn: async ({ id, original = false }: { id: number; original?: boolean }) => {
      const blob = await paperlessApi.downloadDocument(id, original);
      return URL.createObjectURL(blob);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to download document');
    },
  });
}
