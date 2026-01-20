import { useState } from 'react';
import { format } from 'date-fns';
import {
  Search,
  Filter,
  Download,
  Eye,
  User,
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
  Loader2,
} from 'lucide-react';
import { useAuditLogList, useAuditLogStats } from '@/hooks/use-audit';
import { useDebounce } from '@/hooks/use-debounce';
import { AuditLog } from '@/lib/api/audit';
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
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { cn } from '@/lib/utils';

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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    log: AuditLog | null;
  }>({ open: false, log: null });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: logsData, isLoading } = useAuditLogList({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    action: actionFilter !== 'all' ? actionFilter : undefined,
    module: moduleFilter !== 'all' ? moduleFilter : undefined,
  });

  const { data: stats } = useAuditLogStats();

  const logs = logsData?.results || [];
  const totalCount = logsData?.count || 0;

  const getActionIcon = (action: string) => {
    return actionIcons[action] || Activity;
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
            <CardTitle className="text-3xl">{stats?.total_today || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Document Actions</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.document_actions || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>User Logins</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats?.user_logins || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Failed Attempts</CardDescription>
            <CardTitle className="text-3xl text-red-600">{stats?.failed_attempts || 0}</CardTitle>
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
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No logs found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => {
                    const ActionIcon = getActionIcon(log.action);
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn('p-2 rounded-lg', actionColors[log.action] || 'bg-gray-100')}>
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
          )}
        </CardContent>
        {totalCount > pageSize && (
          <div className="border-t p-4">
            <DataTablePagination
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
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

              {Object.keys(detailDialog.log.details || {}).length > 0 && (
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
