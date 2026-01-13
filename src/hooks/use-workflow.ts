// Workflow Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';
import type { WorkflowAction } from '@/lib/types';

interface MyTasksParams {
  page?: number;
  status?: 'pending' | 'completed';
  priority?: string;
}

// Get workflow stats (dashboard)
export function useWorkflowStats() {
  return useQuery({
    queryKey: queryKeys.workflow.stats(),
    queryFn: () => workflowApi.getStats(),
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// Get current user's tasks
export function useMyTasks(params: MyTasksParams = {}) {
  return useQuery({
    queryKey: queryKeys.workflow.myTasks(params),
    queryFn: () => workflowApi.getMyTasks(params),
    refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes
  });
}

// Get workflow history for a document
export function useWorkflowHistory(documentType: 'darta' | 'chalani', documentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workflow.history(documentType, documentId),
    queryFn: () => workflowApi.getHistory(documentType, documentId),
    enabled: !!documentId && enabled,
  });
}

// Get available actions for a document
export function useAvailableActions(documentType: 'darta' | 'chalani', documentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workflow.availableActions(documentType, documentId),
    queryFn: () => workflowApi.getAvailableActions(documentType, documentId),
    enabled: !!documentId && enabled,
  });
}

// Get SLA status
export function useSlaStatus(documentType: 'darta' | 'chalani', documentId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.workflow.slaStatus(documentType, documentId),
    queryFn: () => workflowApi.getSlaStatus(documentType, documentId),
    enabled: !!documentId && enabled,
    refetchInterval: 1000 * 60, // Refetch every minute for real-time SLA updates
  });
}

// Perform workflow action
export function useWorkflowAction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: workflowApi.performAction,
    onSuccess: (_, request) => {
      const { document_type, document_id } = request;
      
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.myTasks({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.history(document_type, document_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.availableActions(document_type, document_id) });
      
      if (document_type === 'darta') {
        queryClient.invalidateQueries({ queryKey: queryKeys.darta.detail(document_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.darta.lists() });
      } else {
        queryClient.invalidateQueries({ queryKey: queryKeys.chalani.detail(document_id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.chalani.lists() });
      }
      
      toast.success('Action completed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to perform action');
    },
  });
}

// Delegate task
export function useDelegateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, toUserId, remarks }: { taskId: string; toUserId: string; remarks: string }) => 
      workflowApi.delegate(taskId, toUserId, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.myTasks({}) });
      queryClient.invalidateQueries({ queryKey: queryKeys.workflow.stats() });
      toast.success('Task delegated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delegate task');
    },
  });
}
