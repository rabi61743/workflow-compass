// Users API service
import { apiClient } from './client';
import { User, UserRole, Permission } from '../types';

interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: UserRole;
  office_id?: string;
  is_active?: boolean;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface CreateUserRequest {
  email: string;
  name: string;
  designation: string;
  role: UserRole;
  office_id: string;
  password: string;
  permissions?: Permission[];
}

interface UpdateUserRequest {
  email?: string;
  name?: string;
  designation?: string;
  role?: UserRole;
  office_id?: string;
  permissions?: Permission[];
  is_active?: boolean;
}

export const usersApi = {
  async list(params: UserListParams = {}): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/users/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<User>>(endpoint);
    return response.data;
  },

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}/`);
    return response.data;
  },

  async create(data: CreateUserRequest): Promise<User> {
    const response = await apiClient.post<User>('/users/', data);
    return response.data;
  },

  async update(id: string, data: UpdateUserRequest): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}/`);
  },

  async activate(id: string): Promise<User> {
    const response = await apiClient.post<User>(`/users/${id}/activate/`);
    return response.data;
  },

  async deactivate(id: string): Promise<User> {
    const response = await apiClient.post<User>(`/users/${id}/deactivate/`);
    return response.data;
  },

  async resetPassword(id: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/users/${id}/reset-password/`);
    return response.data;
  },

  async updatePermissions(id: string, permissions: Permission[]): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}/permissions/`, { permissions });
    return response.data;
  },

  async getByOffice(officeId: string): Promise<User[]> {
    const response = await apiClient.get<User[]>(`/users/by-office/${officeId}/`);
    return response.data;
  },

  async getRoles(): Promise<{ value: UserRole; label: string }[]> {
    const response = await apiClient.get<{ value: UserRole; label: string }[]>('/users/roles/');
    return response.data;
  },
};
