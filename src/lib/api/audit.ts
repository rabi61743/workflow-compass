// Audit Logs API service
import { apiClient } from './client';

export interface AuditLog {
  id: string;
  action: string;
  module: string;
  description: string;
  userId: string;
  userName: string;
  ipAddress: string;
  timestamp: string;
  details: Record<string, any>;
  userAgent?: string;
}

interface AuditLogListParams {
  page?: number;
  page_size?: number;
  search?: string;
  action?: string;
  module?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

interface AuditStats {
  total_today: number;
  document_actions: number;
  user_logins: number;
  failed_attempts: number;
}

// Transform snake_case to camelCase
const transformAuditLog = (data: any): AuditLog => ({
  id: data.id,
  action: data.action,
  module: data.module,
  description: data.description,
  userId: data.user_id || data.userId,
  userName: data.user_name || data.userName,
  ipAddress: data.ip_address || data.ipAddress,
  timestamp: data.timestamp || data.created_at,
  details: data.details || {},
  userAgent: data.user_agent || data.userAgent,
});

export const auditApi = {
  async list(params: AuditLogListParams = {}): Promise<PaginatedResponse<AuditLog>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/audit-logs/?${queryParams.toString()}`;
    const response = await apiClient.get<PaginatedResponse<any>>(endpoint);
    return {
      ...response.data,
      results: response.data.results.map(transformAuditLog),
    };
  },

  async getById(id: string): Promise<AuditLog> {
    const response = await apiClient.get<any>(`/workflow/audit-logs/${id}/`);
    return transformAuditLog(response.data);
  },

  async getStats(): Promise<AuditStats> {
    const response = await apiClient.get<AuditStats>('/workflow/audit-logs/stats/');
    return response.data;
  },

  async export(params: AuditLogListParams = {}): Promise<Blob> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/audit-logs/export/?${queryParams.toString()}`;
    // Note: For blob responses, we'll need to handle this differently
    // For now, return empty blob - actual implementation may need fetch API
    const response = await apiClient.get<any>(endpoint);
    return new Blob([JSON.stringify(response.data)], { type: 'application/json' });
  },
};
