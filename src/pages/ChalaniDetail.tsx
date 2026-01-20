import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Forward,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Download,
  User,
  Building,
  Calendar,
  Tag,
  Paperclip,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Send,
  Edit,
  Eye,
  Loader2,
} from 'lucide-react';
import { useChalani, useChalaniWorkflow, useChalaniAction, useDispatchChalani, useUserList } from '@/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { ChalaniLetter, WorkflowStep as WorkflowStepType } from '@/lib/types';

type ActionType = 'forward' | 'return' | 'approve' | 'reject' | 'dispatch' | 'edit';

export default function ChalaniDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: ActionType | null;
  }>({ open: false, type: null });
  const [dispatchMethod, setDispatchMethod] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [showContent, setShowContent] = useState(false);

  // Fetch chalani details
  const { data: chalaniData, isLoading, isError, error } = useChalani(id || '', !!id);
  
  // Fetch workflow history
  const { data: workflowData } = useChalaniWorkflow(id || '', !!id);
  
  // Fetch users for forward/return actions
  const { data: usersData } = useUserList({ is_active: true });
  
  // Mutations
  const chalaniAction = useChalaniAction();
  const dispatchChalani = useDispatchChalani();

  // Map API response to expected format
  const chalani: ChalaniLetter | null = useMemo(() => {
    if (!chalaniData) return null;
    const c = chalaniData as any;
    return {
      id: c.id,
      chalaniNumber: c.chalani_number || '-',
      fiscalYear: c.fiscal_year,
      receiverName: c.receiver_name,
      receiverOrg: c.receiver_org || c.receiver_office_name || '',
      receiverType: c.receiver_type,
      subject: c.subject,
      priority: c.priority,
      status: c.status,
      content: c.content || '',
      templateId: c.template,
      attachments: c.attachments || [],
      createdAt: c.created_at,
      createdBy: c.created_by,
      dispatchedAt: c.dispatched_at,
    };
  }, [chalaniData]);

  // Map workflow steps
  const workflowSteps: WorkflowStepType[] = useMemo(() => {
    if (!workflowData) return [];
    return (workflowData as any[]).map((step: any) => ({
      id: step.id,
      action: step.action,
      fromUserId: step.from_user,
      fromUserName: step.from_user_name || '',
      toUserId: step.to_user,
      toUserName: step.to_user_name || '',
      remarks: step.remarks || '',
      timestamp: step.timestamp || step.created_at,
    }));
  }, [workflowData]);

  // Available users for forwarding/returning
  const availableUsers = useMemo(() => {
    if (!usersData?.results) return [];
    return (usersData.results as any[])
      .filter((u: any) => u.id !== user?.id && u.is_active)
      .map((u: any) => ({
        id: u.id,
        name: u.name || `${u.first_name} ${u.last_name}`,
        designation: u.designation_name || u.designation || 'Staff',
        officeName: u.office_name || '',
      }));
  }, [usersData, user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-[500px]" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !chalani) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Chalani Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {(error as Error)?.message || 'The requested chalani letter could not be found.'}
        </p>
        <Button onClick={() => navigate('/chalani')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chalani List
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Draft</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800 gap-1"><Clock className="h-3 w-3" /> In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'dispatched':
      case 'closed':
        return <Badge className="bg-purple-100 text-purple-800 gap-1"><Send className="h-3 w-3" /> Dispatched</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      case 'confidential':
        return <Badge className="bg-amber-100 text-amber-800">Confidential</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FileText className="h-4 w-4" />;
      case 'forward':
        return <Forward className="h-4 w-4" />;
      case 'return':
        return <RotateCcw className="h-4 w-4" />;
      case 'approve':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'reject':
        return <XCircle className="h-4 w-4" />;
      case 'dispatch':
        return <Send className="h-4 w-4" />;
      default:
        return <ChevronRight className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
        return 'bg-green-500';
      case 'reject':
        return 'bg-red-500';
      case 'forward':
        return 'bg-blue-500';
      case 'return':
        return 'bg-amber-500';
      case 'dispatch':
        return 'bg-purple-500';
      default:
        return 'bg-primary';
    }
  };

  const formatTimestamp = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return format(date, 'PPp');
  };

  const openActionDialog = (type: ActionType) => {
    setActionDialog({ open: true, type });
    setSelectedUser('');
    setRemarks('');
    setDispatchMethod('');
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null });
    setSelectedUser('');
    setRemarks('');
    setDispatchMethod('');
  };

  const handleAction = async () => {
    if (!actionDialog.type || !id) return;

    if ((actionDialog.type === 'forward' || actionDialog.type === 'return') && !selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if (actionDialog.type === 'dispatch' && !dispatchMethod) {
      toast.error('Please select a dispatch method');
      return;
    }

    if (actionDialog.type === 'reject' && !remarks.trim()) {
      toast.error('Please provide remarks for rejection');
      return;
    }

    if (actionDialog.type === 'dispatch') {
      dispatchChalani.mutate(
        {
          id,
          details: {
            method: dispatchMethod,
            remarks: remarks || undefined,
          },
        },
        {
          onSuccess: () => {
            closeActionDialog();
          },
        }
      );
    } else {
      chalaniAction.mutate(
        {
          id,
          action: {
            action: actionDialog.type,
            to_user_id: selectedUser || undefined,
            remarks: remarks,
          },
        },
        {
          onSuccess: () => {
            closeActionDialog();
          },
        }
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isPending = chalaniAction.isPending || dispatchChalani.isPending;
  const isDraft = chalani.status === 'pending' || chalani.status === 'draft';
  const isApproved = chalani.status === 'approved';
  const isDispatched = chalani.status === 'closed' || chalani.status === 'dispatched';
  const canEdit = isDraft;
  const canSubmitForReview = isDraft;
  const canDispatch = isApproved && !chalani.dispatchedAt;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chalani')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{chalani.chalaniNumber}</h1>
              {getStatusBadge(chalani.status)}
              {getPriorityBadge(chalani.priority)}
            </div>
            <p className="text-muted-foreground line-clamp-2">{chalani.subject}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/chalani/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Draft
            </Button>
          )}
          {canSubmitForReview && (
            <Button onClick={() => openActionDialog('forward')}>
              <Forward className="mr-2 h-4 w-4" />
              Submit for Review
            </Button>
          )}
          {!isDraft && !isDispatched && (
            <>
              <Button variant="outline" className="text-green-600 hover:text-green-700" onClick={() => openActionDialog('approve')}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button variant="outline" onClick={() => openActionDialog('return')}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Return
              </Button>
              <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => openActionDialog('reject')}>
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </>
          )}
          {canDispatch && (
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => openActionDialog('dispatch')}>
              <Send className="mr-2 h-4 w-4" />
              Dispatch
            </Button>
          )}
        </div>
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Panel - Document Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Receiver Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Receiver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Receiver</p>
                    <p className="font-medium">{chalani.receiverName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{chalani.receiverOrg}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Receiver Type</p>
                    <Badge variant={chalani.receiverType === 'internal' ? 'secondary' : 'outline'}>
                      {chalani.receiverType === 'internal' ? 'Internal' : 'External'}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Created Date</p>
                    <p className="font-medium">{format(new Date(chalani.createdAt), 'PPP')}</p>
                  </div>
                </div>
                {chalani.dispatchedAt && (
                  <div className="flex items-start gap-3">
                    <Send className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Dispatched Date</p>
                      <p className="font-medium">{format(new Date(chalani.dispatchedAt), 'PPP')}</p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Subject</p>
                  <p className="font-medium">{chalani.subject}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Letter Content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Letter Content</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowContent(!showContent)}>
                <Eye className="mr-2 h-4 w-4" />
                {showContent ? 'Hide' : 'Preview'}
              </Button>
            </CardHeader>
            {showContent && (
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none p-4 bg-muted/30 rounded-lg border"
                  dangerouslySetInnerHTML={{ __html: chalani.content }}
                />
              </CardContent>
            )}
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
                <Badge variant="secondary" className="ml-2">{chalani.attachments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chalani.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No attachments
                </p>
              ) : (
                <div className="space-y-2">
                  {chalani.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(attachment.size)} • {format(new Date(attachment.uploadedAt), 'PP')}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel - Workflow Timeline */}
        <div className="lg:col-span-2">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-base">Workflow Timeline</CardTitle>
              <CardDescription>History of all actions taken</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-border" />

                  {/* Timeline items */}
                  <div className="space-y-6">
                    {workflowSteps.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No workflow history yet
                      </p>
                    ) : (
                      workflowSteps.map((step) => (
                        <div key={step.id} className="relative flex gap-4">
                          {/* Icon */}
                          <div
                            className={cn(
                              'relative z-10 flex h-8 w-8 items-center justify-center rounded-full text-white',
                              getActionColor(step.action)
                            )}
                          >
                            {getActionIcon(step.action)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 pb-2">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium capitalize">{step.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(step.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              by <span className="font-medium text-foreground">{step.fromUserName}</span>
                              {step.toUserName && (
                                <>
                                  {' → '}
                                  <span className="font-medium text-foreground">{step.toUserName}</span>
                                </>
                              )}
                            </p>
                            {step.remarks && (
                              <div className="text-sm bg-muted/50 rounded-md p-2 mt-1">
                                {step.remarks}
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => !open && closeActionDialog()}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="capitalize">
              {actionDialog.type === 'dispatch' ? 'Dispatch Chalani' : `${actionDialog.type} Chalani`}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'forward' && 'Select a user to forward this chalani to for review.'}
              {actionDialog.type === 'return' && 'Select a user to return this chalani to.'}
              {actionDialog.type === 'approve' && 'Approve this chalani for dispatch.'}
              {actionDialog.type === 'reject' && 'Reject this chalani with a reason.'}
              {actionDialog.type === 'dispatch' && 'Choose how to dispatch this letter.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User Selection for Forward/Return */}
            {(actionDialog.type === 'forward' || actionDialog.type === 'return') && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Select User</label>
                <Command className="border rounded-lg">
                  <CommandInput placeholder="Search users..." />
                  <CommandList>
                    <CommandEmpty>No users found.</CommandEmpty>
                    <CommandGroup>
                      {availableUsers.map((u) => (
                        <CommandItem
                          key={u.id}
                          onSelect={() => setSelectedUser(u.id)}
                          className={cn(
                            'cursor-pointer',
                            selectedUser === u.id && 'bg-primary/10'
                          )}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {u.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{u.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {u.designation} • {u.officeName}
                              </p>
                            </div>
                            {selectedUser === u.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}

            {/* Dispatch Method Selection */}
            {actionDialog.type === 'dispatch' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Dispatch Method *</label>
                <Select value={dispatchMethod} onValueChange={setDispatchMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispatch method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="courier">Courier Service</SelectItem>
                    <SelectItem value="hand_delivery">Hand Delivery</SelectItem>
                    <SelectItem value="registered_post">Registered Post</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Remarks {actionDialog.type === 'reject' && '*'}
              </label>
              <Textarea
                placeholder="Add your remarks here..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog}>
              Cancel
            </Button>
            <Button 
              onClick={handleAction} 
              disabled={isPending}
              className={cn(
                actionDialog.type === 'approve' && 'bg-green-600 hover:bg-green-700',
                actionDialog.type === 'reject' && 'bg-destructive hover:bg-destructive/90',
                actionDialog.type === 'dispatch' && 'bg-purple-600 hover:bg-purple-700'
              )}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <span className="capitalize">{actionDialog.type}</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
