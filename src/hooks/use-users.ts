// User Management Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';
import type { UserRole, Permission } from '@/lib/types';

interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: UserRole;
  office_id?: string;
  is_active?: boolean;
}

// List users
export function useUserList(params: UserListParams = {}) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => usersApi.list(params),
  });
}

// Get single user by ID
export function useUser(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id && enabled,
  });
}

// Get users by office
export function useUsersByOffice(officeId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.users.byOffice(officeId),
    queryFn: () => usersApi.getByOffice(officeId),
    enabled: !!officeId && enabled,
  });
}

// Get available roles
export function useUserRoles() {
  return useQuery({
    queryKey: queryKeys.users.roles(),
    queryFn: () => usersApi.getRoles(),
    staleTime: 1000 * 60 * 60, // 1 hour - roles don't change often
  });
}

// Create user mutation
export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create user');
    },
  });
}

// Update user mutation
export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update user');
    },
  });
}

// Delete user mutation
export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user');
    },
  });
}

// Activate user
export function useActivateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.activate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User activated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to activate user');
    },
  });
}

// Deactivate user
export function useDeactivateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: usersApi.deactivate,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.lists() });
      toast.success('User deactivated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to deactivate user');
    },
  });
}

// Reset user password
export function useResetUserPassword() {
  return useMutation({
    mutationFn: usersApi.resetPassword,
    onSuccess: () => {
      toast.success('Password reset email sent');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
}

// Update user permissions
export function useUpdateUserPermissions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, permissions }: { id: string; permissions: Permission[] }) => 
      usersApi.updatePermissions(id, permissions),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
      toast.success('Permissions updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions');
    },
  });
}
