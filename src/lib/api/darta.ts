// Darta (Incoming Letters) API service
import { apiClient } from './client';
import { DartaLetter, WorkflowStep, LetterPriority, LetterStatus } from '../types';

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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateDartaRequest {
  sender_name: string;
  sender_org: string;
  letter_date: string;
  received_date: string;
  subject: string;
  priority: LetterPriority;
  confidentiality: string;
  document_type: string;
  remarks?: string;
}

interface WorkflowActionRequest {
  action: string;
  to_user_id: string;
  remarks: string;
}

export const dartaApi = {
  async list(params: DartaListParams = {}): Promise<PaginatedResponse<DartaLetter>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/darta/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<DartaLetter>>(endpoint);
    return response.data;
  },

  async getById(id: string): Promise<DartaLetter> {
    const response = await apiClient.get<DartaLetter>(`/darta/${id}/`);
    return response.data;
  },

  async create(data: CreateDartaRequest): Promise<DartaLetter> {
    const response = await apiClient.post<DartaLetter>('/darta/', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateDartaRequest>): Promise<DartaLetter> {
    const response = await apiClient.patch<DartaLetter>(`/darta/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/darta/${id}/`);
  },

  async getWorkflowHistory(id: string): Promise<WorkflowStep[]> {
    const response = await apiClient.get<WorkflowStep[]>(`/darta/${id}/workflow/`);
    return response.data;
  },

  async performAction(id: string, action: WorkflowActionRequest): Promise<DartaLetter> {
    const response = await apiClient.post<DartaLetter>(`/darta/${id}/action/`, action);
    return response.data;
  },

  async uploadAttachment(id: string, file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.uploadFile<{ id: string; url: string }>(
      `/darta/${id}/attachments/`,
      formData
    );
    return response.data;
  },

  async deleteAttachment(dartaId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/darta/${dartaId}/attachments/${attachmentId}/`);
  },

  async getNextNumber(fiscalYear: string): Promise<{ next_number: string }> {
    const response = await apiClient.get<{ next_number: string }>(
      `/darta/next-number/?fiscal_year=${fiscalYear}`
    );
    return response.data;
  },
};
