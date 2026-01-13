// Workflow API service
import { apiClient } from './client';
import { WorkflowStep, WorkflowAction } from '../types';

interface WorkflowStats {
  pending_tasks: number;
  completed_today: number;
  overdue_tasks: number;
  sla_breaches_this_week: number;
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
};

export type { TaskItem, WorkflowStats };
