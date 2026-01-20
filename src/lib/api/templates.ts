// Letter Templates API service
import { apiClient } from './client';

export interface LetterTemplate {
  id: string;
  name: string;
  nameNepali?: string;
  category: string;
  content: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

interface TemplateListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  is_active?: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateTemplateRequest {
  name: string;
  name_nepali?: string;
  category: string;
  content: string;
}

interface UpdateTemplateRequest {
  name?: string;
  name_nepali?: string;
  category?: string;
  content?: string;
  is_active?: boolean;
}

// Transform snake_case to camelCase
const transformTemplate = (data: any): LetterTemplate => ({
  id: data.id,
  name: data.name,
  nameNepali: data.name_nepali,
  category: data.category,
  content: data.content,
  isActive: data.is_active,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
  createdBy: data.created_by,
});

export const templatesApi = {
  async list(params: TemplateListParams = {}): Promise<PaginatedResponse<LetterTemplate>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/chalani/templates/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<any>>(endpoint);
    return {
      ...response.data,
      results: response.data.results.map(transformTemplate),
    };
  },

  async getById(id: string): Promise<LetterTemplate> {
    const response = await apiClient.get<any>(`/chalani/templates/${id}/`);
    return transformTemplate(response.data);
  },

  async create(data: CreateTemplateRequest): Promise<LetterTemplate> {
    const response = await apiClient.post<any>('/chalani/templates/', data);
    return transformTemplate(response.data);
  },

  async update(id: string, data: UpdateTemplateRequest): Promise<LetterTemplate> {
    const response = await apiClient.patch<any>(`/chalani/templates/${id}/`, data);
    return transformTemplate(response.data);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/chalani/templates/${id}/`);
  },

  async duplicate(id: string): Promise<LetterTemplate> {
    const response = await apiClient.post<any>(`/chalani/templates/${id}/duplicate/`);
    return transformTemplate(response.data);
  },

  async getCategories(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/chalani/templates/categories/');
    return response.data;
  },
};
