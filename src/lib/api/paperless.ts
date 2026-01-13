// Paperless-ngx API service
import { apiClient } from './client';

interface PaperlessDocument {
  id: number;
  correspondent: number | null;
  document_type: number | null;
  storage_path: number | null;
  title: string;
  content: string;
  tags: number[];
  created: string;
  created_date: string;
  modified: string;
  added: string;
  archive_serial_number: number | null;
  original_file_name: string;
  archived_file_name: string | null;
  owner: number | null;
}

interface PaperlessCorrespondent {
  id: number;
  slug: string;
  name: string;
  match: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  document_count: number;
}

interface PaperlessDocumentType {
  id: number;
  slug: string;
  name: string;
  match: string;
  matching_algorithm: number;
  is_insensitive: boolean;
  document_count: number;
}

interface PaperlessTag {
  id: number;
  slug: string;
  name: string;
  color: string;
  is_inbox_tag: boolean;
  document_count: number;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface PaperlessStatistics {
  documents_total: number;
  documents_inbox: number;
  inbox_tag: number | null;
  document_file_type_counts: Array<{ mime_type: string; count: number }>;
  character_count: number;
}

export const paperlessApi = {
  // Documents
  async listDocuments(params: {
    page?: number;
    page_size?: number;
    query?: string;
    correspondent?: number;
    document_type?: number;
    tags?: number[];
  } = {}): Promise<PaginatedResponse<PaperlessDocument>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
    
    const response = await apiClient.get<PaginatedResponse<PaperlessDocument>>(
      `/paperless/documents/?${queryParams.toString()}`
    );
    return response.data;
  },

  async getDocument(id: number): Promise<PaperlessDocument> {
    const response = await apiClient.get<PaperlessDocument>(`/paperless/documents/${id}/`);
    return response.data;
  },

  async uploadDocument(file: File, metadata?: {
    title?: string;
    correspondent?: number;
    document_type?: number;
    tags?: number[];
  }): Promise<{ task_id: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
    }
    
    const response = await apiClient.uploadFile<{ task_id: string }>('/paperless/documents/', formData);
    return response.data;
  },

  async updateDocument(id: number, data: Partial<{
    title: string;
    correspondent: number | null;
    document_type: number | null;
    tags: number[];
  }>): Promise<PaperlessDocument> {
    const response = await apiClient.patch<PaperlessDocument>(`/paperless/documents/${id}/`, data);
    return response.data;
  },

  async deleteDocument(id: number): Promise<void> {
    await apiClient.delete(`/paperless/documents/${id}/`);
  },

  async downloadDocument(id: number, original: boolean = false): Promise<Blob> {
    const endpoint = `/paperless/documents/${id}/download/?original=${original}`;
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiClient.getAccessToken()}`
      }
    });
    return response.blob();
  },

  async searchDocuments(query: string, page: number = 1): Promise<PaginatedResponse<PaperlessDocument>> {
    const response = await apiClient.get<PaginatedResponse<PaperlessDocument>>(
      `/paperless/documents/search/?query=${encodeURIComponent(query)}&page=${page}`
    );
    return response.data;
  },

  // Correspondents
  async listCorrespondents(): Promise<PaginatedResponse<PaperlessCorrespondent>> {
    const response = await apiClient.get<PaginatedResponse<PaperlessCorrespondent>>('/paperless/correspondents/');
    return response.data;
  },

  async createCorrespondent(name: string): Promise<PaperlessCorrespondent> {
    const response = await apiClient.post<PaperlessCorrespondent>('/paperless/correspondents/', { name });
    return response.data;
  },

  // Document Types
  async listDocumentTypes(): Promise<PaginatedResponse<PaperlessDocumentType>> {
    const response = await apiClient.get<PaginatedResponse<PaperlessDocumentType>>('/paperless/document-types/');
    return response.data;
  },

  async createDocumentType(name: string): Promise<PaperlessDocumentType> {
    const response = await apiClient.post<PaperlessDocumentType>('/paperless/document-types/', { name });
    return response.data;
  },

  // Tags
  async listTags(): Promise<PaginatedResponse<PaperlessTag>> {
    const response = await apiClient.get<PaginatedResponse<PaperlessTag>>('/paperless/tags/');
    return response.data;
  },

  async createTag(name: string, color?: string): Promise<PaperlessTag> {
    const response = await apiClient.post<PaperlessTag>('/paperless/tags/', { name, color });
    return response.data;
  },

  // Statistics
  async getStatistics(): Promise<PaperlessStatistics> {
    const response = await apiClient.get<PaperlessStatistics>('/paperless/stats/statistics/');
    return response.data;
  },

  // Bulk operations
  async bulkEdit(documents: number[], method: string, data?: {
    correspondent?: number;
    document_type?: number;
    tags?: number[];
  }): Promise<void> {
    await apiClient.post('/paperless/documents/bulk_edit/', {
      documents,
      method,
      ...data
    });
  },
};

export type { 
  PaperlessDocument, 
  PaperlessCorrespondent, 
  PaperlessDocumentType, 
  PaperlessTag,
  PaperlessStatistics 
};
