// Reports React Query hooks
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './query-config';
import { reportsApi } from '@/lib/api/reports';

interface ReportParams {
  date_range?: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year';
  date_from?: string;
  date_to?: string;
  office_id?: string;
}

export function useReportsOverview(params: ReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.byType('overview', params),
    queryFn: () => reportsApi.getOverview(params),
  });
}

export function useMonthlyTrends(params: ReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.byType('trends', params),
    queryFn: () => reportsApi.getMonthlyTrends(params),
  });
}

export function useDepartmentWorkload(params: ReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.byType('department', params),
    queryFn: () => reportsApi.getDepartmentWorkload(params),
  });
}

export function useSlaMetrics(params: ReportParams = {}) {
  return useQuery({
    queryKey: queryKeys.reports.byType('sla', params),
    queryFn: () => reportsApi.getSlaMetrics(params),
  });
}
