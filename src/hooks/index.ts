// Consolidated hooks export
// Query configuration and keys
export { queryClient, queryKeys } from './query-config';

// Darta hooks
export {
  useDartaList,
  useDarta,
  useDartaWorkflow,
  useCreateDarta,
  useUpdateDarta,
  useDeleteDarta,
  useDartaAction,
  useUploadDartaAttachment,
  useDeleteDartaAttachment,
  useNextDartaNumber,
} from './use-darta';

// Chalani hooks
export {
  useChalaniList,
  useChalani,
  useChalaniWorkflow,
  useCreateChalani,
  useUpdateChalani,
  useDeleteChalani,
  useChalaniAction,
  useDispatchChalani,
  useUploadChalaniAttachment,
  useDeleteChalaniAttachment,
  useNextChalaniNumber,
} from './use-chalani';

// User hooks
export {
  useUserList,
  useUser,
  useUsersByOffice,
  useUserRoles,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useActivateUser,
  useDeactivateUser,
  useResetUserPassword,
  useUpdateUserPermissions,
} from './use-users';

// Organization hooks
export {
  useOfficeList,
  useOffice,
  useOfficeHierarchy,
  useOfficeTypes,
  useOfficeStaff,
  useOfficeMembers,
  useRecipientSearch,
  useUserAssignments,
  useReportingChain,
  useDesignations,
  useCreateOffice,
  useUpdateOffice,
  useDeleteOffice,
  useActivateOffice,
  useDeactivateOffice,
  useAssignOfficeHead,
  useCreateAssignment,
  useDeleteAssignment,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
} from './use-organization';

// Workflow hooks
export {
  useWorkflowStats,
  useMyTasks,
  useWorkflowHistory,
  useAvailableActions,
  useSlaStatus,
  useWorkflowAction,
  useDelegateTask,
  useNextApprover,
  useDelegations,
  useCreateDelegation,
} from './use-workflow';

// Notification hooks
export {
  useNotificationList,
  useUnreadNotificationCount,
  useNotificationPreferences,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useUpdateNotificationPreferences,
} from './use-notifications';

// Paperless hooks
export {
  usePaperlessDocuments,
  usePaperlessDocument,
  usePaperlessSearch,
  usePaperlessCorrespondents,
  usePaperlessDocumentTypes,
  usePaperlessTags,
  usePaperlessStatistics,
  useUploadPaperlessDocument,
  useUpdatePaperlessDocument,
  useDeletePaperlessDocument,
  useCreatePaperlessCorrespondent,
  useCreatePaperlessDocumentType,
  useCreatePaperlessTag,
  useBulkEditPaperlessDocuments,
  useDownloadPaperlessDocument,
} from './use-paperless';

// Audit hooks
export {
  useAuditLogList,
  useAuditLog,
  useAuditLogStats,
} from './use-audit';

// Template hooks
export {
  useTemplateList,
  useTemplate,
  useTemplateCategories,
  useCreateTemplate,
  useUpdateTemplate,
  useDeleteTemplate,
  useDuplicateTemplate,
} from './use-templates';

// File Tracking hooks
export {
  useFileTrackerList,
  useFileTracker,
  useFileTrackerStats,
  useFileTrackerCategories,
  useCreateFileTracker,
  useUpdateFileTracker,
  useDeleteFileTracker,
  useCloseFileTracker,
  useReopenFileTracker,
  useLinkDocument,
  useUnlinkDocument,
} from './use-file-tracking';

// Reports hooks
export {
  useReportsOverview,
  useMonthlyTrends,
  useDepartmentWorkload,
  useSlaMetrics,
} from './use-reports';

// Search hooks
export {
  useGlobalSearch,
  useQuickSearch,
  useSearchSuggestions,
} from './use-search';

// Re-export existing hooks
export { useIsMobile } from './use-mobile';
export { useToast, toast } from './use-toast';
export { useDebounce } from './use-debounce';
