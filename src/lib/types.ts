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
  nameNepali?: string;
  type: 'head_office' | 'regional' | 'branch' | 'department' | 'section' | 'unit';
  location: string;
  order?: number;
  email?: string;
  phone?: string;
  path?: string;
  depth?: number;
  parentId?: string;
  parentName?: string;
  headUserId?: string;
  headName?: string;
  employeeCount?: number;
  memberCount?: number;
  isActive: boolean;
}

export interface OfficeTreeNode extends Office {
  children: OfficeTreeNode[];
  memberCount: number;
}

export interface Designation {
  id: string;
  name: string;
  nameNepali?: string;
  officeId?: string;
  level: number;
  canApprove: boolean;
  canDispatch: boolean;
  isGlobal: boolean;
  isActive: boolean;
}

export type AssignmentType = 'primary' | 'secondary' | 'deputation' | 'acting';

export interface UserOfficeAssignment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  officeId: string;
  officeName: string;
  officeCode: string;
  officeType: string;
  designationId?: string;
  designationName: string;
  assignmentType: AssignmentType;
  isOfficeHead: boolean;
  reportingToId?: string;
  reportingToName?: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReportingStructure {
  id: string;
  subordinateId: string;
  subordinateName: string;
  supervisorId: string;
  supervisorName: string;
  isPrimary: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
}

export interface RecipientSearchResult {
  id: string;
  type: 'user' | 'office' | 'designation';
  name: string;
  subtitle: string;
  officeId: string | null;
  officeName: string;
  officeCode: string;
  userId: string | null;
  designation: string;
  isOfficeHead: boolean;
}

export interface OfficeMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  designationName: string;
  designationLevel: number;
  assignmentType: AssignmentType;
  isOfficeHead: boolean;
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
