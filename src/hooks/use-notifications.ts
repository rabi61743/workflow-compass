// Notifications Query Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { queryKeys } from './query-config';
import { toast } from 'sonner';

interface NotificationListParams {
  page?: number;
  page_size?: number;
  is_read?: boolean;
  type?: 'task' | 'sla_warning' | 'sla_breach' | 'info';
}

// List notifications
export function useNotificationList(params: NotificationListParams = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: () => notificationsApi.list(params),
    refetchInterval: 1000 * 60, // Refetch every minute
  });
}

// Get unread count
export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 1000 * 30, // Refetch every 30 seconds
  });
}

// Get notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: queryKeys.notifications.preferences(),
    queryFn: () => notificationsApi.getPreferences(),
  });
}

// Mark single notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark as read');
    },
  });
}

// Mark all notifications as read
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsApi.markAllAsRead,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      toast.success(`${data.updated_count} notifications marked as read`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark all as read');
    },
  });
}

// Delete notification
export function useDeleteNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.lists() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete notification');
    },
  });
}

// Update notification preferences
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationsApi.updatePreferences,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.preferences() });
      toast.success('Notification preferences updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update preferences');
    },
  });
}
