// Chalani (Outgoing Letters) API service
import { apiClient } from './client';
import { ChalaniLetter, WorkflowStep, LetterPriority, LetterStatus } from '../types';

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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateChalaniRequest {
  receiver_name: string;
  receiver_org: string;
  receiver_type: 'internal' | 'external';
  subject: string;
  content: string;
  priority: LetterPriority;
  template_id?: string;
  reference_darta_id?: string;
  cc_recipients?: string[];
}

interface WorkflowActionRequest {
  action: string;
  to_user_id?: string;
  remarks: string;
}

export const chalaniApi = {
  async list(params: ChalaniListParams = {}): Promise<PaginatedResponse<ChalaniLetter>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/chalani/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<ChalaniLetter>>(endpoint);
    return response.data;
  },

  async getById(id: string): Promise<ChalaniLetter> {
    const response = await apiClient.get<ChalaniLetter>(`/chalani/${id}/`);
    return response.data;
  },

  async create(data: CreateChalaniRequest): Promise<ChalaniLetter> {
    const response = await apiClient.post<ChalaniLetter>('/chalani/', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateChalaniRequest>): Promise<ChalaniLetter> {
    const response = await apiClient.patch<ChalaniLetter>(`/chalani/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/chalani/${id}/`);
  },

  async getWorkflowHistory(id: string): Promise<WorkflowStep[]> {
    const response = await apiClient.get<WorkflowStep[]>(`/chalani/${id}/workflow/`);
    return response.data;
  },

  async performAction(id: string, action: WorkflowActionRequest): Promise<ChalaniLetter> {
    const response = await apiClient.post<ChalaniLetter>(`/chalani/${id}/action/`, action);
    return response.data;
  },

  async dispatch(id: string, dispatchDetails: { method: string; remarks?: string }): Promise<ChalaniLetter> {
    const response = await apiClient.post<ChalaniLetter>(`/chalani/${id}/dispatch/`, dispatchDetails);
    return response.data;
  },

  async uploadAttachment(id: string, file: File): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.uploadFile<{ id: string; url: string }>(
      `/chalani/${id}/attachments/`,
      formData
    );
    return response.data;
  },

  async deleteAttachment(chalaniId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`/chalani/${chalaniId}/attachments/${attachmentId}/`);
  },

  async getNextNumber(fiscalYear: string): Promise<{ next_number: string }> {
    const response = await apiClient.get<{ next_number: string }>(
      `/chalani/next-number/?fiscal_year=${fiscalYear}`
    );
    return response.data;
  },
};
