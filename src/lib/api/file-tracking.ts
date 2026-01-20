// File Tracking API service
import { apiClient } from './client';

export interface LinkedDocument {
  type: 'darta' | 'chalani';
  id: string;
  number: string;
  subject: string;
}

export interface FileTracker {
  id: string;
  fileNumber: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  currentHandler?: string;
  office?: string;
  linkedDocuments: LinkedDocument[];
  dartaCount: number;
  chalaniCount: number;
}

interface FileTrackerListParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  category?: string;
  office_id?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateFileTrackerRequest {
  title: string;
  description?: string;
  category: string;
  office_id?: string;
}

interface UpdateFileTrackerRequest {
  title?: string;
  description?: string;
  category?: string;
}

interface LinkDocumentRequest {
  document_type: 'darta' | 'chalani';
  document_id: string;
}

// Transform snake_case to camelCase
const transformFileTracker = (data: any): FileTracker => ({
  id: data.id,
  fileNumber: data.file_number,
  title: data.title,
  description: data.description || '',
  category: data.category,
  status: data.is_active ? 'open' : 'closed',
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  createdBy: data.created_by_name || data.created_by,
  currentHandler: data.current_handler_name || data.current_handler,
  office: data.office_name || data.office,
  linkedDocuments: data.linked_documents || [],
  dartaCount: data.darta_count || 0,
  chalaniCount: data.chalani_count || 0,
});

export const fileTrackingApi = {
  async list(params: FileTrackerListParams = {}): Promise<PaginatedResponse<FileTracker>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/files/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<any>>(endpoint);
    return {
      ...response.data,
      results: response.data.results.map(transformFileTracker),
    };
  },

  async getById(id: string): Promise<FileTracker> {
    const response = await apiClient.get<any>(`/workflow/files/${id}/`);
    return transformFileTracker(response.data);
  },

  async create(data: CreateFileTrackerRequest): Promise<FileTracker> {
    const response = await apiClient.post<any>('/workflow/files/', data);
    return transformFileTracker(response.data);
  },

  async update(id: string, data: UpdateFileTrackerRequest): Promise<FileTracker> {
    const response = await apiClient.patch<any>(`/workflow/files/${id}/`, data);
    return transformFileTracker(response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/workflow/files/${id}/`);
  },

  async close(id: string): Promise<FileTracker> {
    const response = await apiClient.post<any>(`/workflow/files/${id}/close/`);
    return transformFileTracker(response.data);
  },

  async reopen(id: string): Promise<FileTracker> {
    const response = await apiClient.post<any>(`/workflow/files/${id}/reopen/`);
    return transformFileTracker(response.data);
  },

  async linkDocument(id: string, data: LinkDocumentRequest): Promise<FileTracker> {
    const response = await apiClient.post<any>(`/workflow/files/${id}/link/`, data);
    return transformFileTracker(response.data);
  },

  async unlinkDocument(id: string, documentType: string, documentId: string): Promise<FileTracker> {
    const response = await apiClient.post<any>(`/workflow/files/${id}/unlink/`, {
      document_type: documentType,
      document_id: documentId,
    });
    return transformFileTracker(response.data);
  },

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/workflow/files/categories/');
    return response.data;
  },

  async getStats(): Promise<{
    total: number;
    open: number;
    closed: number;
    totalLinkedDocs: number;
  }> {
    const response = await apiClient.get<any>('/workflow/files/stats/');
    return {
      total: response.data.total,
      open: response.data.open,
      closed: response.data.closed,
      totalLinkedDocs: response.data.total_linked_docs,
    };
  },
};
