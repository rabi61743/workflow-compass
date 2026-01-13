// Notifications API service
import { apiClient } from './client';
import { Notification } from '../types';

interface NotificationListParams {
  page?: number;
  page_size?: number;
  is_read?: boolean;
  type?: 'task' | 'sla_warning' | 'sla_breach' | 'info';
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface NotificationPreferences {
  email_notifications: boolean;
  sla_warnings: boolean;
  task_assignments: boolean;
  status_updates: boolean;
  daily_digest: boolean;
}

export const notificationsApi = {
  async list(params: NotificationListParams = {}): Promise<PaginatedResponse<Notification>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/notifications/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<Notification>>(endpoint);
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>('/notifications/unread-count/');
    return response.data;
  },

  async markAsRead(id: string): Promise<Notification> {
    const response = await apiClient.post<Notification>(`/notifications/${id}/mark-read/`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ updated_count: number }> {
    const response = await apiClient.post<{ updated_count: number }>('/notifications/mark-all-read/');
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/notifications/${id}/`);
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<NotificationPreferences>('/notifications/preferences/');
    return response.data;
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.patch<NotificationPreferences>(
      '/notifications/preferences/',
      preferences
    );
    return response.data;
  },
};

export type { NotificationPreferences };
