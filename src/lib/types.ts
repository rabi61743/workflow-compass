// Core types for the Workflow Management System

export type UserRole = 
  | 'administrator'
  | 'clerk'
  | 'department_officer'
  | 'approving_authority'
  | 'general_staff'
  | 'auditor';

export interface Permission {
  module: string;
  actions: ('view' | 'create' | 'edit' | 'delete' | 'approve')[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  designation: string;
  role: UserRole;
  officeId: string;
  officeName: string;
  avatar?: string;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
}

export interface Office {
  id: string;
  code: string;
  name: string;
  type: 'head_office' | 'regional' | 'branch' | 'department';
  location: string;
  parentId?: string;
  headUserId?: string;
  isActive: boolean;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
}

export type LetterPriority = 'normal' | 'urgent' | 'confidential';
export type LetterStatus = 'draft' | 'pending' | 'in_review' | 'approved' | 'rejected' | 'closed' | 'dispatched' | 'terminated';

export interface DartaLetter {
  id: string;
  dartaNumber: string;
  fiscalYear: string;
  senderName: string;
  senderOrg: string;
  letterDate: string;
  receivedDate: string;
  subject: string;
  priority: LetterPriority;
  confidentiality: 'public' | 'internal' | 'confidential' | 'secret';
  documentType: string;
  status: LetterStatus;
  currentHandler: string;
  currentHandlerName: string;
  attachments: Document[];
  createdAt: string;
  createdBy: string;
}

export interface ChalaniLetter {
  id: string;
  chalaniNumber: string;
  fiscalYear: string;
  receiverName: string;
  receiverOrg: string;
  receiverType: 'internal' | 'external';
  subject: string;
  priority: LetterPriority;
  status: LetterStatus;
  content: string;
  templateId?: string;
  attachments: Document[];
  createdAt: string;
  createdBy: string;
  dispatchedAt?: string;
}

export type WorkflowAction = 
  | 'forward'
  | 'return'
  | 'approve'
  | 'reject'
  | 'delegate'
  | 'terminate'
  | 'archive';

export interface WorkflowStep {
  id: string;
  action: WorkflowAction;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  remarks: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  type: 'task' | 'sla_warning' | 'sla_breach' | 'info';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  linkTo?: string;
}
