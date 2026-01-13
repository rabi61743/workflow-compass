// Organization/Offices API service
import { apiClient } from './client';
import { Office, User } from '../types';

interface OfficeListParams {
  page?: number;
  page_size?: number;
  search?: string;
  type?: string;
  parent_id?: string;
  is_active?: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateOfficeRequest {
  code: string;
  name: string;
  type: 'head_office' | 'regional' | 'branch' | 'department';
  location: string;
  parent_id?: string;
  head_user_id?: string;
}

interface OfficeHierarchy extends Office {
  children: OfficeHierarchy[];
  staff_count: number;
}

export const organizationApi = {
  async list(params: OfficeListParams = {}): Promise<PaginatedResponse<Office>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/organization/offices/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<Office>>(endpoint);
    return response.data;
  },

  async getById(id: string): Promise<Office> {
    const response = await apiClient.get<Office>(`/organization/offices/${id}/`);
    return response.data;
  },

  async create(data: CreateOfficeRequest): Promise<Office> {
    const response = await apiClient.post<Office>('/organization/offices/', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateOfficeRequest>): Promise<Office> {
    const response = await apiClient.patch<Office>(`/organization/offices/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/organization/offices/${id}/`);
  },

  async getHierarchy(): Promise<OfficeHierarchy[]> {
    const response = await apiClient.get<OfficeHierarchy[]>('/organization/hierarchy/');
    return response.data;
  },

  async getStaff(officeId: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(`/organization/offices/${officeId}/staff/`);
    return response.data;
  },

  async assignHead(officeId: string, userId: string): Promise<Office> {
    const response = await apiClient.post<Office>(`/organization/offices/${officeId}/assign-head/`, {
      user_id: userId,
    });
    return response.data;
  },

  async getOfficeTypes(): Promise<{ value: string; label: string }[]> {
    const response = await apiClient.get<{ value: string; label: string }[]>(
      '/organization/office-types/'
    );
    return response.data;
  },

  async activate(id: string): Promise<Office> {
    const response = await apiClient.post<Office>(`/organization/offices/${id}/activate/`);
    return response.data;
  },

  async deactivate(id: string): Promise<Office> {
    const response = await apiClient.post<Office>(`/organization/offices/${id}/deactivate/`);
    return response.data;
  },
};

export type { OfficeHierarchy };
