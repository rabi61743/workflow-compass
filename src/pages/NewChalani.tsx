import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Upload,
  X,
  FileText,
  Plus,
  Link2,
  FileIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockDartaLetters, mockLetterTemplates } from '@/lib/mock-data';
import { RecipientSelector, SelectedRecipient } from '@/components/organization/RecipientSelector';
import { useOfficeList } from '@/hooks/use-organization';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Form validation schema
const chalaniFormSchema = z.object({
  receiverType: z.enum(['internal', 'external']),
  receiverName: z.string().min(2, 'Receiver name is required').max(255),
  receiverOrg: z.string().max(255).optional(),
  receiverAddress: z.string().max(500).optional(),
  receiverOffice: z.string().optional(),
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(500),
  priority: z.enum(['normal', 'urgent', 'confidential']),
  referenceDarta: z.string().optional(),
});

type ChalaniFormValues = z.infer<typeof chalaniFormSchema>;

interface SelectedFile {
  id: string;
  file: File;
}

export default function NewChalani() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [ccRecipients, setCcRecipients] = useState<SelectedRecipient[]>([]);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showDartaSelector, setShowDartaSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // For internal receiver selection
  const { data: officesData } = useOfficeList({});
  const offices = officesData?.results || [];

  const referenceDartaId = searchParams.get('ref');

  const form = useForm<ChalaniFormValues>({
    resolver: zodResolver(chalaniFormSchema),
    defaultValues: {
      receiverType: 'external',
      receiverName: '',
      receiverOrg: '',
      receiverAddress: '',
      receiverOffice: '',
      subject: '',
      priority: 'normal',
      referenceDarta: referenceDartaId || '',
    },
  });

  const receiverType = form.watch('receiverType');

  useEffect(() => {
    if (referenceDartaId) {
      const refDarta = mockDartaLetters.find(d => d.id === referenceDartaId);
      if (refDarta) {
        form.setValue('subject', `Re: ${refDarta.subject}`);
        form.setValue('receiverName', refDarta.senderName);
        form.setValue('receiverOrg', refDarta.senderOrg);
      }
    }
  }, [referenceDartaId, form]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: SelectedFile[] = [];
    Array.from(files).forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File ${file.name} is too large (max 10MB)`);
        return;
      }
      const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      newFiles.push({ id, file });
    });
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = '';
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const addCCRecipient = useCallback((recipient: SelectedRecipient) => {
    setCcRecipients((prev) => [...prev, recipient]);
  }, []);

  const removeCCRecipient = useCallback((id: string) => {
    setCcRecipients((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = mockLetterTemplates.find((t) => t.id === templateId);
    if (template) {
      setContent(template.content);
      setSelectedTemplate(templateId);
      setShowTemplateDialog(false);
      toast.success(`Template "${template.name}" applied`);
    }
  }, []);

  const linkDarta = useCallback((dartaId: string) => {
    const darta = mockDartaLetters.find((d) => d.id === dartaId);
    if (darta) {
      form.setValue('referenceDarta', dartaId);
      form.setValue('subject', `Re: ${darta.subject}`);
      setShowDartaSelector(false);
      toast.success('Darta linked successfully');
    }
  }, [form]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const onSubmit = async (data: ChalaniFormValues) => {
    if (!content.trim() || content === '<p></p>') {
      toast.error('Please write the letter content');
      return;
    }
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      console.log('Form data:', data);
      console.log('Content:', content);
      console.log('Files:', selectedFiles);
      console.log('CC Recipients:', ccRecipients);
      toast.success('Chalani draft created successfully');
      navigate('/chalani');
    } catch (error) {
      toast.error('Failed to create Chalani. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const referenceDarta = mockDartaLetters.find(d => d.id === form.watch('referenceDarta'));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/chalani')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Chalani</h1>
          <p className="text-muted-foreground">Draft an outgoing letter</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Form - Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Receiver Type Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Receiver Type</CardTitle>
                  <CardDescription>Is this letter for internal or external recipient?</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="receiverType"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-2 gap-4"
                          >
                            <div>
                              <RadioGroupItem value="external" id="external" className="peer sr-only" />
                              <Label
                                htmlFor="external"
                                className={cn(
                                  'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer',
                                  field.value === 'external' && 'border-primary bg-primary/5'
                                )}
                              >
                                <ExternalLink className="mb-3 h-6 w-6" />
                                <span className="font-medium">External</span>
                                <span className="text-xs text-muted-foreground text-center mt-1">Outside organization</span>
                              </Label>
                            </div>
                            <div>
                              <RadioGroupItem value="internal" id="internal" className="peer sr-only" />
                              <Label
                                htmlFor="internal"
                                className={cn(
                                  'flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary cursor-pointer',
                                  field.value === 'internal' && 'border-primary bg-primary/5'
                                )}
                              >
                                <Building2 className="mb-3 h-6 w-6" />
                                <span className="font-medium">Internal</span>
                                <span className="text-xs text-muted-foreground text-center mt-1">Within Nepal Telecom</span>
                              </Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Receiver Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Receiver Information</CardTitle>
                  <CardDescription>
                    {receiverType === 'internal' ? 'Select internal office/department' : 'Enter external recipient details'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {receiverType === 'internal' ? (
                    <FormField
                      control={form.control}
                      name="receiverOffice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Select Office *</FormLabel>
                          <Select onValueChange={(value) => {
                            field.onChange(value);
                            const office = offices.find(o => o.id === value);
                            if (office) {
                              form.setValue('receiverName', office.name);
                              form.setValue('receiverOrg', 'Nepal Telecom');
                            }
                          }} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select an office" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {offices.filter(o => o.isActive).map((office) => (
                                <SelectItem key={office.id} value={office.id}>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">{office.code}</Badge>
                                    {office.name}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FormField
                          control={form.control}
                          name="receiverName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Receiver Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter receiver name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="receiverOrg"
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
                        name="receiverAddress"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Enter receiver address" className="resize-none" rows={2} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Letter Content */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Letter Content</CardTitle>
                      <CardDescription>Write or use a template</CardDescription>
                    </div>
                    <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="sm">
                          <FileIcon className="mr-2 h-4 w-4" />
                          Use Template
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Select Template</DialogTitle>
                          <DialogDescription>Choose a template to start with</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[400px] pr-4">
                          <div className="space-y-2">
                            {mockLetterTemplates.map((template) => (
                              <div
                                key={template.id}
                                onClick={() => applyTemplate(template.id)}
                                className={cn(
                                  'p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors',
                                  selectedTemplate === template.id && 'border-primary bg-primary/5'
                                )}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-medium">{template.name}</span>
                                  <Badge variant="secondary" className="text-xs">{template.category}</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {template.content.replace(/<[^>]*>/g, '').slice(0, 100)}...
                                </p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter letter subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-2">
                    <Label>Letter Body *</Label>
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Write your letter content here..."
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="w-[200px]">
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
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Reference Darta */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Link2 className="h-4 w-4" />
                    Reference
                  </CardTitle>
                  <CardDescription>Link to an incoming letter (optional)</CardDescription>
                </CardHeader>
                <CardContent>
                  {referenceDarta ? (
                    <div className="p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline">{referenceDarta.dartaNumber}</Badge>
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => form.setValue('referenceDarta', '')}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-sm line-clamp-2">{referenceDarta.subject}</p>
                      <p className="text-xs text-muted-foreground mt-1">From: {referenceDarta.senderOrg}</p>
                    </div>
                  ) : (
                    <Dialog open={showDartaSelector} onOpenChange={setShowDartaSelector}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Link Darta
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Select Reference Darta</DialogTitle>
                          <DialogDescription>Choose an incoming letter to reference</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-2">
                            {mockDartaLetters.map((darta) => (
                              <div
                                key={darta.id}
                                onClick={() => linkDarta(darta.id)}
                                className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline">{darta.dartaNumber}</Badge>
                                  <span className="text-xs text-muted-foreground">{darta.senderOrg}</span>
                                </div>
                                <p className="text-sm line-clamp-1">{darta.subject}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>

              {/* CC Recipients - Now using RecipientSelector */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">CC Recipients</CardTitle>
                  <CardDescription>Add copy recipients from org hierarchy</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecipientSelector
                    selectedRecipients={ccRecipients}
                    onAdd={addCCRecipient}
                    onRemove={removeCCRecipient}
                    recipientRole="cc"
                    label="CC (Bodhartha)"
                    placeholder="Search recipients..."
                  />
                </CardContent>
              </Card>

              {/* File Attachments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Attachments</CardTitle>
                  <CardDescription>Upload supporting documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <input type="file" id="chalani-file-upload" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                    <label htmlFor="chalani-file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-medium">Click to upload</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, DOC, JPG, PNG (max 10MB)</p>
                    </label>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedFiles.map((file) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-md">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{file.file.name}</p>
                              <p className="text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0" onClick={() => removeFile(file.id)}>
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
                      <span className="text-muted-foreground">Type</span>
                      <Badge variant={receiverType === 'internal' ? 'default' : 'secondary'}>
                        {receiverType === 'internal' ? 'Internal' : 'External'}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Attachments</span>
                      <span>{selectedFiles.length} file(s)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">CC Recipients</span>
                      <span>{ccRecipients.length} recipient(s)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Created by</span>
                      <span>{user?.name}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? 'Saving...' : 'Save as Draft'}
                    </Button>
                    <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/chalani')}>
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
