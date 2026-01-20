// Audit Logs React Query hooks
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-config';
import { auditApi, AuditLog } from '@/lib/api/audit';

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

export function useAuditLogList(params: AuditLogListParams = {}) {
  return useQuery({
    queryKey: queryKeys.auditLogs.list(params),
    queryFn: () => auditApi.list(params),
  });
}

export function useAuditLog(id: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs.all, 'detail', id],
    queryFn: () => auditApi.getById(id),
    enabled: enabled && !!id,
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: [...queryKeys.auditLogs.all, 'stats'],
    queryFn: () => auditApi.getStats(),
  });
}
