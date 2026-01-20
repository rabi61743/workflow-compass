// Reports API service
import { apiClient } from './client';

export interface TrendData {
  month: string;
  darta: number;
  chalani: number;
}

export interface StatusDistribution {
  name: string;
  value: number;
  color: string;
}

export interface DepartmentWorkload {
  department: string;
  darta: number;
  chalani: number;
}

export interface SlaData {
  name: string;
  value: number;
  color: string;
}

export interface WeeklyActivity {
  day: string;
  documents: number;
}

export interface ReportStats {
  totalDarta: number;
  dartaChange: string;
  totalChalani: number;
  chalaniChange: string;
  pendingActions: number;
  pendingChange: string;
  slaBreaches: number;
  slaBreachChange: string;
}

export interface ReportsData {
  stats: ReportStats;
  trends: TrendData[];
  statusDistribution: StatusDistribution[];
  departmentWorkload: DepartmentWorkload[];
  slaData: SlaData[];
  weeklyActivity: WeeklyActivity[];
  averageProcessingTime: number;
  slaComplianceRate: number;
}

interface ReportParams {
  date_range?: 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year';
  date_from?: string;
  date_to?: string;
  office_id?: string;
}

// Transform backend data to frontend format
const transformReportsData = (data: any): ReportsData => ({
  stats: {
    totalDarta: data.stats?.total_darta || 0,
    dartaChange: data.stats?.darta_change || '+0%',
    totalChalani: data.stats?.total_chalani || 0,
    chalaniChange: data.stats?.chalani_change || '+0%',
    pendingActions: data.stats?.pending_actions || 0,
    pendingChange: data.stats?.pending_change || '-0%',
    slaBreaches: data.stats?.sla_breaches || 0,
    slaBreachChange: data.stats?.sla_breach_change || '+0',
  },
  trends: data.trends || [],
  statusDistribution: data.status_distribution || [],
  departmentWorkload: data.department_workload || [],
  slaData: data.sla_data || [],
  weeklyActivity: data.weekly_activity || [],
  averageProcessingTime: data.average_processing_time || 0,
  slaComplianceRate: data.sla_compliance_rate || 0,
});

export const reportsApi = {
  async getOverview(params: ReportParams = {}): Promise<ReportsData> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/reports/?${queryParams.toString()}`;
    const response = await apiClient.get<any>(endpoint);
    return transformReportsData(response.data);
  },

  async getMonthlyTrends(params: ReportParams = {}): Promise<TrendData[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', 'monthly');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/reports/?${queryParams.toString()}`;
    const response = await apiClient.get<any>(endpoint);
    return response.data.trends || [];
  },

  async getDepartmentWorkload(params: ReportParams = {}): Promise<DepartmentWorkload[]> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', 'department');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/reports/?${queryParams.toString()}`;
    const response = await apiClient.get<any>(endpoint);
    return response.data.department_workload || [];
  },

  async getSlaMetrics(params: ReportParams = {}): Promise<{
    slaData: SlaData[];
    complianceRate: number;
    averageProcessingTime: number;
  }> {
    const queryParams = new URLSearchParams();
    queryParams.append('type', 'sla');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/reports/?${queryParams.toString()}`;
    const response = await apiClient.get<any>(endpoint);
    return {
      slaData: response.data.sla_data || [],
      complianceRate: response.data.sla_compliance_rate || 0,
      averageProcessingTime: response.data.average_processing_time || 0,
    };
  },

  async exportReport(params: ReportParams = {}, format: 'pdf' | 'excel' = 'excel'): Promise<Blob> {
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    
    const endpoint = `/workflow/reports/export/?${queryParams.toString()}`;
    // Note: For blob responses, we'll need to handle this differently
    // For now, return empty blob - actual implementation may need fetch API
    const response = await apiClient.get<any>(endpoint);
    return new Blob([JSON.stringify(response.data)], { type: 'application/json' });
  },
};
