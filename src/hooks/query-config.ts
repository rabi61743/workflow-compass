// React Query Configuration
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query Keys Factory
export const queryKeys = {
  // Auth
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
  },
  
  // Darta
  darta: {
    all: ['darta'] as const,
    lists: () => [...queryKeys.darta.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.darta.lists(), params] as const,
    details: () => [...queryKeys.darta.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.darta.details(), id] as const,
    workflow: (id: string) => [...queryKeys.darta.all, 'workflow', id] as const,
  },
  
  // Chalani
  chalani: {
    all: ['chalani'] as const,
    lists: () => [...queryKeys.chalani.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.chalani.lists(), params] as const,
    details: () => [...queryKeys.chalani.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.chalani.details(), id] as const,
    workflow: (id: string) => [...queryKeys.chalani.all, 'workflow', id] as const,
  },
  
  // Users
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.users.lists(), params] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    roles: () => [...queryKeys.users.all, 'roles'] as const,
    byOffice: (officeId: string) => [...queryKeys.users.all, 'office', officeId] as const,
  },
  
  // Organization
  organization: {
    all: ['organization'] as const,
    lists: () => [...queryKeys.organization.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.organization.lists(), params] as const,
    details: () => [...queryKeys.organization.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.organization.details(), id] as const,
    hierarchy: () => [...queryKeys.organization.all, 'hierarchy'] as const,
    types: () => [...queryKeys.organization.all, 'types'] as const,
  },
  
  // Workflow
  workflow: {
    all: ['workflow'] as const,
    stats: () => [...queryKeys.workflow.all, 'stats'] as const,
    myTasks: (params: Record<string, any>) => [...queryKeys.workflow.all, 'my-tasks', params] as const,
    history: (type: string, id: string) => [...queryKeys.workflow.all, 'history', type, id] as const,
    slaStatus: (type: string, id: string) => [...queryKeys.workflow.all, 'sla', type, id] as const,
    availableActions: (type: string, id: string) => [...queryKeys.workflow.all, 'actions', type, id] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.notifications.lists(), params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
    preferences: () => [...queryKeys.notifications.all, 'preferences'] as const,
  },
  
  // Paperless
  paperless: {
    all: ['paperless'] as const,
    documents: {
      all: () => [...queryKeys.paperless.all, 'documents'] as const,
      list: (params: Record<string, any>) => [...queryKeys.paperless.documents.all(), 'list', params] as const,
      detail: (id: number) => [...queryKeys.paperless.documents.all(), 'detail', id] as const,
    },
    correspondents: () => [...queryKeys.paperless.all, 'correspondents'] as const,
    documentTypes: () => [...queryKeys.paperless.all, 'document-types'] as const,
    tags: () => [...queryKeys.paperless.all, 'tags'] as const,
    statistics: () => [...queryKeys.paperless.all, 'statistics'] as const,
  },
  
  // Search
  search: {
    all: ['search'] as const,
    results: (query: string, module?: string) => [...queryKeys.search.all, query, module] as const,
  },
  
  // Reports
  reports: {
    all: ['reports'] as const,
    byType: (type: string, params: Record<string, any>) => [...queryKeys.reports.all, type, params] as const,
  },
  
  // Audit Logs
  auditLogs: {
    all: ['audit-logs'] as const,
    list: (params: Record<string, any>) => [...queryKeys.auditLogs.all, 'list', params] as const,
  },
  
  // Files
  files: {
    all: ['files'] as const,
    lists: () => [...queryKeys.files.all, 'list'] as const,
    list: (params: Record<string, any>) => [...queryKeys.files.lists(), params] as const,
    details: () => [...queryKeys.files.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.files.details(), id] as const,
  },
};
