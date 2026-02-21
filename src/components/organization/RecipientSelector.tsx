import { useState, useEffect, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { useOfficeHierarchy, useRecipientSearch, useOfficeMembers } from '@/hooks/use-organization';
import { RecipientSearchResult, OfficeTreeNode } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Building2, User, Search, ChevronRight, ChevronDown, Users, Crown, X, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectedRecipient {
  id: string;
  type: 'user' | 'office';
  name: string;
  subtitle: string;
  officeId?: string | null;
  officeName?: string;
  userId?: string | null;
  designation?: string;
  isOfficeHead?: boolean;
  recipientRole: 'primary' | 'cc';
}

interface RecipientSelectorProps {
  selectedRecipients: SelectedRecipient[];
  onAdd: (recipient: SelectedRecipient) => void;
  onRemove: (id: string) => void;
  recipientRole?: 'primary' | 'cc';
  label?: string;
  placeholder?: string;
  className?: string;
  maxRecipients?: number;
}

function OfficeTreeItem({
  node,
  level = 0,
  onSelectOffice,
  onSelectUser,
  selectedIds,
}: {
  node: OfficeTreeNode;
  level?: number;
  onSelectOffice: (office: OfficeTreeNode) => void;
  onSelectUser: (result: RecipientSearchResult) => void;
  selectedIds: Set<string>;
}) {
  const [expanded, setExpanded] = useState(level < 1);
  const [showMembers, setShowMembers] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  const { data: members } = useOfficeMembers(node.id, false, showMembers);

  const typeColors: Record<string, string> = {
    head_office: 'bg-primary/10 text-primary',
    regional: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    branch: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    department: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    section: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    unit: 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300',
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-muted/50 cursor-pointer text-sm group',
          selectedIds.has(node.id) && 'bg-primary/5'
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-0.5 hover:bg-muted rounded"
        >
          {hasChildren ? (
            expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />

        <span
          className="flex-1 truncate font-medium"
          onClick={() => onSelectOffice(node)}
          title={`Select ${node.name} as recipient`}
        >
          {node.name}
        </span>

        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', typeColors[node.type])}>
          {node.type.replace('_', ' ')}
        </Badge>

        {node.memberCount > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMembers(!showMembers);
            }}
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
            title="Show members"
          >
            <Users className="h-3 w-3" />
            {node.memberCount}
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onSelectOffice(node);
          }}
          title="Add office as recipient"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Members list */}
      {showMembers && members && members.length > 0 && (
        <div className="ml-4 border-l border-dashed" style={{ paddingLeft: `${level * 16 + 12}px` }}>
          {members.map((member) => (
            <div
              key={member.id}
              className={cn(
                'flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-muted/50 cursor-pointer',
                selectedIds.has(member.userId || member.id) && 'bg-primary/5'
              )}
              onClick={() =>
                onSelectUser({
                  id: member.id,
                  type: 'user',
                  name: member.userName,
                  subtitle: `${member.designationName} • ${member.officeName}`,
                  officeId: member.officeId,
                  officeName: member.officeName,
                  officeCode: member.officeCode,
                  userId: member.userId,
                  designation: member.designationName,
                  isOfficeHead: member.isOfficeHead,
                })
              }
            >
              <User className="h-3 w-3 text-muted-foreground" />
              <span className="flex-1 truncate">{member.userName}</span>
              {member.isOfficeHead && <Crown className="h-3 w-3 text-amber-500" />}
              {member.designationName && (
                <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                  {member.designationName}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <OfficeTreeItem
              key={child.id}
              node={child}
              level={level + 1}
              onSelectOffice={onSelectOffice}
              onSelectUser={onSelectUser}
              selectedIds={selectedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RecipientSelector({
  selectedRecipients,
  onAdd,
  onRemove,
  recipientRole = 'primary',
  label = 'Recipients',
  placeholder = 'Search users or offices...',
  className,
  maxRecipients,
}: RecipientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mode, setMode] = useState<'search' | 'browse'>('search');
  const debouncedQuery = useDebounce(searchQuery, 300);

  const { data: searchResults, isLoading: isSearching } = useRecipientSearch(
    { q: debouncedQuery, type: 'all' },
    mode === 'search' && debouncedQuery.length >= 2
  );

  const { data: hierarchy, isLoading: isLoadingTree } = useOfficeHierarchy();

  const selectedIds = useMemo(
    () => new Set(selectedRecipients.map((r) => r.userId || r.id)),
    [selectedRecipients]
  );

  const handleSelectResult = (result: RecipientSearchResult) => {
    if (maxRecipients && selectedRecipients.length >= maxRecipients) return;
    const id = result.userId || result.id;
    if (selectedIds.has(id)) return;

    onAdd({
      id: String(id),
      type: result.type === 'user' ? 'user' : 'office',
      name: result.name,
      subtitle: result.subtitle,
      officeId: result.officeId,
      officeName: result.officeName,
      userId: result.userId,
      designation: result.designation,
      isOfficeHead: result.isOfficeHead,
      recipientRole,
    });
  };

  const handleSelectOffice = (office: OfficeTreeNode) => {
    if (maxRecipients && selectedRecipients.length >= maxRecipients) return;
    if (selectedIds.has(office.id)) return;

    onAdd({
      id: office.id,
      type: 'office',
      name: office.name,
      subtitle: `${office.type.replace('_', ' ')} • ${office.location || ''}`.trim(),
      officeId: office.id,
      officeName: office.name,
      userId: null,
      designation: '',
      isOfficeHead: false,
      recipientRole,
    });
  };

  const filteredResults = selectedRecipients.filter((r) => r.recipientRole === recipientRole);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0" align="end">
            <div className="p-2 border-b">
              <div className="flex gap-1 mb-2">
                <Button
                  type="button"
                  variant={mode === 'search' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setMode('search')}
                >
                  <Search className="h-3 w-3 mr-1" />
                  Search
                </Button>
                <Button
                  type="button"
                  variant={mode === 'browse' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setMode('browse')}
                >
                  <Building2 className="h-3 w-3 mr-1" />
                  Browse Hierarchy
                </Button>
              </div>
              {mode === 'search' && (
                <Input
                  placeholder={placeholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm"
                  autoFocus
                />
              )}
            </div>

            <ScrollArea className="h-[300px]">
              {mode === 'search' ? (
                <div className="p-1">
                  {isSearching && (
                    <p className="text-center text-xs text-muted-foreground py-4">Searching...</p>
                  )}
                  {!isSearching && debouncedQuery.length >= 2 && (!searchResults || searchResults.length === 0) && (
                    <p className="text-center text-xs text-muted-foreground py-4">No results found</p>
                  )}
                  {!isSearching && debouncedQuery.length < 2 && (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      Type at least 2 characters to search
                    </p>
                  )}
                  {searchResults?.map((result) => (
                    <div
                      key={`${result.type}-${result.id}`}
                      className={cn(
                        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-muted/50 text-sm',
                        selectedIds.has(result.userId || result.id) && 'opacity-50 pointer-events-none'
                      )}
                      onClick={() => handleSelectResult(result)}
                    >
                      {result.type === 'user' ? (
                        <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium truncate">{result.name}</span>
                          {result.isOfficeHead && <Crown className="h-3 w-3 text-amber-500 flex-shrink-0" />}
                        </div>
                        {result.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-[10px] flex-shrink-0">
                        {result.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-1">
                  {isLoadingTree ? (
                    <p className="text-center text-xs text-muted-foreground py-4">Loading...</p>
                  ) : hierarchy && hierarchy.length > 0 ? (
                    hierarchy.map((node) => (
                      <OfficeTreeItem
                        key={node.id}
                        node={node}
                        onSelectOffice={handleSelectOffice}
                        onSelectUser={handleSelectResult}
                        selectedIds={selectedIds}
                      />
                    ))
                  ) : (
                    <p className="text-center text-xs text-muted-foreground py-4">
                      No offices found
                    </p>
                  )}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected recipients */}
      {filteredResults.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No {label.toLowerCase()} added</p>
      ) : (
        <div className="space-y-1.5">
          {filteredResults.map((recipient) => (
            <div
              key={recipient.id}
              className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                {recipient.type === 'user' ? (
                  <User className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                ) : (
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{recipient.name}</p>
                    {recipient.isOfficeHead && <Crown className="h-3 w-3 text-amber-500" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{recipient.subtitle}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={() => onRemove(recipient.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
