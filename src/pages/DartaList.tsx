import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDartaList } from '@/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Filter, Eye, Paperclip, AlertCircle, Loader2 } from 'lucide-react';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LetterStatus, LetterPriority, DartaLetter } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';

export default function DartaList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Build query params
  const queryParams = useMemo(() => ({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? (statusFilter as LetterStatus) : undefined,
    priority: priorityFilter !== 'all' ? (priorityFilter as LetterPriority) : undefined,
  }), [page, pageSize, debouncedSearch, statusFilter, priorityFilter]);

  const { data, isLoading, isError, error } = useDartaList(queryParams);

  // Reset to first page when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handlePriorityChange = (value: string) => {
    setPriorityFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      case 'terminated':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Terminated</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'confidential':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Confidential</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  // Map API response to expected format (snake_case to camelCase)
  const letters: DartaLetter[] = useMemo(() => {
    if (!data?.results) return [];
    return data.results.map((item: any) => ({
      id: item.id,
      dartaNumber: item.darta_number,
      fiscalYear: item.fiscal_year,
      senderName: item.sender_name,
      senderOrg: item.sender_org,
      letterDate: item.letter_date,
      receivedDate: item.received_date,
      subject: item.subject,
      priority: item.priority,
      confidentiality: item.confidentiality,
      documentType: item.document_type_name || item.document_type,
      status: item.status,
      currentHandler: item.current_handler,
      currentHandlerName: item.current_handler_name || '',
      attachments: item.attachments || [],
      createdAt: item.created_at,
      createdBy: item.created_by,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Darta (Incoming Letters)</h1>
          <p className="text-muted-foreground">
            Manage and track all incoming correspondence
          </p>
        </div>
        <Button onClick={() => navigate('/darta/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Darta
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter incoming letters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject, darta number, or sender..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={handlePriorityChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="confidential">Confidential</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isError && (
            <Alert variant="destructive" className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to load letters: {(error as Error)?.message || 'Unknown error'}
              </AlertDescription>
            </Alert>
          )}

          {isLoading ? (
            <TableSkeleton columns={8} rows={10} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Darta No.</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Sender</TableHead>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead className="w-[100px]">Priority</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Handler</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                        No letters found
                      </TableCell>
                    </TableRow>
                  ) : (
                    letters.map((letter) => (
                      <TableRow
                        key={letter.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/darta/${letter.id}`)}
                      >
                        <TableCell className="font-medium">{letter.dartaNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="line-clamp-1">{letter.subject}</span>
                            {letter.attachments.length > 0 && (
                              <Paperclip className="h-3 w-3 text-muted-foreground" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{letter.senderOrg}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(letter.receivedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{getPriorityBadge(letter.priority)}</TableCell>
                        <TableCell>{getStatusBadge(letter.status)}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {letter.currentHandlerName.split(' ')[0] || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/darta/${letter.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              
              {data && (
                <DataTablePagination
                  currentPage={page}
                  pageSize={pageSize}
                  totalCount={data.count}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
