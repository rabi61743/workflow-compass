import { useState } from 'react';
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
} from 'lucide-react';
import { mockChalaniLetters, mockUsers } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

// Mock workflow steps for demo
const mockWorkflowSteps = [
  {
    id: 'step-1',
    action: 'create',
    fromUserId: 'usr-003',
    fromUserName: 'Hari Prasad Acharya',
    toUserId: null,
    toUserName: null,
    remarks: 'Draft created from template',
    timestamp: '2024-11-10T11:00:00Z',
  },
  {
    id: 'step-2',
    action: 'forward',
    fromUserId: 'usr-003',
    fromUserName: 'Hari Prasad Acharya',
    toUserId: 'usr-004',
    toUserName: 'Dr. Krishna Bahadur KC',
    remarks: 'Submitting for approval before dispatch',
    timestamp: '2024-11-10T14:30:00Z',
  },
  {
    id: 'step-3',
    action: 'approve',
    fromUserId: 'usr-004',
    fromUserName: 'Dr. Krishna Bahadur KC',
    toUserId: 'usr-003',
    toUserName: 'Hari Prasad Acharya',
    remarks: 'Approved for dispatch. Please proceed.',
    timestamp: '2024-11-11T10:00:00Z',
  },
  {
    id: 'step-4',
    action: 'dispatch',
    fromUserId: 'usr-003',
    fromUserName: 'Hari Prasad Acharya',
    toUserId: null,
    toUserName: null,
    remarks: 'Dispatched via courier service',
    timestamp: '2024-11-12T15:30:00Z',
  },
];

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Find the chalani letter
  const chalani = mockChalaniLetters.find((c) => c.id === id);

  if (!chalani) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Chalani Not Found</h2>
        <p className="text-muted-foreground mb-4">The requested chalani letter could not be found.</p>
        <Button onClick={() => navigate('/chalani')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chalani List
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Draft</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800 gap-1"><Clock className="h-3 w-3" /> In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
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
    if (!actionDialog.type) return;

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

    setIsSubmitting(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const actionLabels: Record<ActionType, string> = {
        forward: 'Forwarded',
        return: 'Returned',
        approve: 'Approved',
        reject: 'Rejected',
        dispatch: 'Dispatched',
        edit: 'Updated',
      };

      toast.success(`Chalani ${actionLabels[actionDialog.type]} successfully`);
      closeActionDialog();
    } catch (error) {
      toast.error('Action failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUsers = mockUsers.filter(
    (u) => u.id !== user?.id && u.isActive
  );

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const isDraft = chalani.status === 'pending';
  const isApproved = chalani.status === 'approved';
  const isDispatched = chalani.status === 'closed';
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
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
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
                    {mockWorkflowSteps.map((step) => (
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
                    ))}
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
              {actionDialog.type === 'forward' && 'Submit for Review'}
              {actionDialog.type === 'return' && 'Return Chalani'}
              {actionDialog.type === 'approve' && 'Approve Chalani'}
              {actionDialog.type === 'reject' && 'Reject Chalani'}
              {actionDialog.type === 'dispatch' && 'Dispatch Chalani'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === 'forward' && 'Select an approving authority to review this chalani.'}
              {actionDialog.type === 'return' && 'Return this chalani with your feedback.'}
              {actionDialog.type === 'approve' && 'Approve this chalani for dispatch.'}
              {actionDialog.type === 'reject' && 'Reject this chalani with reason.'}
              {actionDialog.type === 'dispatch' && 'Select dispatch method and confirm.'}
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
                    <CommandEmpty>No user found.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-[200px]">
                        {availableUsers.map((u) => (
                          <CommandItem
                            key={u.id}
                            value={u.name}
                            onSelect={() => setSelectedUser(u.id)}
                            className={cn(
                              'cursor-pointer',
                              selectedUser === u.id && 'bg-primary/10'
                            )}
                          >
                            <div className="flex items-center gap-3 w-full">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs">
                                  {u.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{u.name}</p>
                                <p className="text-xs text-muted-foreground">{u.designation}</p>
                              </div>
                              {selectedUser === u.id && (
                                <CheckCircle2 className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}

            {/* Dispatch Method Selection */}
            {actionDialog.type === 'dispatch' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Dispatch Method</label>
                <Select value={dispatchMethod} onValueChange={setDispatchMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select dispatch method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="courier">Courier Service</SelectItem>
                    <SelectItem value="post">Postal Mail</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="hand">Hand Delivery</SelectItem>
                    <SelectItem value="fax">Fax</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Remarks {(actionDialog.type === 'reject') && <span className="text-destructive">*</span>}
              </label>
              <Textarea
                placeholder="Enter your remarks or comments..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeActionDialog} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleAction} disabled={isSubmitting}>
              {isSubmitting ? 'Processing...' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
