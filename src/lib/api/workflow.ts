// Workflow API service
import { apiClient } from './client';
import { WorkflowStep, WorkflowAction } from '../types';

interface WorkflowStats {
  pending_tasks: number;
  completed_today: number;
  overdue_tasks: number;
  sla_breaches_this_week: number;
  total_darta?: number;
  total_chalani?: number;
  darta_by_status?: Record<string, number>;
  chalani_by_status?: Record<string, number>;
}

interface TaskItem {
  id: string;
  document_id: string;
  document_type: 'darta' | 'chalani';
  document_number: string;
  subject: string;
  assigned_at: string;
  due_at: string;
  priority: string;
  is_overdue: boolean;
  from_user: {
    id: string;
    name: string;
  };
}

interface WorkflowActionRequest {
  document_type: 'darta' | 'chalani';
  document_id: string;
  action: WorkflowAction;
  to_user_id?: string;
  remarks: string;
}

export const workflowApi = {
  async getMyTasks(params: { 
    page?: number; 
    status?: 'pending' | 'completed';
    priority?: string;
  } = {}): Promise<{ count: number; results: TaskItem[] }> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/my-tasks/?${queryParams.toString()}`;
    const response = await apiClient.get<{ count: number; results: TaskItem[] }>(endpoint);
    return response.data;
  },

  async getStats(): Promise<WorkflowStats> {
    const response = await apiClient.get<WorkflowStats>('/workflow/stats/');
    return response.data;
  },

  async performAction(request: WorkflowActionRequest): Promise<WorkflowStep> {
    const response = await apiClient.post<WorkflowStep>('/workflow/action/', request);
    return response.data;
  },

  async getHistory(documentType: 'darta' | 'chalani', documentId: string): Promise<WorkflowStep[]> {
    const response = await apiClient.get<WorkflowStep[]>(
      `/workflow/history/${documentType}/${documentId}/`
    );
    return response.data;
  },

  async getAvailableActions(documentType: 'darta' | 'chalani', documentId: string): Promise<{
    actions: WorkflowAction[];
    can_forward: boolean;
    can_approve: boolean;
    can_return: boolean;
  }> {
    const response = await apiClient.get<{
      actions: WorkflowAction[];
      can_forward: boolean;
      can_approve: boolean;
      can_return: boolean;
    }>(`/workflow/available-actions/${documentType}/${documentId}/`);
    return response.data;
  },

  async delegate(taskId: string, toUserId: string, remarks: string): Promise<void> {
    await apiClient.post(`/workflow/tasks/${taskId}/delegate/`, {
      to_user_id: toUserId,
      remarks,
    });
  },

  async getSlaStatus(documentType: 'darta' | 'chalani', documentId: string): Promise<{
    deadline: string;
    hours_remaining: number;
    is_overdue: boolean;
    is_warning: boolean;
  }> {
    const response = await apiClient.get<{
      deadline: string;
      hours_remaining: number;
      is_overdue: boolean;
      is_warning: boolean;
    }>(`/workflow/sla-status/${documentType}/${documentId}/`);
    return response.data;
  },

  // === Hierarchy-based routing ===
  async getNextApprover(userId?: string): Promise<{
    user_id: string;
    user_name: string;
    suggestions: ApproverSuggestion[];
  }> {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await apiClient.get<{
      user_id: string;
      user_name: string;
      suggestions: ApproverSuggestion[];
    }>(`/workflow/next-approver/${params}`);
    return response.data;
  },

  async getDelegations(userId?: string): Promise<DelegationInfo[]> {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await apiClient.get<DelegationInfo[]>(`/workflow/delegate/${params}`);
    return response.data;
  },

  async createDelegation(data: {
    delegate_user_id: string;
    office_id: string;
    end_date?: string;
  }): Promise<{ id: string; message: string }> {
    const response = await apiClient.post<{ id: string; message: string }>('/workflow/delegate/', data);
    return response.data;
  },
};

export interface ApproverSuggestion {
  id: string;
  name: string;
  email: string;
  source: 'reporting_structure' | 'office_head' | 'parent_office_head' | 'designation_approver';
  is_primary?: boolean;
  office_name?: string;
  designation?: string;
}

export interface DelegationInfo {
  id: string;
  delegate_user_id: string;
  delegate_user_name: string;
  office_id: string;
  office_name: string;
  start_date: string | null;
  end_date: string | null;
}

export type { TaskItem, WorkflowStats };
