import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  KeyRound,
  UserCheck,
  UserX,
  Shield,
  Building,
  Briefcase,
  Crown,
  X,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserList, useCreateUser, useUpdateUser, useDeleteUser, useActivateUser, useDeactivateUser, useResetUserPassword } from '@/hooks/use-users';
import { useOfficeList, useUserAssignments, useDesignations, useCreateAssignment, useDeleteAssignment } from '@/hooks/use-organization';
import { useDebounce } from '@/hooks/use-debounce';
import { User, UserRole, Permission, UserOfficeAssignment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { cn } from '@/lib/utils';

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'clerk', label: 'Clerk' },
  { value: 'department_officer', label: 'Department Officer' },
  { value: 'approving_authority', label: 'Approving Authority' },
  { value: 'general_staff', label: 'General Staff' },
  { value: 'auditor', label: 'Auditor' },
];

const modulePermissions = [
  { module: 'darta', label: 'Darta (Incoming Letters)' },
  { module: 'chalani', label: 'Chalani (Outgoing Letters)' },
  { module: 'users', label: 'User Management' },
  { module: 'offices', label: 'Office Management' },
  { module: 'reports', label: 'Reports & Analytics' },
  { module: 'audit', label: 'Audit Logs' },
];

const actionOptions = ['view', 'create', 'edit', 'delete', 'approve'] as const;

const assignmentTypeOptions = [
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'deputation', label: 'Deputation' },
  { value: 'acting', label: 'Acting/Temporary' },
];

interface UserFormData {
  name: string;
  email: string;
  designation: string;
  role: UserRole;
  officeId: string;
  password: string;
  confirmPassword: string;
  permissions: Permission[];
}

const defaultFormData: UserFormData = {
  name: '',
  email: '',
  designation: '',
  role: 'general_staff',
  officeId: '',
  password: '',
  confirmPassword: '',
  permissions: [],
};

