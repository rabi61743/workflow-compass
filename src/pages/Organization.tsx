import { useState } from 'react';
import { useOfficeList, useOfficeHierarchy, useCreateOffice, useUpdateOffice, useDeleteOffice } from '@/hooks/use-organization';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, ChevronRight, Building2, MapPin, Edit } from 'lucide-react';
import { Office } from '@/lib/types';
import { toast } from 'sonner';

interface OfficeFormData {
  name: string;
  code: string;
  type: string;
  location: string;
  parentId: string;
}

const defaultFormData: OfficeFormData = {
  name: '',
  code: '',
  type: 'department',
  location: '',
  parentId: '',
};

const officeTypes = [
  { value: 'head_office', label: 'Head Office' },
  { value: 'regional', label: 'Regional Office' },
  { value: 'branch', label: 'Branch Office' },
  { value: 'department', label: 'Department' },
];

function OfficeTreeNode({ 
  office, 
  allOffices, 
  level = 0,
  onEdit,
}: { 
  office: Office; 
  allOffices: Office[]; 
  level?: number;
  onEdit: (office: Office) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const children = allOffices.filter(o => o.parentId === office.id);
  const hasChildren = children.length > 0;

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'head_office':
        return <Badge>Head Office</Badge>;
      case 'regional':
        return <Badge variant="secondary">Regional</Badge>;
      case 'branch':
        return <Badge variant="outline">Branch</Badge>;
      case 'department':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Department</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
          style={{ marginLeft: `${level * 24}px` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Building2 className="h-4 w-4" />
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{office.name}</span>
              {getTypeBadge(office.type)}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">{office.code}</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {office.location}
              </span>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={() => onEdit(office)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="mt-1 space-y-1">
              {children.map(child => (
                <OfficeTreeNode
                  key={child.id}
                  office={child}
                  allOffices={allOffices}
                  level={level + 1}
                  onEdit={onEdit}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

export default function Organization() {
  const [searchQuery, setSearchQuery] = useState('');
  const [officeDialog, setOfficeDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    office: Office | null;
  }>({ open: false, mode: 'create', office: null });
  const [formData, setFormData] = useState<OfficeFormData>(defaultFormData);

  // API hooks
  const { data: officesData, isLoading } = useOfficeList({});
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();

  const offices = officesData?.results || [];
  const rootOffices = offices.filter(o => !o.parentId);

  const filteredOffices = searchQuery
    ? offices.filter(
        o =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rootOffices;

  const stats = {
    total: offices.length,
    headOffice: offices.filter(o => o.type === 'head_office').length,
    regional: offices.filter(o => o.type === 'regional').length,
    branch: offices.filter(o => o.type === 'branch').length,
    department: offices.filter(o => o.type === 'department').length,
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setOfficeDialog({ open: true, mode: 'create', office: null });
  };

  const openEditDialog = (office: Office) => {
    setFormData({
      name: office.name,
      code: office.code,
      type: office.type,
      location: office.location,
      parentId: office.parentId || '',
    });
    setOfficeDialog({ open: true, mode: 'edit', office });
  };

  const closeDialog = () => {
    setOfficeDialog({ open: false, mode: 'create', office: null });
    setFormData(defaultFormData);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code || !formData.type) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (officeDialog.mode === 'create') {
      createOffice.mutate({
        name: formData.name,
        code: formData.code,
        type: formData.type as any,
        location: formData.location,
        parent_id: formData.parentId || undefined,
      }, {
        onSuccess: () => closeDialog(),
      });
    } else if (officeDialog.office) {
      updateOffice.mutate({
        id: officeDialog.office.id,
        data: {
          name: formData.name,
          code: formData.code,
          type: formData.type as any,
          location: formData.location,
          parent_id: formData.parentId || undefined,
        },
      }, {
        onSuccess: () => closeDialog(),
      });
    }
  };

  const isSubmitting = createOffice.isPending || updateOffice.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Structure</h1>
          <p className="text-muted-foreground">
            Manage offices, departments, and organizational hierarchy
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Office
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Offices</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Head Office</p>
                <p className="text-2xl font-bold">{stats.headOffice}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Regional</p>
                <p className="text-2xl font-bold">{stats.regional}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Branches</p>
                <p className="text-2xl font-bold">{stats.branch}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Departments</p>
                <p className="text-2xl font-bold">{stats.department}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Office Directory</CardTitle>
          <CardDescription>
            View and manage the organizational hierarchy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search offices by name, code, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Tree View */}
          <div className="space-y-1">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery ? (
              filteredOffices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No offices found matching "{searchQuery}"
                </div>
              ) : (
                filteredOffices.map(office => (
                  <OfficeTreeNode
                    key={office.id}
                    office={office}
                    allOffices={offices}
                    level={0}
                    onEdit={openEditDialog}
                  />
                ))
              )
            ) : (
              rootOffices.map(office => (
                <OfficeTreeNode
                  key={office.id}
                  office={office}
                  allOffices={offices}
                  level={0}
                  onEdit={openEditDialog}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={officeDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {officeDialog.mode === 'create' ? 'Add Office' : 'Edit Office'}
            </DialogTitle>
            <DialogDescription>
              {officeDialog.mode === 'create'
                ? 'Add a new office to the organization'
                : 'Update office details'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Office Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter office name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Office Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., HO-001"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Office Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {officeTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Office</Label>
              <Select
                value={formData.parentId}
                onValueChange={(value) => setFormData({ ...formData, parentId: value })}
              >
                <SelectTrigger id="parent">
                  <SelectValue placeholder="Select parent office (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (Root Office)</SelectItem>
                  {offices
                    .filter(o => o.id !== officeDialog.office?.id)
                    .map((office) => (
                      <SelectItem key={office.id} value={office.id}>
                        {office.name} ({office.code})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : officeDialog.mode === 'create' ? 'Create' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
