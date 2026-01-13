import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  Download,
  Eye,
  FileText,
  User,
  Calendar,
  Clock,
  Activity,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Forward,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// Mock audit logs
const mockAuditLogs = [
  {
    id: 'log-001',
    action: 'create',
    module: 'darta',
    description: 'Created new Darta #2081-004',
    userId: 'usr-002',
    userName: 'Sita Sharma',
    ipAddress: '192.168.1.100',
    timestamp: '2024-11-13T14:30:00Z',
    details: { dartaNumber: '2081-004', subject: 'New incoming letter' },
  },
  {
    id: 'log-002',
    action: 'forward',
    module: 'darta',
    description: 'Forwarded Darta #2081-001 to Hari Prasad Acharya',
    userId: 'usr-002',
    userName: 'Sita Sharma',
    ipAddress: '192.168.1.100',
    timestamp: '2024-11-13T14:25:00Z',
    details: { dartaNumber: '2081-001', toUser: 'Hari Prasad Acharya' },
  },
  {
    id: 'log-003',
    action: 'approve',
    module: 'chalani',
    description: 'Approved Chalani #CH-2081-002',
    userId: 'usr-004',
    userName: 'Dr. Krishna Bahadur KC',
    ipAddress: '192.168.1.101',
    timestamp: '2024-11-13T11:00:00Z',
    details: { chalaniNumber: 'CH-2081-002' },
  },
  {
    id: 'log-004',
    action: 'login',
    module: 'auth',
    description: 'User logged in successfully',
    userId: 'usr-001',
    userName: 'Ram Bahadur Thapa',
    ipAddress: '192.168.1.102',
    timestamp: '2024-11-13T09:00:00Z',
    details: { browser: 'Chrome 119', os: 'Windows 11' },
  },
  {
    id: 'log-005',
    action: 'edit',
    module: 'users',
    description: 'Updated user permissions for Gita Kumari Rai',
    userId: 'usr-001',
    userName: 'Ram Bahadur Thapa',
    ipAddress: '192.168.1.102',
    timestamp: '2024-11-13T08:45:00Z',
    details: { targetUser: 'Gita Kumari Rai', changes: 'Added darta:create permission' },
  },
  {
    id: 'log-006',
    action: 'delete',
    module: 'darta',
    description: 'Deleted attachment from Darta #2081-002',
    userId: 'usr-003',
    userName: 'Hari Prasad Acharya',
    ipAddress: '192.168.1.103',
    timestamp: '2024-11-12T16:30:00Z',
    details: { dartaNumber: '2081-002', fileName: 'old_document.pdf' },
  },
  {
    id: 'log-007',
    action: 'reject',
    module: 'darta',
    description: 'Rejected Darta #2081-003 with remarks',
    userId: 'usr-004',
    userName: 'Dr. Krishna Bahadur KC',
    ipAddress: '192.168.1.101',
    timestamp: '2024-11-12T15:00:00Z',
    details: { dartaNumber: '2081-003', reason: 'Incomplete documentation' },
  },
  {
    id: 'log-008',
    action: 'logout',
    module: 'auth',
    description: 'User logged out',
    userId: 'usr-002',
    userName: 'Sita Sharma',
    ipAddress: '192.168.1.100',
    timestamp: '2024-11-12T17:30:00Z',
    details: {},
  },
];

const actionIcons: Record<string, React.ElementType> = {
  create: Plus,
  edit: Edit,
  delete: Trash2,
  forward: Forward,
  approve: CheckCircle2,
  reject: XCircle,
  login: LogIn,
  logout: LogOut,
  view: Eye,
};

const actionColors: Record<string, string> = {
  create: 'bg-green-100 text-green-600',
  edit: 'bg-blue-100 text-blue-600',
  delete: 'bg-red-100 text-red-600',
  forward: 'bg-purple-100 text-purple-600',
  approve: 'bg-green-100 text-green-600',
  reject: 'bg-red-100 text-red-600',
  login: 'bg-cyan-100 text-cyan-600',
  logout: 'bg-gray-100 text-gray-600',
  view: 'bg-gray-100 text-gray-600',
};

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    log: typeof mockAuditLogs[0] | null;
  }>({ open: false, log: null });

  const filteredLogs = useMemo(() => {
    return mockAuditLogs.filter((log) => {
      const matchesSearch =
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesAction = actionFilter === 'all' || log.action === actionFilter;
      const matchesModule = moduleFilter === 'all' || log.module === moduleFilter;

      return matchesSearch && matchesAction && matchesModule;
    });
  }, [searchQuery, actionFilter, moduleFilter]);

  const getActionIcon = (action: string) => {
    const Icon = actionIcons[action] || Activity;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Logs Today</CardDescription>
            <CardTitle className="text-3xl">247</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Document Actions</CardDescription>
            <CardTitle className="text-3xl text-blue-600">156</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>User Logins</CardDescription>
            <CardTitle className="text-3xl text-green-600">43</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed Attempts</CardDescription>
            <CardTitle className="text-3xl text-red-600">5</CardTitle>
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
                placeholder="Search logs..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[140px]">
                  <Activity className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="approve">Approve</SelectItem>
                  <SelectItem value="reject">Reject</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                </SelectContent>
              </Select>
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="darta">Darta</SelectItem>
                  <SelectItem value="chalani">Chalani</SelectItem>
                  <SelectItem value="users">Users</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">User</TableHead>
                <TableHead className="hidden lg:table-cell">IP Address</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No logs found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const ActionIcon = getActionIcon(log.action);
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('p-2 rounded-lg', actionColors[log.action])}>
                            <ActionIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium capitalize">{log.action}</p>
                            <Badge variant="outline" className="text-xs">{log.module}</Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm line-clamp-2">{log.description}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{log.userName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm font-mono">{log.ipAddress}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {format(new Date(log.timestamp), 'PP p')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDetailDialog({ open: true, log })}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, log: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>Complete information about this action</DialogDescription>
          </DialogHeader>

          {detailDialog.log && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Action</p>
                  <p className="font-medium capitalize">{detailDialog.log.action}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Module</p>
                  <Badge variant="outline">{detailDialog.log.module}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">User</p>
                  <p className="font-medium">{detailDialog.log.userName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">User ID</p>
                  <p className="font-mono text-xs">{detailDialog.log.userId}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">IP Address</p>
                  <p className="font-mono">{detailDialog.log.ipAddress}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Timestamp</p>
                  <p className="font-medium">{format(new Date(detailDialog.log.timestamp), 'PPpp')}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Description</p>
                <p className="text-sm">{detailDialog.log.description}</p>
              </div>

              {Object.keys(detailDialog.log.details).length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Additional Details</p>
                  <div className="bg-muted rounded-lg p-3">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(detailDialog.log.details, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