// --- Assignment Detail Sheet ---
function UserAssignmentSheet({
  user,
  open,
  onClose,
}: {
  user: User | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: assignments, isLoading } = useUserAssignments(user?.id || '', open && !!user);
  const { data: officesData } = useOfficeList({});
  const { data: designationsData } = useDesignations();
  const createAssignment = useCreateAssignment();
  const deleteAssignment = useDeleteAssignment();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    office: '',
    designation: '',
    assignmentType: 'secondary',
    isOfficeHead: false,
  });

  const offices = officesData?.results || [];
  const designations = designationsData?.results || [];

  const handleAddAssignment = () => {
    if (!user || !newAssignment.office) return;
    createAssignment.mutate({
      user: user.id,
      office: newAssignment.office,
      designation: newAssignment.designation || undefined,
      assignment_type: newAssignment.assignmentType,
      is_office_head: newAssignment.isOfficeHead,
    }, {
      onSuccess: () => {
        setShowAddForm(false);
        setNewAssignment({ office: '', designation: '', assignmentType: 'secondary', isOfficeHead: false });
      },
    });
  };

  const handleRemoveAssignment = (assignmentId: string) => {
    deleteAssignment.mutate(assignmentId);
  };

  if (!user) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Office Assignments
          </SheetTitle>
          <SheetDescription>
            Manage office assignments for <strong>{user.name}</strong>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Current Assignments */}
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Current Assignments ({(assignments as UserOfficeAssignment[] | undefined)?.length || 0})</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>

          {/* Add Assignment Form */}
          {showAddForm && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Office *</Label>
                  <Select value={newAssignment.office} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, office: v }))}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Select office" />
                    </SelectTrigger>
                    <SelectContent>
                      {offices.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Designation</Label>
                    <Select value={newAssignment.designation} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, designation: v }))}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {designations.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Type</Label>
                    <Select value={newAssignment.assignmentType} onValueChange={(v) => setNewAssignment(prev => ({ ...prev, assignmentType: v }))}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {assignmentTypeOptions.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="isHead"
                    checked={newAssignment.isOfficeHead}
                    onCheckedChange={(c) => setNewAssignment(prev => ({ ...prev, isOfficeHead: c as boolean }))}
                  />
                  <Label htmlFor="isHead" className="text-xs cursor-pointer">Office Head</Label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddAssignment} disabled={!newAssignment.office || createAssignment.isPending}>
                    {createAssignment.isPending ? 'Adding...' : 'Add Assignment'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          <ScrollArea className="h-[400px]">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (assignments as UserOfficeAssignment[] | undefined) && (assignments as UserOfficeAssignment[]).length > 0 ? (
              <div className="space-y-2">
                {(assignments as UserOfficeAssignment[]).map((assignment) => (
                  <div
                    key={assignment.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{assignment.officeName}</p>
                        {assignment.isOfficeHead && <Crown className="h-3 w-3 text-amber-500" />}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{assignment.designationName || 'No designation'}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {assignment.assignmentType}
                        </Badge>
                      </div>
                    </div>
                    {assignment.assignmentType !== 'primary' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive"
                        onClick={() => handleRemoveAssignment(assignment.id)}
                        disabled={deleteAssignment.isPending}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                No office assignments found
              </p>
            )}
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function UserManagement() {
  const { hasRole, hasPermission } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  const [userDialog, setUserDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    user: User | null;
  }>({ open: false, mode: 'create', user: null });
  
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [assignmentSheet, setAssignmentSheet] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  // API hooks
  const { data: usersData, isLoading } = useUserList({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    role: roleFilter !== 'all' ? roleFilter as UserRole : undefined,
    is_active: statusFilter === 'all' ? undefined : statusFilter === 'active',
  });
  
  const { data: officesData } = useOfficeList({});
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const activateUser = useActivateUser();
  const deactivateUser = useDeactivateUser();
  const resetPassword = useResetUserPassword();

  const canManageUsers = hasRole(['administrator']) || hasPermission('users', 'create');
  
  const users = usersData?.results || [];
  const totalUsers = usersData?.count || 0;
  const offices = officesData?.results || [];

  const getRoleBadge = (role: UserRole) => {
    const variants: Record<UserRole, string> = {
      administrator: 'bg-purple-100 text-purple-800',
      clerk: 'bg-blue-100 text-blue-800',
      department_officer: 'bg-green-100 text-green-800',
      approving_authority: 'bg-amber-100 text-amber-800',
      general_staff: 'bg-gray-100 text-gray-800',
      auditor: 'bg-cyan-100 text-cyan-800',
    };
    
    const labels: Record<UserRole, string> = {
      administrator: 'Admin',
      clerk: 'Clerk',
      department_officer: 'Officer',
      approving_authority: 'Authority',
      general_staff: 'Staff',
      auditor: 'Auditor',
    };

    return (
      <Badge className={cn('font-medium', variants[role])}>
        {labels[role]}
      </Badge>
    );
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setUserDialog({ open: true, mode: 'create', user: null });
  };

  const openEditDialog = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      designation: user.designation,
      role: user.role,
      officeId: user.officeId,
      password: '',
      confirmPassword: '',
      permissions: user.permissions,
    });
    setUserDialog({ open: true, mode: 'edit', user });
  };

  const closeUserDialog = () => {
    setUserDialog({ open: false, mode: 'create', user: null });
    setFormData(defaultFormData);
  };

  const handlePermissionChange = (module: string, action: string, checked: boolean) => {
    setFormData((prev) => {
      const existingPermission = prev.permissions.find((p) => p.module === module);
      
      if (existingPermission) {
        if (checked) {
          return {
            ...prev,
            permissions: prev.permissions.map((p) =>
              p.module === module
                ? { ...p, actions: [...p.actions, action as any] }
                : p
            ),
          };
        } else {
          const newActions = existingPermission.actions.filter((a) => a !== action);
          if (newActions.length === 0) {
            return {
              ...prev,
              permissions: prev.permissions.filter((p) => p.module !== module),
            };
          }
          return {
            ...prev,
            permissions: prev.permissions.map((p) =>
              p.module === module ? { ...p, actions: newActions } : p
            ),
          };
        }
      } else if (checked) {
        return {
          ...prev,
          permissions: [...prev.permissions, { module, actions: [action as any] }],
        };
      }
      return prev;
    });
  };

  const hasPermissionAction = (module: string, action: string) => {
    const permission = formData.permissions.find((p) => p.module === module);
    return permission?.actions.includes(action as any) ?? false;
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.designation || !formData.officeId) {
      return;
    }

    if (userDialog.mode === 'create') {
      if (!formData.password || formData.password.length < 8) {
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        return;
      }
      
      createUser.mutate({
        email: formData.email,
        name: formData.name,
        designation: formData.designation,
        role: formData.role,
        office_id: formData.officeId,
        password: formData.password,
        permissions: formData.permissions,
      }, {
        onSuccess: () => closeUserDialog(),
      });
    } else if (userDialog.user) {
      updateUser.mutate({
        id: userDialog.user.id,
        data: {
          email: formData.email,
          name: formData.name,
          designation: formData.designation,
          role: formData.role,
          office_id: formData.officeId,
          permissions: formData.permissions,
        },
      }, {
        onSuccess: () => closeUserDialog(),
      });
    }
  };

  const handleToggleStatus = (user: User) => {
    if (user.isActive) {
      deactivateUser.mutate(user.id);
    } else {
      activateUser.mutate(user.id);
    }
  };

  const handleResetPassword = (user: User) => {
    resetPassword.mutate(user.id);
  };

  const handleDelete = () => {
    if (!deleteDialog.user) return;
    deleteUserMutation.mutate(deleteDialog.user.id, {
      onSuccess: () => setDeleteDialog({ open: false, user: null }),
    });
  };

  const isSubmitting = createUser.isPending || updateUser.isPending;

  // Calculate stats from the data
  const activeCount = users.filter(u => u.isActive).length;
  const adminCount = users.filter(u => u.role === 'administrator').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and their permissions</p>
        </div>
        {canManageUsers && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{totalUsers}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Users</CardDescription>
            <CardTitle className="text-3xl text-green-600">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Administrators</CardDescription>
            <CardTitle className="text-3xl text-purple-600">{adminCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Offices</CardDescription>
            <CardTitle className="text-3xl">{offices.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[160px]">
                  <Shield className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roleOptions.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Office</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No users found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {user.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getRoleBadge(user.role)}
                          <p className="text-xs text-muted-foreground">{user.designation}</p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{user.officeName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant={user.isActive ? 'default' : 'secondary'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAssignmentSheet({ open: true, user })}>
                              <Briefcase className="mr-2 h-4 w-4" />
                              Office Assignments
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(user)}>
                              {user.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteDialog({ open: true, user })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalUsers > pageSize && (
          <div className="border-t p-4">
            <DataTablePagination
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalUsers}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={userDialog.open} onOpenChange={(open) => !open && closeUserDialog()}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {userDialog.mode === 'create' ? 'Create User' : 'Edit User'}
            </DialogTitle>
            <DialogDescription>
              {userDialog.mode === 'create'
                ? 'Add a new user to the system'
                : 'Update user details and permissions'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="font-medium">Basic Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation *</Label>
                    <Input
                      id="designation"
                      placeholder="Enter designation"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role *</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="office">Primary Office *</Label>
                    <Select
                      value={formData.officeId}
                      onValueChange={(value) => setFormData({ ...formData, officeId: value })}
                    >
                      <SelectTrigger id="office">
                        <SelectValue placeholder="Select office" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map((office) => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Password (only for create) */}
              {userDialog.mode === 'create' && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-medium">Password</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="password">Password *</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password *</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          placeholder="Confirm password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Permissions */}
              <Separator />
              <div className="space-y-4">
                <h4 className="font-medium">Module Permissions</h4>
                <div className="space-y-4">
                  {modulePermissions.map((mod) => (
                    <div key={mod.module} className="space-y-2">
                      <Label className="text-sm font-medium">{mod.label}</Label>
                      <div className="flex flex-wrap gap-4">
                        {actionOptions.map((action) => (
                          <div key={action} className="flex items-center space-x-2">
                            <Checkbox
                              id={`${mod.module}-${action}`}
                              checked={hasPermissionAction(mod.module, action)}
                              onCheckedChange={(checked) =>
                                handlePermissionChange(mod.module, action, checked as boolean)
                              }
                            />
                            <Label
                              htmlFor={`${mod.module}-${action}`}
                              className="text-sm capitalize cursor-pointer"
                            >
                              {action}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={closeUserDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : userDialog.mode === 'create' ? 'Create User' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => !open && setDeleteDialog({ open: false, user: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteDialog.user?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUserMutation.isPending}>
              {deleteUserMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Assignment Sheet */}
      <UserAssignmentSheet
        user={assignmentSheet.user}
        open={assignmentSheet.open}
        onClose={() => setAssignmentSheet({ open: false, user: null })}
      />
    </div>
  );
}
