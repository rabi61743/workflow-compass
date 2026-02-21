// Organization/Offices API service
import { apiClient } from './client';
import { Office, OfficeTreeNode, UserOfficeAssignment, ReportingStructure, RecipientSearchResult, OfficeMember, Designation } from '../types';

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
  name_nepali?: string;
  type: 'head_office' | 'regional' | 'branch' | 'department' | 'section' | 'unit';
  location: string;
  order?: number;
  email?: string;
  phone?: string;
  parent?: string;
  head?: string;
}

interface CreateAssignmentRequest {
  user: string;
  office: string;
  designation?: string;
  assignment_type: string;
  is_office_head?: boolean;
  reporting_to?: string;
  end_date?: string;
}

interface RecipientSearchParams {
  q?: string;
  office_id?: string;
  include_children?: boolean;
  type?: 'user' | 'office' | 'all';
}

export const organizationApi = {
  // === Offices ===
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

  async getTree(): Promise<OfficeTreeNode[]> {
    const response = await apiClient.get<OfficeTreeNode[]>('/organization/offices/tree/');
    return response.data;
  },

  async getMembers(officeId: string, includeChildren = false): Promise<UserOfficeAssignment[]> {
    const params = includeChildren ? '?include_children=true' : '';
    const response = await apiClient.get<UserOfficeAssignment[]>(
      `/organization/offices/${officeId}/members/${params}`
    );
    return response.data;
  },

  async getDescendants(officeId: string): Promise<Office[]> {
    const response = await apiClient.get<Office[]>(`/organization/offices/${officeId}/descendants/`);
    return response.data;
  },

  async getAncestors(officeId: string): Promise<Office[]> {
    const response = await apiClient.get<Office[]>(`/organization/offices/${officeId}/ancestors/`);
    return response.data;
  },

  async searchRecipients(params: RecipientSearchParams = {}): Promise<RecipientSearchResult[]> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get<RecipientSearchResult[]>(
      `/organization/offices/search_recipients/?${queryParams.toString()}`
    );
    return response.data;
  },

  // === Designations ===
  async listDesignations(params: { office?: string; is_global?: boolean } = {}): Promise<PaginatedResponse<Designation>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get<PaginatedResponse<Designation>>(
      `/organization/designations/?${queryParams.toString()}`
    );
    return response.data;
  },

  async createDesignation(data: Partial<Designation>): Promise<Designation> {
    const response = await apiClient.post<Designation>('/organization/designations/', data);
    return response.data;
  },

  async updateDesignation(id: string, data: Partial<Designation>): Promise<Designation> {
    const response = await apiClient.patch<Designation>(`/organization/designations/${id}/`, data);
    return response.data;
  },

  async deleteDesignation(id: string): Promise<void> {
    await apiClient.delete(`/organization/designations/${id}/`);
  },

  // === Assignments ===
  async listAssignments(params: { user?: string; office?: string } = {}): Promise<PaginatedResponse<UserOfficeAssignment>> {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });
    const response = await apiClient.get<PaginatedResponse<UserOfficeAssignment>>(
      `/organization/assignments/?${queryParams.toString()}`
    );
    return response.data;
  },

  async createAssignment(data: CreateAssignmentRequest): Promise<UserOfficeAssignment> {
    const response = await apiClient.post<UserOfficeAssignment>('/organization/assignments/', data);
    return response.data;
  },

  async updateAssignment(id: string, data: Partial<CreateAssignmentRequest>): Promise<UserOfficeAssignment> {
    const response = await apiClient.patch<UserOfficeAssignment>(`/organization/assignments/${id}/`, data);
    return response.data;
  },

  async deleteAssignment(id: string): Promise<void> {
    await apiClient.delete(`/organization/assignments/${id}/`);
  },

  async getAssignmentsByUser(userId: string): Promise<UserOfficeAssignment[]> {
    const response = await apiClient.get<UserOfficeAssignment[]>(
      `/organization/assignments/by_user/?user_id=${userId}`
    );
    return response.data;
  },

  // === Reporting Structure ===
  async getReportingChain(userId: string): Promise<{ id: string; name: string; email: string }[]> {
    const response = await apiClient.get<{ id: string; name: string; email: string }[]>(
      `/organization/reporting/chain/?user_id=${userId}`
    );
    return response.data;
  },

  async createReporting(data: Partial<ReportingStructure>): Promise<ReportingStructure> {
    const response = await apiClient.post<ReportingStructure>('/organization/reporting/', data);
    return response.data;
  },

  async deleteReporting(id: string): Promise<void> {
    await apiClient.delete(`/organization/reporting/${id}/`);
  },

  // Legacy compatibility
  async getHierarchy(): Promise<OfficeTreeNode[]> {
    return this.getTree();
  },

  async getStaff(officeId: string): Promise<any[]> {
    return this.getMembers(officeId);
  },

  async assignHead(officeId: string, userId: string): Promise<Office> {
    return this.update(officeId, { head: userId });
  },

  async getOfficeTypes(): Promise<{ value: string; label: string }[]> {
    return [
      { value: 'head_office', label: 'Head Office' },
      { value: 'regional', label: 'Regional Office' },
      { value: 'branch', label: 'Branch Office' },
      { value: 'department', label: 'Department' },
      { value: 'section', label: 'Section' },
      { value: 'unit', label: 'Unit' },
    ];
  },

  async activate(id: string): Promise<Office> {
    return this.update(id, {} as any);
  },

  async deactivate(id: string): Promise<Office> {
    return this.update(id, {} as any);
  },
};

export type { OfficeTreeNode as OfficeHierarchy };
