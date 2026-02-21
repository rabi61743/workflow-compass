/**
 * Demo mode interceptor: Returns mock data when backend is unreachable.
 * Maps API endpoints to mock responses.
 */
import { mockUsers, mockOffices, mockDartaLetters, mockChalaniLetters, mockNotifications, mockDashboardStats } from './mock-data';
import type { OfficeTreeNode } from './types';

function buildOfficeTree(offices: typeof mockOffices): OfficeTreeNode[] {
  const map = new Map<string, OfficeTreeNode>();
  offices.forEach(o => map.set(o.id, { ...o, children: [], memberCount: Math.floor(Math.random() * 15) + 2 }));
  const roots: OfficeTreeNode[] = [];
  offices.forEach(o => {
    const node = map.get(o.id)!;
    if (o.parentId && map.has(o.parentId)) {
      map.get(o.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

const paginate = <T>(items: T[], page = 1, pageSize = 20) => ({
  count: items.length,
  next: null,
  previous: null,
  results: items.slice((page - 1) * pageSize, page * pageSize),
});

// Match endpoint and return mock data
export function getDemoResponse(endpoint: string, method: string): any | null {
  const ep = endpoint.replace(/\?.*$/, ''); // strip query params

  // Workflow stats
  if (ep.includes('/workflow/stats')) {
    return {
      total_darta: mockDashboardStats.totalDarta,
      total_chalani: mockDashboardStats.totalChalani,
      pending_tasks: mockDashboardStats.pendingDarta + mockDashboardStats.pendingChalani,
      overdue_tasks: mockDashboardStats.overdueTasks,
      completed_today: mockDashboardStats.completedThisWeek,
      sla_breaches_this_week: 2,
      darta_by_status: { pending: mockDashboardStats.pendingDarta, in_review: 8, approved: 45, closed: 80 },
      chalani_by_status: { pending: mockDashboardStats.pendingChalani, in_review: 5, dispatched: 42, closed: 30 },
    };
  }

  // My tasks
  if (ep.includes('/workflow/my-tasks')) {
    return paginate(mockDartaLetters.map(d => ({
      id: d.id,
      document_id: d.id,
      document_type: 'darta',
      document_number: d.dartaNumber,
      subject: d.subject,
      priority: d.priority,
      status: d.status,
      from_user: { id: d.createdBy, name: mockUsers.find(u => u.id === d.createdBy)?.name || 'System' },
      assigned_at: d.createdAt,
      is_overdue: d.priority === 'urgent',
    })));
  }

  // Darta list
  if (ep.match(/\/darta\/letters\/?$/) && method === 'GET') {
    return paginate(mockDartaLetters);
  }

  // Darta detail
  if (ep.match(/\/darta\/letters\/[\w-]+\/?$/)) {
    const id = ep.split('/').filter(Boolean).pop();
    return mockDartaLetters.find(d => d.id === id) || mockDartaLetters[0];
  }

  // Chalani list
  if (ep.match(/\/chalani\/letters\/?$/) && method === 'GET') {
    return paginate(mockChalaniLetters);
  }

  // Organization offices list
  if (ep.match(/\/organization\/offices\/?$/) && method === 'GET') {
    return paginate(mockOffices);
  }

  // Organization tree
  if (ep.includes('/organization/offices/tree')) {
    return buildOfficeTree(mockOffices);
  }

  // Organization members
  if (ep.includes('/members')) {
    return mockUsers.slice(0, 3).map(u => ({
      id: `assign-${u.id}`,
      userId: u.id,
      userName: u.name,
      userEmail: u.email,
      officeId: u.officeId,
      officeName: u.officeName,
      officeCode: 'NTC',
      officeType: 'department',
      designationId: '',
      designationName: u.designation,
      assignmentType: 'primary',
      isOfficeHead: false,
      startDate: '2024-01-01',
      isActive: true,
      createdAt: u.createdAt,
      updatedAt: u.createdAt,
    }));
  }

  // Designations
  if (ep.includes('/organization/designations')) {
    return paginate([
      { id: 'desig-1', name: 'Executive Director', nameNepali: 'कार्यकारी निर्देशक', level: 1, canApprove: true, canDispatch: true, isGlobal: true, isActive: true },
      { id: 'desig-2', name: 'Department Head', nameNepali: 'विभाग प्रमुख', level: 2, canApprove: true, canDispatch: true, isGlobal: true, isActive: true },
      { id: 'desig-3', name: 'Senior Officer', nameNepali: 'वरिष्ठ अधिकृत', level: 3, canApprove: true, canDispatch: false, isGlobal: true, isActive: true },
      { id: 'desig-4', name: 'Officer', nameNepali: 'अधिकृत', level: 4, canApprove: false, canDispatch: false, isGlobal: true, isActive: true },
      { id: 'desig-5', name: 'Clerk', nameNepali: 'सहायक', level: 5, canApprove: false, canDispatch: true, isGlobal: true, isActive: true },
    ]);
  }

  // Users list
  if (ep.match(/\/users\/?$/) && method === 'GET') {
    return paginate(mockUsers);
  }

  // User roles
  if (ep.includes('/users/roles')) {
    return [
      { value: 'administrator', label: 'Administrator' },
      { value: 'clerk', label: 'Clerk/Registrar' },
      { value: 'department_officer', label: 'Department Officer' },
      { value: 'approving_authority', label: 'Approving Authority' },
      { value: 'general_staff', label: 'General Staff' },
      { value: 'auditor', label: 'Auditor' },
    ];
  }

  // Notifications
  if (ep.match(/\/notifications\/?$/) && method === 'GET') {
    return paginate(mockNotifications);
  }

  // Unread count
  if (ep.includes('/notifications/unread-count') || ep.includes('/unread_count')) {
    return { count: mockNotifications.filter(n => !n.isRead).length };
  }

  // Notification preferences
  if (ep.includes('/notifications/preferences')) {
    return { email: true, in_app: true, sla_warnings: true, task_assignments: true };
  }

  // Search
  if (ep.includes('/search')) {
    return paginate([]);
  }

  // Reports
  if (ep.includes('/reports')) {
    return {
      overview: mockDashboardStats,
      monthly_trends: [],
      department_workload: [],
    };
  }

  // Audit logs
  if (ep.includes('/audit')) {
    return paginate([
      { id: 'log-1', user_email: 'admin@ntc.net.np', action: 'LOGIN', module: 'auth', details: {}, timestamp: new Date().toISOString() },
      { id: 'log-2', user_email: 'clerk@ntc.net.np', action: 'CREATE_DARTA', module: 'darta', details: { darta_number: '2081-001' }, timestamp: new Date().toISOString() },
    ]);
  }

  // File trackers
  if (ep.includes('/files') || ep.includes('/file-tracker')) {
    return paginate([]);
  }

  // Templates
  if (ep.includes('/templates')) {
    return paginate([]);
  }

  // Workflow actions / history
  if (ep.includes('/workflow/history') || ep.includes('/workflow/actions')) {
    return [];
  }

  // SLA status
  if (ep.includes('/workflow/sla')) {
    return { status: 'on_track', deadline: new Date(Date.now() + 86400000).toISOString(), hours_remaining: 24 };
  }

  // Next approver
  if (ep.includes('/workflow/next-approver')) {
    return [mockUsers[3]]; // director
  }

  // Delegations
  if (ep.includes('/workflow/delegations')) {
    return [];
  }

  // Office types
  if (ep.includes('/organization/office-types')) {
    return [
      { value: 'head_office', label: 'Head Office' },
      { value: 'regional', label: 'Regional Office' },
      { value: 'branch', label: 'Branch Office' },
      { value: 'department', label: 'Department' },
      { value: 'section', label: 'Section' },
      { value: 'unit', label: 'Unit' },
    ];
  }

  // Assignments by user
  if (ep.includes('/assignments')) {
    return paginate([]);
  }

  // Reporting chain
  if (ep.includes('/reporting/chain')) {
    return [mockUsers[3]]; // director as supervisor
  }

  // Recipient search
  if (ep.includes('/search_recipients')) {
    return mockUsers.map(u => ({
      id: u.id,
      type: 'user' as const,
      name: u.name,
      subtitle: u.designation,
      officeId: u.officeId,
      officeName: u.officeName,
      officeCode: 'NTC',
      userId: u.id,
      designation: u.designation,
      isOfficeHead: false,
    }));
  }

  // Paperless
  if (ep.includes('/paperless')) {
    if (ep.includes('/statistics')) return { total_documents: 0, total_correspondents: 0 };
    return paginate([]);
  }

  return null;
}
