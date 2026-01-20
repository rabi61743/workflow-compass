// API Service Layer - Central export
export { apiClient } from './client';
export type { ApiResponse, ApiError } from './client';

export { authApi } from './auth';
export { dartaApi } from './darta';
export { chalaniApi } from './chalani';
export { usersApi } from './users';
export { organizationApi } from './organization';
export type { OfficeHierarchy } from './organization';
export { workflowApi } from './workflow';
export type { TaskItem, WorkflowStats } from './workflow';
export { notificationsApi } from './notifications';
export type { NotificationPreferences } from './notifications';
export { paperlessApi } from './paperless';
export type { 
  PaperlessDocument, 
  PaperlessCorrespondent, 
  PaperlessDocumentType, 
  PaperlessTag,
  PaperlessStatistics 
} from './paperless';

// New API services
export { auditApi } from './audit';
export type { AuditLog } from './audit';
export { templatesApi } from './templates';
export type { LetterTemplate } from './templates';
export { fileTrackingApi } from './file-tracking';
export type { FileTracker, LinkedDocument } from './file-tracking';
export { reportsApi } from './reports';
export type { ReportsData, TrendData, StatusDistribution, DepartmentWorkload, SlaData } from './reports';
export { searchApi } from './search';
export type { SearchResult } from './search';
