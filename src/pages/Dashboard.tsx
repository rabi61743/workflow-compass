import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockDashboardStats, mockDartaLetters, mockNotifications } from '@/lib/mock-data';
import {
  Inbox,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const stats = mockDashboardStats;

  const formatRole = (role: string) => {
    return role
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const recentTasks = mockDartaLetters.filter(d => d.status !== 'closed').slice(0, 5);
  const urgentNotifications = mockNotifications.filter(n => n.type === 'sla_warning' || n.type === 'sla_breach');

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back, {user?.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground">
            {formatRole(user?.role || '')} • {user?.officeName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/darta/new')}>
            <Inbox className="mr-2 h-4 w-4" />
            New Darta
          </Button>
          <Button variant="outline" onClick={() => navigate('/chalani/new')}>
            <Send className="mr-2 h-4 w-4" />
            New Chalani
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Darta</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDarta}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">{stats.pendingDarta}</span> pending review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chalani</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalChalani}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-primary font-medium">{stats.pendingChalani}</span> in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Tasks</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.overdueTasks}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedThisWeek}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>My Pending Tasks</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/darta')}>
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>Documents awaiting your action</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTasks.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-green-600" />
                  <p>No pending tasks!</p>
                </div>
              ) : (
                recentTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/darta/${task.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 h-2 w-2 rounded-full ${
                        task.priority === 'urgent' ? 'bg-destructive' :
                        task.priority === 'confidential' ? 'bg-amber-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium line-clamp-1">{task.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {task.dartaNumber} • {task.senderOrg}
                        </p>
                      </div>
                    </div>
                    <Badge variant={task.status === 'pending' ? 'secondary' : 'outline'}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Alerts & Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>SLA Alerts</span>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notifications')}>
                View all
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </CardTitle>
            <CardDescription>Tasks approaching or past deadline</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {urgentNotifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CheckCircle2 className="mx-auto h-8 w-8 mb-2 text-green-600" />
                  <p>No SLA alerts!</p>
                </div>
              ) : (
                urgentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20"
                  >
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
