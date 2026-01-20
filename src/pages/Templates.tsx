import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  FileText,
  Copy,
  Eye,
  Search,
  Filter,
  MoreHorizontal,
  Loader2,
} from 'lucide-react';
import { useTemplateList, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useDuplicateTemplate } from '@/hooks/use-templates';
import { useDebounce } from '@/hooks/use-debounce';
import { LetterTemplate } from '@/lib/api/templates';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { RichTextEditor } from '@/components/RichTextEditor';
import { toast } from 'sonner';

const categories = ['Official', 'Request', 'Acknowledgment', 'Internal', 'Approval', 'General'];

interface TemplateFormData {
  name: string;
  category: string;
  content: string;
}

export default function Templates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [templateDialog, setTemplateDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    template: LetterTemplate | null;
  }>({ open: false, mode: 'create', template: null });
  
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    category: '',
    content: '',
  });
  
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    template: LetterTemplate | null;
  }>({ open: false, template: null });

  const debouncedSearch = useDebounce(searchQuery, 300);

  // API hooks
  const { data: templatesData, isLoading } = useTemplateList({
    search: debouncedSearch || undefined,
    category: categoryFilter !== 'all' ? categoryFilter : undefined,
  });
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();
  const duplicateTemplate = useDuplicateTemplate();

  const templates = templatesData?.results || [];

  const openCreateDialog = () => {
    setFormData({ name: '', category: '', content: '<p></p>' });
    setTemplateDialog({ open: true, mode: 'create', template: null });
  };

  const openEditDialog = (template: LetterTemplate) => {
    setFormData({
      name: template.name,
      category: template.category,
      content: template.content,
    });
    setTemplateDialog({ open: true, mode: 'edit', template });
  };

  const closeTemplateDialog = () => {
    setTemplateDialog({ open: false, mode: 'create', template: null });
    setFormData({ name: '', category: '', content: '' });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (templateDialog.mode === 'create') {
      createTemplate.mutate({
        name: formData.name,
        category: formData.category,
        content: formData.content,
      }, {
        onSuccess: () => closeTemplateDialog(),
      });
    } else if (templateDialog.template) {
      updateTemplate.mutate({
        id: templateDialog.template.id,
        data: {
          name: formData.name,
          category: formData.category,
          content: formData.content,
        },
      }, {
        onSuccess: () => closeTemplateDialog(),
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteTemplate.mutate(id);
  };

  const handleDuplicate = (id: string) => {
    duplicateTemplate.mutate(id);
  };

  const isSubmitting = createTemplate.isPending || updateTemplate.isPending;

  // Calculate stats
  const categoryStats = categories.slice(0, 3).map(cat => ({
    category: cat,
    count: templates.filter(t => t.category === cat).length,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Letter Templates</h1>
          <p className="text-muted-foreground">Manage reusable templates for Chalani letters</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Templates</CardDescription>
            <CardTitle className="text-3xl">{templatesData?.count || templates.length}</CardTitle>
          </CardHeader>
        </Card>
        {categoryStats.map((stat) => (
          <Card key={stat.category}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.category}</CardDescription>
              <CardTitle className="text-3xl">{stat.count}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px]">
                <Filter className="mr-2 h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-12 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-1">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create your first template to get started'}
                </p>
              </CardContent>
            </Card>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">{template.category}</Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setPreviewDialog({ open: true, template })}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(template)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(template.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(template.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div
                    className="text-sm text-muted-foreground line-clamp-4 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: template.content }}
                  />
                </CardContent>
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setPreviewDialog({ open: true, template })}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={templateDialog.open} onOpenChange={(open) => !open && closeTemplateDialog()}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {templateDialog.mode === 'create' ? 'Create Template' : 'Edit Template'}
            </DialogTitle>
            <DialogDescription>
              {templateDialog.mode === 'create'
                ? 'Create a new letter template'
                : 'Update template content'}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name *</Label>
                  <Input
                    id="name"
                    placeholder="Enter template name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              </div>

              <div className="space-y-2">
                <Label>Template Content</Label>
                <RichTextEditor
                  content={formData.content}
                  onChange={(content) => setFormData({ ...formData, content })}
                  placeholder="Enter template content..."
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={closeTemplateDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : templateDialog.mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog.open} onOpenChange={(open) => !open && setPreviewDialog({ open: false, template: null })}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{previewDialog.template?.name}</DialogTitle>
            <DialogDescription>
              <Badge variant="outline">{previewDialog.template?.category}</Badge>
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div
              className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg border"
              dangerouslySetInnerHTML={{ __html: previewDialog.template?.content || '' }}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
