import { useState } from 'react';
import { mockOffices } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Plus, Search, ChevronRight, Building2, MapPin, Users } from 'lucide-react';
import { Office } from '@/lib/types';

function OfficeTreeNode({ office, allOffices, level = 0 }: { office: Office; allOffices: Office[]; level?: number }) {
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

          <Button variant="ghost" size="sm">
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

  const rootOffices = mockOffices.filter(o => !o.parentId);

  const filteredOffices = searchQuery
    ? mockOffices.filter(
        o =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rootOffices;

  const stats = {
    total: mockOffices.length,
    headOffice: mockOffices.filter(o => o.type === 'head_office').length,
    regional: mockOffices.filter(o => o.type === 'regional').length,
    branch: mockOffices.filter(o => o.type === 'branch').length,
    department: mockOffices.filter(o => o.type === 'department').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Structure</h1>
          <p className="text-muted-foreground">
            Manage offices, departments, and organizational hierarchy
          </p>
        </div>
        <Button>
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

      {/* Search */}
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
            {searchQuery ? (
              filteredOffices.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No offices found matching "{searchQuery}"
                </div>
              ) : (
                filteredOffices.map(office => (
                  <OfficeTreeNode
                    key={office.id}
                    office={office}
                    allOffices={mockOffices}
                    level={0}
                  />
                ))
              )
            ) : (
              rootOffices.map(office => (
                <OfficeTreeNode
                  key={office.id}
                  office={office}
                  allOffices={mockOffices}
                  level={0}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
