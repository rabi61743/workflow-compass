// Organization Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';

interface OfficeListParams {
  page?: number;
  page_size?: number;
  search?: string;
  type?: string;
  parent_id?: string;
  is_active?: boolean;
}

// List offices
export function useOfficeList(params: OfficeListParams = {}) {
  return useQuery({
    queryKey: queryKeys.organization.list(params),
    queryFn: () => organizationApi.list(params),
  });
}

// Get single office by ID
export function useOffice(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.organization.detail(id),
    queryFn: () => organizationApi.getById(id),
    enabled: !!id && enabled,
  });
}

// Get office hierarchy (tree structure)
export function useOfficeHierarchy() {
  return useQuery({
    queryKey: queryKeys.organization.hierarchy(),
    queryFn: () => organizationApi.getTree(),
    staleTime: 1000 * 60 * 10,
  });
}

// Get office types
export function useOfficeTypes() {
  return useQuery({
    queryKey: queryKeys.organization.types(),
    queryFn: () => organizationApi.getOfficeTypes(),
    staleTime: 1000 * 60 * 60,
  });
}

// Get members in an office
export function useOfficeMembers(officeId: string, includeChildren = false, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.organization.detail(officeId), 'members', includeChildren],
    queryFn: () => organizationApi.getMembers(officeId, includeChildren),
    enabled: !!officeId && enabled,
  });
}

// Legacy alias
export function useOfficeStaff(officeId: string, enabled = true) {
  return useOfficeMembers(officeId, false, enabled);
}

// Search recipients
export function useRecipientSearch(params: { q?: string; office_id?: string; include_children?: boolean; type?: 'user' | 'office' | 'all' }, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.organization.all, 'recipients', params],
    queryFn: () => organizationApi.searchRecipients(params),
    enabled: enabled && !!(params.q || params.office_id),
    staleTime: 1000 * 30,
  });
}

// Get user assignments
export function useUserAssignments(userId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.organization.all, 'assignments', userId],
    queryFn: () => organizationApi.getAssignmentsByUser(userId),
    enabled: !!userId && enabled,
  });
}

// Get reporting chain
export function useReportingChain(userId: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.organization.all, 'reporting-chain', userId],
    queryFn: () => organizationApi.getReportingChain(userId),
    enabled: !!userId && enabled,
  });
}

// Designations
export function useDesignations(params: { office?: string; is_global?: boolean } = {}) {
  return useQuery({
    queryKey: [...queryKeys.organization.all, 'designations', params],
    queryFn: () => organizationApi.listDesignations(params),
  });
}

// Create office mutation
export function useCreateOffice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: organizationApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.hierarchy() });
      toast.success('Office created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create office');
    },
  });
}

// Update office mutation
export function useUpdateOffice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => organizationApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.hierarchy() });
      toast.success('Office updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update office');
    },
  });
}

// Delete office mutation
export function useDeleteOffice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: organizationApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.hierarchy() });
      toast.success('Office deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete office');
    },
  });
}

// Activate office
export function useActivateOffice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: organizationApi.activate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.lists() });
      toast.success('Office activated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate office');
    },
  });
}

// Deactivate office
export function useDeactivateOffice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: organizationApi.deactivate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.lists() });
      toast.success('Office deactivated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate office');
    },
  });
}

// Assign office head
export function useAssignOfficeHead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ officeId, userId }: { officeId: string; userId: string }) => 
      organizationApi.assignHead(officeId, userId),
    onSuccess: (_, { officeId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.detail(officeId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.lists() });
      toast.success('Office head assigned');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign office head');
    },
  });
}

// Create assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationApi.createAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.all });
      toast.success('Assignment created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create assignment');
    },
  });
}

// Delete assignment
export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationApi.deleteAssignment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.all });
      toast.success('Assignment removed');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove assignment');
    },
  });
}

// Create designation
export function useCreateDesignation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: organizationApi.createDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organization.all });
      toast.success('Designation created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create designation');
    },
  });
}
