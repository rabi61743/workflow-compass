import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  FolderOpen,
  FolderClosed,
  FileText,
  Link2,
  Calendar,
  Tag,
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowUpRight,
  Send,
  Loader2,
} from 'lucide-react';
import { useFileTrackerList, useFileTrackerStats, useCreateFileTracker, useUpdateFileTracker, useDeleteFileTracker, useCloseFileTracker, useReopenFileTracker } from '@/hooks/use-file-tracking';
import { useDebounce } from '@/hooks/use-debounce';
import { FileTracker } from '@/lib/api/file-tracking';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { cn } from '@/lib/utils';

const categories = ['Budget', 'Projects', 'Audit', 'HR', 'Legal', 'Operations', 'General'];

interface FileFormData {
  title: string;
  description: string;
  category: string;
}

export default function FileTracking() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  const [fileDialog, setFileDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    file: FileTracker | null;
  }>({ open: false, mode: 'create', file: null });
  
  const [formData, setFormData] = useState<FileFormData>({
    title: '',
    description: '',
    category: '',
  });
  
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    file: FileTracker | null;
  }>({ open: false, file: null });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // API hooks
  const { data: filesData, isLoading } = useFileTrackerList({
    page,
    page_size: pageSize,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  });
  const { data: stats } = useFileTrackerStats();
  const createFile = useCreateFileTracker();
  const updateFile = useUpdateFileTracker();
  const deleteFile = useDeleteFileTracker();
  const closeFile = useCloseFileTracker();
  const reopenFile = useReopenFileTracker();

  const files = filesData?.results || [];
  const totalCount = filesData?.count || 0;

  const openCreateDialog = () => {
    setFormData({ title: '', description: '', category: '' });
    setFileDialog({ open: true, mode: 'create', file: null });
  };

  const openEditDialog = (file: FileTracker) => {
    setFormData({
      title: file.title,
      description: file.description,
      category: file.category,
    });
    setFileDialog({ open: true, mode: 'edit', file });
  };

  const closeFileDialog = () => {
    setFileDialog({ open: false, mode: 'create', file: null });
    setFormData({ title: '', description: '', category: '' });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.category) {
      return;
    }

    if (fileDialog.mode === 'create') {
      createFile.mutate({
        title: formData.title,
        description: formData.description,
        category: formData.category,
      }, {
        onSuccess: () => closeFileDialog(),
      });
    } else if (fileDialog.file) {
      updateFile.mutate({
        id: fileDialog.file.id,
        data: {
          title: formData.title,
          description: formData.description,
          category: formData.category,
        },
      }, {
        onSuccess: () => closeFileDialog(),
      });
    }
  };

  const handleToggleStatus = (file: FileTracker) => {
    if (file.status === 'open') {
      closeFile.mutate(file.id);
    } else {
      reopenFile.mutate(file.id);
    }
  };

  const handleDelete = (id: string) => {
    deleteFile.mutate(id);
  };

  const navigateToDocument = (type: string, id: string) => {
    navigate(`/${type}/${id}`);
  };

  const isSubmitting = createFile.isPending || updateFile.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">File Tracking</h1>
          <p className="text-muted-foreground">Manage case files and link related documents</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New File Tracker
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Files</CardDescription>
            <CardTitle className="text-3xl">{stats?.total || totalCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Files</CardDescription>
            <CardTitle className="text-3xl text-green-600">{stats?.open || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Closed Files</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">{stats?.closed || 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Linked Docs</CardDescription>
            <CardTitle className="text-3xl text-blue-600">{stats?.totalLinkedDocs || 0}</CardTitle>
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
                placeholder="Search files..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[150px]">
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Linked Docs</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No files found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  files.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            file.status === 'open' ? "bg-green-100" : "bg-gray-100"
                          )}>
                            {file.status === 'open' ? (
                              <FolderOpen className="h-5 w-5 text-green-600" />
                            ) : (
                              <FolderClosed className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{file.fileNumber}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1">{file.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{file.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-1">
                          <Link2 className="h-4 w-4 text-muted-foreground" />
                          <span>{file.dartaCount + file.chalaniCount}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(file.createdAt), 'PP')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={file.status === 'open' ? 'default' : 'secondary'}>
                          {file.status === 'open' ? 'Open' : 'Closed'}
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
                            <DropdownMenuItem onClick={() => setDetailDialog({ open: true, file })}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditDialog(file)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(file)}>
                              {file.status === 'open' ? (
                                <>
                                  <FolderClosed className="mr-2 h-4 w-4" />
                                  Close File
                                </>
                              ) : (
                                <>
                                  <FolderOpen className="mr-2 h-4 w-4" />
                                  Reopen File
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(file.id)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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

      {/* Create/Edit Dialog */}
      <Dialog open={fileDialog.open} onOpenChange={(open) => !open && closeFileDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {fileDialog.mode === 'create' ? 'Create File Tracker' : 'Edit File Tracker'}
            </DialogTitle>
            <DialogDescription>
              {fileDialog.mode === 'create'
                ? 'Create a new file to track related documents'
                : 'Update file tracker information'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter file title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter file description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeFileDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : fileDialog.mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialog.open} onOpenChange={(open) => !open && setDetailDialog({ open: false, file: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailDialog.file?.status === 'open' ? (
                <FolderOpen className="h-5 w-5 text-green-600" />
              ) : (
                <FolderClosed className="h-5 w-5 text-gray-600" />
              )}
              {detailDialog.file?.fileNumber}
            </DialogTitle>
            <DialogDescription>{detailDialog.file?.title}</DialogDescription>
          </DialogHeader>

          {detailDialog.file && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-6 py-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <Badge variant="outline">{detailDialog.file.category}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant={detailDialog.file.status === 'open' ? 'default' : 'secondary'}>
                      {detailDialog.file.status === 'open' ? 'Open' : 'Closed'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-medium">{format(new Date(detailDialog.file.createdAt), 'PPP')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Created By</p>
                    <p className="font-medium">{detailDialog.file.createdBy}</p>
                  </div>
                </div>

                {detailDialog.file.description && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm">{detailDialog.file.description}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Linked Documents ({detailDialog.file.linkedDocuments?.length || 0})
                  </h4>
                  {detailDialog.file.linkedDocuments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No documents linked to this file</p>
                  ) : (
                    <div className="space-y-2">
                      {detailDialog.file.linkedDocuments?.map((doc) => (
                        <div
                          key={`${doc.type}-${doc.id}`}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => navigateToDocument(doc.type, doc.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "p-1.5 rounded",
                              doc.type === 'darta' ? "bg-blue-100" : "bg-purple-100"
                            )}>
                              {doc.type === 'darta' ? (
                                <FileText className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Send className="h-4 w-4 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{doc.number}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{doc.subject}</p>
                            </div>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
