import { useState } from 'react';
import { useOfficeList, useOfficeHierarchy, useOfficeMembers, useCreateOffice, useUpdateOffice, useDeleteOffice } from '@/hooks/use-organization';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus, Search, ChevronRight, Building2, MapPin, Edit, Users,
  Crown, User, Mail, Phone, ChevronDown,
} from 'lucide-react';
import { Office, OfficeTreeNode, UserOfficeAssignment } from '@/lib/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface OfficeFormData {
  name: string;
  nameNepali: string;
  code: string;
  type: string;
  location: string;
  email: string;
  phone: string;
  parentId: string;
}

const defaultFormData: OfficeFormData = {
  name: '',
  nameNepali: '',
  code: '',
  type: 'department',
  location: '',
  email: '',
  phone: '',
  parentId: '',
};

const officeTypes = [
  { value: 'head_office', label: 'Head Office' },
  { value: 'regional', label: 'Regional Office' },
  { value: 'branch', label: 'Branch Office' },
  { value: 'department', label: 'Department' },
  { value: 'section', label: 'Section' },
  { value: 'unit', label: 'Unit' },
];

const typeColors: Record<string, string> = {
  head_office: 'bg-primary/10 text-primary border-primary/20',
  regional: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300',
  branch: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300',
  department: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300',
  section: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300',
  unit: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300',
};

