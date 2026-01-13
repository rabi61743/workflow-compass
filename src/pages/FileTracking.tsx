import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Search,
  Plus,
  FolderOpen,
  FolderClosed,
  FileText,
  Link2,
  Clock,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  ArrowUpRight,
  Calendar,
  Tag,
  Filter,
} from 'lucide-react';
import { mockDartaLetters, mockChalaniLetters } from '@/lib/mock-data';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mock file trackers
const mockFileTrackers = [
  {
    id: 'file-001',
    fileNumber: 'F-2081-001',
    title: 'Annual Budget Proposal FY 2081/82',
    description: 'Budget planning and allocation documents for the upcoming fiscal year',
    category: 'Budget',
    status: 'open',
    createdAt: '2024-10-15T10:00:00Z',
    createdBy: 'Hari Prasad Acharya',
    linkedDocuments: [
      { type: 'darta', id: 'darta-001', number: '2081-001', subject: 'Request for Annual Report Submission' },
      { type: 'chalani', id: 'chalani-001', number: 'CH-2081-001', subject: 'Annual Report Submission FY 2080/81' },
    ],
  },
  {
    id: 'file-002',
    fileNumber: 'F-2081-002',
    title: 'Infrastructure Development Project',
    description: 'Documents related to network infrastructure upgrade project',
    category: 'Projects',
    status: 'open',
    createdAt: '2024-11-01T09:00:00Z',
    createdBy: 'Ram Bahadur Thapa',
    linkedDocuments: [
      { type: 'darta', id: 'darta-002', number: '2081-002', subject: 'Electricity Bill Dispute Resolution' },
    ],
  },
  {
    id: 'file-003',
    fileNumber: 'F-2081-003',
    title: 'Q3 Audit Documentation',
    description: 'Internal audit findings and responses for Q3 2081',
    category: 'Audit',
    status: 'closed',
    createdAt: '2024-11-08T14:00:00Z',
    createdBy: 'Bishnu Prasad Poudel',
    linkedDocuments: [
      { type: 'darta', id: 'darta-003', number: '2081-003', subject: 'Quarterly Audit Findings' },
    ],
  },
];

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
  
  const [fileDialog, setFileDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    file: typeof mockFileTrackers[0] | null;
  }>({ open: false, mode: 'create', file: null });
  
  const [formData, setFormData] = useState<FileFormData>({
    title: '',
    description: '',
    category: '',
  });
  
  const [detailDialog, setDetailDialog] = useState<{
    open: boolean;
    file: typeof mockFileTrackers[0] | null;
  }>({ open: false, file: null });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredFiles = useMemo(() => {
    return mockFileTrackers.filter((file) => {
      const matchesSearch =
        file.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.fileNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || file.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || file.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [searchQuery, statusFilter, categoryFilter]);

  const openCreateDialog = () => {
    setFormData({ title: '', description: '', category: '' });
    setFileDialog({ open: true, mode: 'create', file: null });
  };

  const openEditDialog = (file: typeof mockFileTrackers[0]) => {
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
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(fileDialog.mode === 'create' ? 'File tracker created' : 'File tracker updated');
      closeFileDialog();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (file: typeof mockFileTrackers[0]) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success(`File ${file.status === 'open' ? 'closed' : 'reopened'} successfully`);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const navigateToDocument = (type: string, id: string) => {
    navigate(`/${type}/${id}`);
  };

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
            <CardTitle className="text-3xl">{mockFileTrackers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Files</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {mockFileTrackers.filter((f) => f.status === 'open').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Closed Files</CardDescription>
            <CardTitle className="text-3xl text-muted-foreground">
              {mockFileTrackers.filter((f) => f.status === 'closed').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Linked Docs</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              {mockFileTrackers.reduce((sum, f) => sum + f.linkedDocuments.length, 0)}
            </CardTitle>
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
              {filteredFiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No files found matching your criteria
                  </TableCell>
                </TableRow>
              ) : (
                filteredFiles.map((file) => (
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
                        <span>{file.linkedDocuments.length}</span>
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
                          <DropdownMenuItem className="text-destructive">
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
        </CardContent>
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
              {isSubmitting ? 'Saving...' : fileDialog.mode === 'create' ? 'Create' : 'Save'}
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
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Category</p>
                  <p className="font-medium">{detailDialog.file.category}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={detailDialog.file.status === 'open' ? 'default' : 'secondary'}>
                    {detailDialog.file.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Created By</p>
                  <p className="font-medium">{detailDialog.file.createdBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Created At</p>
                  <p className="font-medium">{format(new Date(detailDialog.file.createdAt), 'PPP')}</p>
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
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Linked Documents ({detailDialog.file.linkedDocuments.length})
                </h4>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {detailDialog.file.linkedDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => navigateToDocument(doc.type, doc.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-lg",
                            doc.type === 'darta' ? "bg-blue-100" : "bg-purple-100"
                          )}>
                            <FileText className={cn(
                              "h-4 w-4",
                              doc.type === 'darta' ? "text-blue-600" : "text-purple-600"
                            )} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{doc.number}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{doc.subject}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {doc.type === 'darta' ? 'Incoming' : 'Outgoing'}
                          </Badge>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialog({ open: false, file: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
