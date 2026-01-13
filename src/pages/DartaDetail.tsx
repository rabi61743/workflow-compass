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
  Shield,
  Paperclip,
  MessageSquare,
  ChevronRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useDarta, useDartaWorkflow, useDartaAction, useUserList } from '@/hooks';
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
import type { DartaLetter, WorkflowStep as WorkflowStepType } from '@/lib/types';

type ActionType = 'forward' | 'return' | 'approve' | 'reject' | 'terminate';

export default function DartaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: ActionType | null;
  }>({ open: false, type: null });
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [remarks, setRemarks] = useState('');

  // Fetch darta details
  const { data: dartaData, isLoading, isError, error } = useDarta(id || '', !!id);
  
  // Fetch workflow history
  const { data: workflowData } = useDartaWorkflow(id || '', !!id);
  
  // Fetch users for forward/return actions
  const { data: usersData } = useUserList({ is_active: true });
  
  // Action mutation
  const dartaAction = useDartaAction();

  // Map API response to expected format
  const darta: DartaLetter | null = useMemo(() => {
    if (!dartaData) return null;
    const d = dartaData as any;
    return {
      id: d.id,
      dartaNumber: d.darta_number,
      fiscalYear: d.fiscal_year,
      senderName: d.sender_name,
      senderOrg: d.sender_org,
      letterDate: d.letter_date,
      receivedDate: d.received_date,
      subject: d.subject,
      priority: d.priority,
      confidentiality: d.confidentiality,
      documentType: d.document_type_name || d.document_type,
      status: d.status,
      currentHandler: d.current_handler,
      currentHandlerName: d.current_handler_name || '',
      attachments: d.attachments || [],
      createdAt: d.created_at,
      createdBy: d.created_by,
    };
  }, [dartaData]);

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
      timestamp: step.created_at,
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

  if (isError || !darta) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Darta Not Found</h2>
        <p className="text-muted-foreground mb-4">
          {(error as Error)?.message || 'The requested darta letter could not be found.'}
        </p>
        <Button onClick={() => navigate('/darta')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Darta List
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800 gap-1"><Clock className="h-3 w-3" /> In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      case 'closed':
        return <Badge variant="outline" className="gap-1">Closed</Badge>;
      case 'terminated':
        return <Badge className="bg-gray-100 text-gray-800 gap-1">Terminated</Badge>;
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
      default:
        return 'bg-primary';
    }
  };

  const openActionDialog = (type: ActionType) => {
    setActionDialog({ open: true, type });
    setSelectedUser('');
    setRemarks('');
  };

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null });
    setSelectedUser('');
    setRemarks('');
  };

  const handleAction = async () => {
    if (!actionDialog.type || !id) return;

    if ((actionDialog.type === 'forward' || actionDialog.type === 'return') && !selectedUser) {
      toast.error('Please select a user');
      return;
    }

    if ((actionDialog.type === 'reject' || actionDialog.type === 'terminate') && !remarks.trim()) {
      toast.error('Please provide remarks for this action');
      return;
    }

    dartaAction.mutate(
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
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isCurrentHandler = darta.currentHandler === user?.id;
  const canTakeAction = isCurrentHandler && !['closed', 'terminated', 'approved', 'rejected'].includes(darta.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/darta')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold tracking-tight">{darta.dartaNumber}</h1>
              {getStatusBadge(darta.status)}
              {getPriorityBadge(darta.priority)}
            </div>
            <p className="text-muted-foreground line-clamp-2">{darta.subject}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {canTakeAction && (
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => openActionDialog('forward')}>
              <Forward className="mr-2 h-4 w-4" />
              Forward
            </Button>
            <Button variant="outline" onClick={() => openActionDialog('return')}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Return
            </Button>
            <Button variant="outline" className="text-green-600 hover:text-green-700" onClick={() => openActionDialog('approve')}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => openActionDialog('reject')}>
              <XCircle className="mr-2 h-4 w-4" />
              Reject
            </Button>
          </div>
        )}
      </div>

      {/* Main Content - Split Layout */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left Panel - Document Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Letter Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Letter Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Sender</p>
                    <p className="font-medium">{darta.senderName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Organization</p>
                    <p className="font-medium">{darta.senderOrg}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Letter Date</p>
                    <p className="font-medium">{format(new Date(darta.letterDate), 'PPP')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Received Date</p>
                    <p className="font-medium">{format(new Date(darta.receivedDate), 'PPP')}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Document Type</p>
                    <p className="font-medium">{darta.documentType}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Confidentiality</p>
                    <p className="font-medium capitalize">{darta.confidentiality}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex items-start gap-3">
                <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Subject</p>
                  <p className="font-medium">{darta.subject}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Paperclip className="h-4 w-4" />
                Attachments
                <Badge variant="secondary" className="ml-2">{darta.attachments.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {darta.attachments.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No attachments
                </p>
              ) : (
                <div className="space-y-2">
                  {darta.attachments.map((attachment) => (
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

          {/* Current Handler */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Handler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {darta.currentHandlerName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{darta.currentHandlerName}</p>
                  <p className="text-sm text-muted-foreground">
                    {availableUsers.find(u => u.id === darta.currentHandler)?.designation || 'Staff'}
                  </p>
                </div>
                {isCurrentHandler && (
                  <Badge className="ml-auto">You</Badge>
                )}
              </div>
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
                                {format(new Date(step.timestamp), 'PPp')}
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
              {actionDialog.type} Darta
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'forward' && 'Select a user to forward this darta to.'}
              {actionDialog.type === 'return' && 'Select a user to return this darta to.'}
              {actionDialog.type === 'approve' && 'Approve this darta and mark it as completed.'}
              {actionDialog.type === 'reject' && 'Reject this darta with a reason.'}
              {actionDialog.type === 'terminate' && 'Terminate this darta without further action.'}
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

            {/* Remarks */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Remarks {(actionDialog.type === 'reject' || actionDialog.type === 'terminate') && '*'}
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
              disabled={dartaAction.isPending}
              className={cn(
                actionDialog.type === 'approve' && 'bg-green-600 hover:bg-green-700',
                actionDialog.type === 'reject' && 'bg-destructive hover:bg-destructive/90'
              )}
            >
              {dartaAction.isPending ? (
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
