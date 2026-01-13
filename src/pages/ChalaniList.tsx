import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChalaniList } from '@/hooks';
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
import { Plus, Search, Filter, Eye, ExternalLink, Building2, AlertCircle } from 'lucide-react';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { TableSkeleton } from '@/components/ui/loading-skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { LetterStatus, ChalaniLetter } from '@/lib/types';
import { useDebounce } from '@/hooks/use-debounce';

export default function ChalaniList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [receiverTypeFilter, setReceiverTypeFilter] = useState<string>('all');
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
    receiver_type: receiverTypeFilter !== 'all' ? (receiverTypeFilter as 'internal' | 'external') : undefined,
  }), [page, pageSize, debouncedSearch, statusFilter, receiverTypeFilter]);

  const { data, isLoading, isError, error } = useChalaniList(queryParams);

  // Reset to first page when filters change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleReceiverTypeChange = (value: string) => {
    setReceiverTypeFilter(value);
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
      case 'pending':
        return <Badge variant="secondary">Draft</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>;
      case 'dispatched':
      case 'closed':
        return <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Dispatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getReceiverTypeBadge = (type: string) => {
    if (type === 'internal') {
      return (
        <Badge variant="outline" className="gap-1">
          <Building2 className="h-3 w-3" />
          Internal
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <ExternalLink className="h-3 w-3" />
        External
      </Badge>
    );
  };

  // Map API response to expected format (snake_case to camelCase)
  const letters: ChalaniLetter[] = useMemo(() => {
    if (!data?.results) return [];
    return data.results.map((item: any) => ({
      id: item.id,
      chalaniNumber: item.chalani_number || '-',
      fiscalYear: item.fiscal_year,
      receiverName: item.receiver_name,
      receiverOrg: item.receiver_org || item.receiver_office_name || '',
      receiverType: item.receiver_type,
      subject: item.subject,
      priority: item.priority,
      status: item.status,
      content: item.content,
      templateId: item.template,
      attachments: item.attachments || [],
      createdAt: item.created_at,
      createdBy: item.created_by,
      dispatchedAt: item.dispatched_at,
    }));
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chalani (Outgoing Letters)</h1>
          <p className="text-muted-foreground">
            Create and manage outgoing correspondence
          </p>
        </div>
        <Button onClick={() => navigate('/chalani/new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Chalani
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Search and filter outgoing letters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by subject, chalani number, or receiver..."
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
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="dispatched">Dispatched</SelectItem>
                </SelectContent>
              </Select>
              <Select value={receiverTypeFilter} onValueChange={handleReceiverTypeChange}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Receiver" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Receivers</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                  <SelectItem value="external">External</SelectItem>
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
            <TableSkeleton columns={7} rows={10} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Chalani No.</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Receiver</TableHead>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Created</TableHead>
                    <TableHead className="w-[80px] text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {letters.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                        No letters found
                      </TableCell>
                    </TableRow>
                  ) : (
                    letters.map((letter) => (
                      <TableRow
                        key={letter.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/chalani/${letter.id}`)}
                      >
                        <TableCell className="font-medium">{letter.chalaniNumber}</TableCell>
                        <TableCell>
                          <span className="line-clamp-1">{letter.subject}</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {letter.receiverOrg || letter.receiverName}
                        </TableCell>
                        <TableCell>{getReceiverTypeBadge(letter.receiverType)}</TableCell>
                        <TableCell>{getStatusBadge(letter.status)}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(letter.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/chalani/${letter.id}`);
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
