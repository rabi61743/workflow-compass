import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  AlertTriangle,
  Info,
  FileText,
  Filter,
  Settings,
} from 'lucide-react';
import { mockNotifications } from '@/lib/mock-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Extended mock notifications
const extendedNotifications = [
  ...mockNotifications,
  {
    id: 'notif-004',
    type: 'task' as const,
    title: 'Chalani Pending Review',
    message: 'Chalani #CH-2081-003 requires your approval',
    isRead: false,
    createdAt: '2024-11-13T09:00:00Z',
    linkTo: '/chalani/chalani-003',
  },
  {
    id: 'notif-005',
    type: 'sla_breach' as const,
    title: 'SLA Breached',
    message: 'Darta #2081-005 has exceeded the deadline',
    isRead: true,
    createdAt: '2024-11-12T14:00:00Z',
    linkTo: '/darta/darta-005',
  },
  {
    id: 'notif-006',
    type: 'info' as const,
    title: 'System Maintenance',
    message: 'Scheduled maintenance on Nov 15, 2024 at 10:00 PM',
    isRead: true,
    createdAt: '2024-11-11T10:00:00Z',
  },
];

const notificationIcons: Record<string, React.ElementType> = {
  task: FileText,
  sla_warning: Clock,
  sla_breach: AlertTriangle,
  info: Info,
};

const notificationColors: Record<string, string> = {
  task: 'bg-blue-100 text-blue-600',
  sla_warning: 'bg-amber-100 text-amber-600',
  sla_breach: 'bg-red-100 text-red-600',
  info: 'bg-gray-100 text-gray-600',
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(extendedNotifications);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('all');

  // Preferences
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    slaWarnings: true,
    taskAssignments: true,
    statusUpdates: true,
    dailyDigest: false,
  });

  const filteredNotifications = useMemo(() => {
    let filtered = notifications;

    if (activeTab === 'unread') {
      filtered = filtered.filter((n) => !n.isRead);
    } else if (activeTab === 'read') {
      filtered = filtered.filter((n) => n.isRead);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter((n) => n.type === typeFilter);
    }

    return filtered;
  }, [notifications, activeTab, typeFilter]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    toast.success('Marked as read');
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    toast.success('Notification deleted');
  };

  const handleNotificationClick = (notification: typeof extendedNotifications[0]) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.linkTo) {
      navigate(notification.linkTo);
    }
  };

  const getNotificationIcon = (type: string) => {
    const Icon = notificationIcons[type] || Info;
    return Icon;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0
              ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex items-center justify-between">
                    <TabsList>
                      <TabsTrigger value="all">
                        All
                        <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
                      </TabsTrigger>
                      <TabsTrigger value="unread">
                        Unread
                        {unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">{unreadCount}</Badge>
                        )}
                      </TabsTrigger>
                      <TabsTrigger value="read">Read</TabsTrigger>
                    </TabsList>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="task">Tasks</SelectItem>
                        <SelectItem value="sla_warning">SLA Warnings</SelectItem>
                        <SelectItem value="sla_breach">SLA Breaches</SelectItem>
                        <SelectItem value="info">Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No notifications</h3>
                    <p className="text-muted-foreground">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredNotifications.map((notification) => {
                      const Icon = getNotificationIcon(notification.type);
                      return (
                        <div
                          key={notification.id}
                          className={cn(
                            'flex items-start gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer',
                            !notification.isRead && 'bg-muted/30'
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className={cn('p-2 rounded-lg shrink-0', notificationColors[notification.type])}>
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={cn('font-medium', !notification.isRead && 'text-foreground')}>
                                  {notification.title}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {notification.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {format(new Date(notification.createdAt), 'PPp')}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!notification.isRead && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!notification.isRead) {
                                      markAsRead(notification.id);
                                    }
                                  }}
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(notification.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Preferences */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={preferences.emailNotifications}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, emailNotifications: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SLA Warnings</Label>
                  <p className="text-xs text-muted-foreground">Alert before deadlines</p>
                </div>
                <Switch
                  checked={preferences.slaWarnings}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, slaWarnings: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Assignments</Label>
                  <p className="text-xs text-muted-foreground">When documents are assigned</p>
                </div>
                <Switch
                  checked={preferences.taskAssignments}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, taskAssignments: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Updates</Label>
                  <p className="text-xs text-muted-foreground">Document status changes</p>
                </div>
                <Switch
                  checked={preferences.statusUpdates}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, statusUpdates: checked })
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Digest</Label>
                  <p className="text-xs text-muted-foreground">Summary email at end of day</p>
                </div>
                <Switch
                  checked={preferences.dailyDigest}
                  onCheckedChange={(checked) =>
                    setPreferences({ ...preferences, dailyDigest: checked })
                  }
                />
              </div>

              <Button className="w-full" onClick={() => toast.success('Preferences saved')}>
                Save Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Task Notifications</span>
                <span className="font-medium">
                  {notifications.filter((n) => n.type === 'task').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SLA Warnings</span>
                <span className="font-medium text-amber-600">
                  {notifications.filter((n) => n.type === 'sla_warning').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">SLA Breaches</span>
                <span className="font-medium text-red-600">
                  {notifications.filter((n) => n.type === 'sla_breach').length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
