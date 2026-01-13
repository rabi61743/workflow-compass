import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, Plus, UserPlus, ArrowLeft, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers, mockDocumentTypes } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Form validation schema
const dartaFormSchema = z.object({
  senderName: z.string().min(2, 'Sender name is required').max(255),
  senderOrg: z.string().max(255).optional(),
  senderAddress: z.string().max(500).optional(),
  letterDate: z.date({ required_error: 'Letter date is required' }),
  receivedDate: z.date({ required_error: 'Received date is required' }),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(500),
  referenceNumber: z.string().max(100).optional(),
  priority: z.enum(['normal', 'urgent', 'confidential']),
  confidentiality: z.enum(['public', 'internal', 'confidential', 'secret']),
  documentType: z.string().min(1, 'Document type is required'),
  remarks: z.string().max(1000).optional(),
});

type DartaFormValues = z.infer<typeof dartaFormSchema>;

interface SelectedFile {
  id: string;
  file: File;
  preview?: string;
}

interface Recipient {
  id: string;
  userId: string;
  userName: string;
  userDesignation: string;
  type: 'primary' | 'cc';
}

export default function NewDarta() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [showRecipientSelector, setShowRecipientSelector] = useState(false);
  const [recipientType, setRecipientType] = useState<'primary' | 'cc'>('primary');

  const form = useForm<DartaFormValues>({
    resolver: zodResolver(dartaFormSchema),
    defaultValues: {
      senderName: '',
      senderOrg: '',
      senderAddress: '',
      subject: '',
      referenceNumber: '',
      priority: 'normal',
      confidentiality: 'public',
      documentType: '',
      remarks: '',
      receivedDate: new Date(),
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: SelectedFile[] = [];
    Array.from(files).forEach((file) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return;
      }

      const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newFiles.push({ id, file });
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = ''; // Reset input
  }, []);

  // Remove selected file
  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Add recipient
  const addRecipient = useCallback((userId: string) => {
    const existingUser = mockUsers.find((u) => u.id === userId);
    if (!existingUser) return;

    // Check if already added
    if (recipients.some((r) => r.userId === userId)) {
      toast.error('This user is already added');
      return;
    }

    const newRecipient: Recipient = {
      id: `rec-${Date.now()}`,
      userId: existingUser.id,
      userName: existingUser.name,
      userDesignation: existingUser.designation,
      type: recipientType,
    };

    setRecipients((prev) => [...prev, newRecipient]);
    setShowRecipientSelector(false);
  }, [recipients, recipientType]);

  // Remove recipient
  const removeRecipient = useCallback((id: string) => {
    setRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Handle form submission
  const onSubmit = async (data: DartaFormValues) => {
    if (recipients.filter((r) => r.type === 'primary').length === 0) {
      toast.error('Please add at least one primary recipient');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Generate mock darta number
      const dartaNumber = `2081-${String(Date.now()).slice(-3)}`;

      console.log('Form data:', data);
      console.log('Files:', selectedFiles);
      console.log('Recipients:', recipients);

      toast.success(`Darta #${dartaNumber} created successfully`);
      navigate('/darta');
    } catch (error) {
      toast.error('Failed to create Darta. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableUsers = mockUsers.filter(
    (u) => u.id !== user?.id && u.isActive && !recipients.some((r) => r.userId === u.id)
  );

  const primaryRecipients = recipients.filter((r) => r.type === 'primary');
  const ccRecipients = recipients.filter((r) => r.type === 'cc');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/darta')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Darta Registration</h1>
          <p className="text-muted-foreground">Register an incoming letter</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Sender Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sender Information</CardTitle>
                  <CardDescription>Details about the letter sender</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="senderName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sender Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter sender name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="senderOrg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Organization</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter organization" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="senderAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter sender address"
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Letter Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Letter Details</CardTitle>
                  <CardDescription>Information about the letter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter letter subject"
                            className="resize-none"
                            rows={2}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="letterDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Letter Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="receivedDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Received Date *</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                  )}
                                >
                                  {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date > new Date()}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="referenceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter reference number (if any)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Original reference number from the sender
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Classification */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Classification</CardTitle>
                  <CardDescription>Priority and document type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="urgent">Urgent</SelectItem>
                              <SelectItem value="confidential">Confidential</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confidentiality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confidentiality *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">Public</SelectItem>
                              <SelectItem value="internal">Internal</SelectItem>
                              <SelectItem value="confidential">Confidential</SelectItem>
                              <SelectItem value="secret">Secret</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="documentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {mockDocumentTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Internal Remarks</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add any internal notes or remarks"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Recipients & Attachments */}
            <div className="space-y-6">
              {/* Recipients */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recipients</CardTitle>
                  <CardDescription>Who should handle this letter</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Primary Recipients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Primary Recipients *</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRecipientType('primary');
                          setShowRecipientSelector(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {primaryRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">
                        No primary recipients added
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {primaryRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-medium">{recipient.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {recipient.userDesignation}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeRecipient(recipient.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* CC Recipients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">CC (Bodhartha)</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRecipientType('cc');
                          setShowRecipientSelector(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    {ccRecipients.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No CC recipients</p>
                    ) : (
                      <div className="space-y-2">
                        {ccRecipients.map((recipient) => (
                          <div
                            key={recipient.id}
                            className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                          >
                            <div>
                              <p className="text-sm font-medium">{recipient.userName}</p>
                              <p className="text-xs text-muted-foreground">
                                {recipient.userDesignation}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeRecipient(recipient.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recipient Selector Popover */}
                  {showRecipientSelector && (
                    <div className="border rounded-md p-2">
                      <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandList>
                          <CommandEmpty>No users found.</CommandEmpty>
                          <CommandGroup>
                            {availableUsers.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={u.name}
                                onSelect={() => addRecipient(u.id)}
                                className="cursor-pointer"
                              >
                                <div>
                                  <p className="font-medium">{u.name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {u.designation} • {u.officeName}
                                  </p>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setShowRecipientSelector(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* File Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments</CardTitle>
                  <CardDescription>Upload related documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Upload Zone */}
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, JPG, PNG (max 10MB)
                      </p>
                    </label>
                  </div>

                  {/* Selected Files */}
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file.size)}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 flex-shrink-0"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Summary & Submit */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attachments</span>
                      <span>{selectedFiles.length} file(s)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Recipients</span>
                      <span>{recipients.length} user(s)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created by</span>
                      <span>{user?.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Creating...' : 'Create Darta'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate('/darta')}
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