function OfficeTreeNodeView({
  node,
  level = 0,
  onEdit,
  onViewDetails,
}: {
  node: OfficeTreeNode;
  level?: number;
  onEdit: (office: OfficeTreeNode) => void;
  onViewDetails: (office: OfficeTreeNode) => void;
}) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-0.5">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div
          className="flex items-center gap-2 p-3 rounded-lg border hover:bg-muted/50 transition-colors group"
          style={{ marginLeft: `${level * 24}px` }}
        >
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 transition-transform" />
                ) : (
                  <ChevronRight className="h-4 w-4 transition-transform" />
                )}
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="w-6" />
          )}

          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary cursor-pointer"
            onClick={() => onViewDetails(node)}
          >
            <Building2 className="h-4 w-4" />
          </div>

          <div
            className="flex-1 cursor-pointer"
            onClick={() => onViewDetails(node)}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium">{node.name}</span>
              <Badge variant="outline" className={cn('text-[10px]', typeColors[node.type])}>
                {officeTypes.find(t => t.value === node.type)?.label || node.type}
              </Badge>
              {node.headName && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Crown className="h-3 w-3 text-amber-500" />
                  {node.headName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span className="font-mono">{node.code}</span>
              {node.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {node.location}
                </span>
              )}
              {node.memberCount > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {node.memberCount} members
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onEdit(node)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <div className="mt-0.5 space-y-0.5">
              {node.children.map(child => (
                <OfficeTreeNodeView
                  key={child.id}
                  node={child}
                  level={level + 1}
                  onEdit={onEdit}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </CollapsibleContent>
        )}
      </Collapsible>
    </div>
  );
}

// Office detail sheet
function OfficeDetailSheet({
  office,
  open,
  onClose,
}: {
  office: OfficeTreeNode | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: members, isLoading: isLoadingMembers } = useOfficeMembers(
    office?.id || '', false, open && !!office
  );

  if (!office) return null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {office.name}
          </SheetTitle>
          <SheetDescription>
            <Badge variant="outline" className={cn('mr-2', typeColors[office.type])}>
              {officeTypes.find(t => t.value === office.type)?.label}
            </Badge>
            <span className="font-mono">{office.code}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Office Info */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Details</h4>
            {office.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{office.location}</span>
              </div>
            )}
            {office.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{office.email}</span>
              </div>
            )}
            {office.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{office.phone}</span>
              </div>
            )}
            {office.headName && (
              <div className="flex items-center gap-2 text-sm">
                <Crown className="h-4 w-4 text-amber-500" />
                <span>Head: {office.headName}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Members */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Members ({members?.length || 0})
              </h4>
            </div>

            <ScrollArea className="h-[300px]">
              {isLoadingMembers ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : members && members.length > 0 ? (
                <div className="space-y-1">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50"
                    >
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-medium">
                        {member.userName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{member.userName}</p>
                          {member.isOfficeHead && <Crown className="h-3 w-3 text-amber-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.designationName || 'No designation'}
                          {member.assignmentType !== 'primary' && (
                            <Badge variant="outline" className="ml-1 text-[10px] px-1 py-0">
                              {member.assignmentType}
                            </Badge>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No members assigned to this office
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Sub-offices */}
          {office.children && office.children.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Sub-offices ({office.children.length})
                </h4>
                <div className="space-y-1">
                  {office.children.map((child) => (
                    <div key={child.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm font-medium">{child.name}</span>
                      <Badge variant="outline" className={cn('text-[10px]', typeColors[child.type])}>
                        {child.type.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Organization() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['administrator']);
  const [searchQuery, setSearchQuery] = useState('');
  const [officeDialog, setOfficeDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    office: OfficeTreeNode | null;
  }>({ open: false, mode: 'create', office: null });
  const [formData, setFormData] = useState<OfficeFormData>(defaultFormData);
  const [detailSheet, setDetailSheet] = useState<{
    open: boolean;
    office: OfficeTreeNode | null;
  }>({ open: false, office: null });

  // API hooks
  const { data: officesData, isLoading: isLoadingList } = useOfficeList({});
  const { data: hierarchy, isLoading: isLoadingTree } = useOfficeHierarchy();
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();

  const offices = officesData?.results || [];
  const treeNodes = hierarchy || [];

  // Filter tree nodes by search
  const filterTree = (nodes: OfficeTreeNode[], query: string): OfficeTreeNode[] => {
    if (!query) return nodes;
    const lower = query.toLowerCase();
    return nodes.reduce<OfficeTreeNode[]>((acc, node) => {
      const matches =
        node.name.toLowerCase().includes(lower) ||
        node.code.toLowerCase().includes(lower) ||
        (node.location || '').toLowerCase().includes(lower);
      const filteredChildren = filterTree(node.children || [], query);
      if (matches || filteredChildren.length > 0) {
        acc.push({ ...node, children: filteredChildren });
      }
      return acc;
    }, []);
  };

  const filteredTree = filterTree(treeNodes, searchQuery);
  const isLoading = isLoadingList || isLoadingTree;

  const stats = {
    total: offices.length,
    headOffice: offices.filter(o => o.type === 'head_office').length,
    regional: offices.filter(o => o.type === 'regional').length,
    branch: offices.filter(o => o.type === 'branch').length,
    department: offices.filter(o => o.type === 'department').length,
    section: offices.filter(o => o.type === 'section').length,
  };

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setOfficeDialog({ open: true, mode: 'create', office: null });
  };

  const openEditDialog = (office: OfficeTreeNode) => {
    setFormData({
      name: office.name,
      nameNepali: office.nameNepali || '',
      code: office.code,
      type: office.type,
      location: office.location,
      email: office.email || '',
      phone: office.phone || '',
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
        name_nepali: formData.nameNepali || undefined,
        code: formData.code,
        type: formData.type as any,
        location: formData.location,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        parent: formData.parentId || undefined,
      }, {
        onSuccess: () => closeDialog(),
      });
    } else if (officeDialog.office) {
      updateOffice.mutate({
        id: officeDialog.office.id,
        data: {
          name: formData.name,
          name_nepali: formData.nameNepali || undefined,
          code: formData.code,
          type: formData.type as any,
          location: formData.location,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          parent: formData.parentId || undefined,
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
            Manage offices, departments, sections, and organizational hierarchy
          </p>
        </div>
        {isAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Add Office
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-6">
        {[
          { label: 'Total', count: stats.total, icon: Building2 },
          { label: 'Head Office', count: stats.headOffice },
          { label: 'Regional', count: stats.regional },
          { label: 'Branches', count: stats.branch },
          { label: 'Departments', count: stats.department },
          { label: 'Sections', count: stats.section },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold">{stat.count}</p>
                </div>
                {stat.icon && <stat.icon className="h-8 w-8 text-muted-foreground/50" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Tree */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Office Hierarchy</CardTitle>
          <CardDescription>
            Click on an office to view details and members. Use the tree to browse the organizational structure.
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
          <div className="space-y-0.5">
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
            ) : filteredTree.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? `No offices found matching "${searchQuery}"` : 'No offices found'}
              </div>
            ) : (
              filteredTree.map(node => (
                <OfficeTreeNodeView
                  key={node.id}
                  node={node}
                  level={0}
                  onEdit={openEditDialog}
                  onViewDetails={(office) => setDetailSheet({ open: true, office })}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Office Detail Sheet */}
      <OfficeDetailSheet
        office={detailSheet.office}
        open={detailSheet.open}
        onClose={() => setDetailSheet({ open: false, office: null })}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={officeDialog.open} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {officeDialog.mode === 'create' ? 'Add Office' : 'Edit Office'}
            </DialogTitle>
            <DialogDescription>
              {officeDialog.mode === 'create'
                ? 'Add a new office to the organization hierarchy'
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
                <Label htmlFor="nameNepali">Name (Nepali)</Label>
                <Input
                  id="nameNepali"
                  placeholder="नेपाली नाम"
                  value={formData.nameNepali}
                  onChange={(e) => setFormData({ ...formData, nameNepali: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Office Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., NTC-HO"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
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
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Enter location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent">Parent Office</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger id="parent">
                    <SelectValue placeholder="None (Root Office)" />
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="office@ntc.net.np"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="01-4XXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
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
