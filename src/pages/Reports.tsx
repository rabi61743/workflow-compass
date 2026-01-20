import { useState } from 'react';
import {
  FileText,
  Send,
  Clock,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
} from 'lucide-react';
import { useReportsOverview } from '@/hooks/use-reports';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { cn } from '@/lib/utils';

// Fallback mock data for when API doesn't return data
const fallbackTrendData = [
  { month: 'Baisakh', darta: 45, chalani: 32 },
  { month: 'Jestha', darta: 52, chalani: 41 },
  { month: 'Ashadh', darta: 48, chalani: 38 },
  { month: 'Shrawan', darta: 61, chalani: 45 },
  { month: 'Bhadra', darta: 55, chalani: 52 },
  { month: 'Ashwin', darta: 67, chalani: 58 },
  { month: 'Kartik', darta: 72, chalani: 61 },
  { month: 'Mangsir', darta: 58, chalani: 48 },
];

const fallbackStatusDistribution = [
  { name: 'Pending', value: 23, color: '#f59e0b' },
  { name: 'In Review', value: 45, color: '#3b82f6' },
  { name: 'Approved', value: 89, color: '#22c55e' },
  { name: 'Rejected', value: 12, color: '#ef4444' },
  { name: 'Closed', value: 67, color: '#6b7280' },
];

const fallbackDepartmentWorkload = [
  { department: 'IT Dept', darta: 34, chalani: 28 },
  { department: 'Finance', darta: 45, chalani: 38 },
  { department: 'HR', darta: 23, chalani: 31 },
  { department: 'Operations', darta: 56, chalani: 42 },
  { department: 'Admin', darta: 38, chalani: 35 },
];

const fallbackSlaData = [
  { name: 'On Time', value: 156, color: '#22c55e' },
  { name: 'Warning', value: 23, color: '#f59e0b' },
  { name: 'Breached', value: 8, color: '#ef4444' },
];

const fallbackWeeklyActivity = [
  { day: 'Sun', documents: 12 },
  { day: 'Mon', documents: 45 },
  { day: 'Tue', documents: 38 },
  { day: 'Wed', documents: 52 },
  { day: 'Thu', documents: 48 },
  { day: 'Fri', documents: 41 },
  { day: 'Sat', documents: 8 },
];

export default function Reports() {
  const [dateRange, setDateRange] = useState<'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year'>('this_month');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: reportsData, isLoading } = useReportsOverview({ date_range: dateRange });

  // Use API data or fallback to mock data
  const stats = reportsData?.stats || {
    totalDarta: 156,
    dartaChange: '+12%',
    totalChalani: 89,
    chalaniChange: '+8%',
    pendingActions: 23,
    pendingChange: '-5%',
    slaBreaches: 8,
    slaBreachChange: '+2',
  };

  const trendData = reportsData?.trends?.length ? reportsData.trends : fallbackTrendData;
  const statusDistribution = reportsData?.statusDistribution?.length ? reportsData.statusDistribution : fallbackStatusDistribution;
  const departmentWorkload = reportsData?.departmentWorkload?.length ? reportsData.departmentWorkload : fallbackDepartmentWorkload;
  const slaData = reportsData?.slaData?.length ? reportsData.slaData : fallbackSlaData;
  const weeklyActivity = reportsData?.weeklyActivity?.length ? reportsData.weeklyActivity : fallbackWeeklyActivity;
  const slaComplianceRate = reportsData?.slaComplianceRate || 83;
  const averageProcessingTime = reportsData?.averageProcessingTime || 18.5;

  const statCards = [
    {
      title: 'Total Darta',
      value: String(stats.totalDarta),
      change: stats.dartaChange,
      trend: stats.dartaChange.startsWith('+') ? 'up' : 'down',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Chalani',
      value: String(stats.totalChalani),
      change: stats.chalaniChange,
      trend: stats.chalaniChange.startsWith('+') ? 'up' : 'down',
      icon: Send,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Actions',
      value: String(stats.pendingActions),
      change: stats.pendingChange,
      trend: stats.pendingChange.startsWith('-') ? 'down' : 'up',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      title: 'SLA Breaches',
      value: String(stats.slaBreaches),
      change: stats.slaBreachChange,
      trend: stats.slaBreachChange.startsWith('+') ? 'up' : 'down',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">Monitor document flow and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(v: typeof dateRange) => setDateRange(v)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardDescription>{stat.title}</CardDescription>
              <div className={cn('p-2 rounded-lg', stat.bgColor)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl font-bold">{stat.value}</div>
                <div className={cn(
                  'flex items-center text-sm font-medium',
                  stat.trend === 'up' && stat.title !== 'SLA Breaches' ? 'text-green-600' : 
                  stat.trend === 'down' && stat.title === 'Pending Actions' ? 'text-green-600' : 'text-red-600'
                )}>
                  {stat.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="sla">SLA Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Document Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Document Flow Trends</CardTitle>
                <CardDescription>Monthly Darta and Chalani counts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="darta"
                      stackId="1"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.6}
                      name="Darta"
                    />
                    <Area
                      type="monotone"
                      dataKey="chalani"
                      stackId="1"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.6}
                      name="Chalani"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status Distribution</CardTitle>
                <CardDescription>Current document status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Weekly Activity</CardTitle>
              <CardDescription>Document processing by day of week</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="documents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Document Volume Over Time</CardTitle>
              <CardDescription>Compare Darta vs Chalani trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="darta"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                    name="Darta (Incoming)"
                  />
                  <Line
                    type="monotone"
                    dataKey="chalani"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ fill: '#8b5cf6' }}
                    name="Chalani (Outgoing)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Department Workload</CardTitle>
              <CardDescription>Document distribution by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentWorkload} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="department" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="darta" fill="#3b82f6" name="Darta" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="chalani" fill="#8b5cf6" name="Chalani" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sla" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">SLA Compliance</CardTitle>
                <CardDescription>Document processing time compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={slaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {slaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">SLA Summary</CardTitle>
                <CardDescription>Quick view of SLA metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {slaData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{item.value}</span>
                        <Badge style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                          {Math.round((item.value / slaData.reduce((a, b) => a + b.value, 0)) * 100)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Average processing time: <span className="font-medium text-foreground">{averageProcessingTime} hours</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    SLA compliance rate: <span className="font-medium text-green-600">{slaComplianceRate}%</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
