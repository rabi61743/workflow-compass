import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Building,
  Calendar,
  Clock,
  Bell,
  Shield,
  Palette,
  Globe,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('general');
  const [isSaving, setIsSaving] = useState(false);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    organizationName: 'Nepal Telecom',
    organizationCode: 'NTC',
    address: 'Bhadrakali, Kathmandu',
    phone: '+977-1-4220088',
    email: 'info@ntc.net.np',
    website: 'https://www.ntc.net.np',
  });

  // Fiscal Year Settings
  const [fiscalSettings, setFiscalSettings] = useState({
    currentFiscalYear: '2081/82',
    fiscalYearStartMonth: '4', // Baisakh
    fiscalYearStartDay: '1',
    autoIncrementDarta: true,
    autoIncrementChalani: true,
    dartaPrefix: '',
    chalaniPrefix: 'CH-',
  });

  // SLA Settings
  const [slaSettings, setSlaSettings] = useState({
    defaultSlaHours: '48',
    urgentSlaHours: '24',
    confidentialSlaHours: '72',
    enableSlaWarnings: true,
    warningThresholdHours: '4',
    enableSlaBreachNotification: true,
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    slaWarnings: true,
    taskAssignments: true,
    statusUpdates: true,
    dailyDigest: false,
    weeklyReport: true,
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'system',
    language: 'en',
    dateFormat: 'PP',
    timeFormat: '12h',
    pageSize: '20',
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    toast.info('Settings reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and preferences</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal Year</TabsTrigger>
          <TabsTrigger value="sla">SLA</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-4 w-4" />
                Organization Information
              </CardTitle>
              <CardDescription>Basic information about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name</Label>
                  <Input
                    id="orgName"
                    value={generalSettings.organizationName}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, organizationName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgCode">Organization Code</Label>
                  <Input
                    id="orgCode"
                    value={generalSettings.organizationCode}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, organizationCode: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={generalSettings.address}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, address: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={generalSettings.phone}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, phone: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={generalSettings.email}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={generalSettings.website}
                    onChange={(e) =>
                      setGeneralSettings({ ...generalSettings, website: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fiscal Year Settings */}
        <TabsContent value="fiscal" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Fiscal Year Configuration
              </CardTitle>
              <CardDescription>Configure fiscal year and document numbering</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currentFy">Current Fiscal Year</Label>
                  <Input
                    id="currentFy"
                    value={fiscalSettings.currentFiscalYear}
                    onChange={(e) =>
                      setFiscalSettings({ ...fiscalSettings, currentFiscalYear: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fiscal Year Start</Label>
                  <div className="flex gap-2">
                    <Select
                      value={fiscalSettings.fiscalYearStartMonth}
                      onValueChange={(value) =>
                        setFiscalSettings({ ...fiscalSettings, fiscalYearStartMonth: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Baisakh</SelectItem>
                        <SelectItem value="2">Jestha</SelectItem>
                        <SelectItem value="3">Ashadh</SelectItem>
                        <SelectItem value="4">Shrawan</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-20"
                      placeholder="Day"
                      value={fiscalSettings.fiscalYearStartDay}
                      onChange={(e) =>
                        setFiscalSettings({ ...fiscalSettings, fiscalYearStartDay: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-sm font-medium">Document Numbering</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="dartaPrefix">Darta Number Prefix</Label>
                    <Input
                      id="dartaPrefix"
                      placeholder="e.g., D-"
                      value={fiscalSettings.dartaPrefix}
                      onChange={(e) =>
                        setFiscalSettings({ ...fiscalSettings, dartaPrefix: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="chalaniPrefix">Chalani Number Prefix</Label>
                    <Input
                      id="chalaniPrefix"
                      placeholder="e.g., CH-"
                      value={fiscalSettings.chalaniPrefix}
                      onChange={(e) =>
                        setFiscalSettings({ ...fiscalSettings, chalaniPrefix: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-increment Darta Numbers</Label>
                    <p className="text-xs text-muted-foreground">Automatically generate next number</p>
                  </div>
                  <Switch
                    checked={fiscalSettings.autoIncrementDarta}
                    onCheckedChange={(checked) =>
                      setFiscalSettings({ ...fiscalSettings, autoIncrementDarta: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-increment Chalani Numbers</Label>
                    <p className="text-xs text-muted-foreground">Automatically generate next number</p>
                  </div>
                  <Switch
                    checked={fiscalSettings.autoIncrementChalani}
                    onCheckedChange={(checked) =>
                      setFiscalSettings({ ...fiscalSettings, autoIncrementChalani: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SLA Settings */}
        <TabsContent value="sla" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                SLA Configuration
              </CardTitle>
              <CardDescription>Configure service level agreement timelines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultSla">Default SLA (hours)</Label>
                  <Input
                    id="defaultSla"
                    type="number"
                    value={slaSettings.defaultSlaHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, defaultSlaHours: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgentSla">Urgent SLA (hours)</Label>
                  <Input
                    id="urgentSla"
                    type="number"
                    value={slaSettings.urgentSlaHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, urgentSlaHours: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidentialSla">Confidential SLA (hours)</Label>
                  <Input
                    id="confidentialSla"
                    type="number"
                    value={slaSettings.confidentialSlaHours}
                    onChange={(e) =>
                      setSlaSettings({ ...slaSettings, confidentialSlaHours: e.target.value })
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SLA Warnings</Label>
                    <p className="text-xs text-muted-foreground">Notify before deadline approaches</p>
                  </div>
                  <Switch
                    checked={slaSettings.enableSlaWarnings}
                    onCheckedChange={(checked) =>
                      setSlaSettings({ ...slaSettings, enableSlaWarnings: checked })
                    }
                  />
                </div>

                {slaSettings.enableSlaWarnings && (
                  <div className="space-y-2 pl-4 border-l-2">
                    <Label htmlFor="warningThreshold">Warning Threshold (hours before deadline)</Label>
                    <Input
                      id="warningThreshold"
                      type="number"
                      className="w-32"
                      value={slaSettings.warningThresholdHours}
                      onChange={(e) =>
                        setSlaSettings({ ...slaSettings, warningThresholdHours: e.target.value })
                      }
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable SLA Breach Notifications</Label>
                    <p className="text-xs text-muted-foreground">Notify when deadline is missed</p>
                  </div>
                  <Switch
                    checked={slaSettings.enableSlaBreachNotification}
                    onCheckedChange={(checked) =>
                      setSlaSettings({ ...slaSettings, enableSlaBreachNotification: checked })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notification Preferences
              </CardTitle>
              <CardDescription>Configure system-wide notification settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-xs text-muted-foreground">Send notifications via email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
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
                  checked={notificationSettings.slaWarnings}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, slaWarnings: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Assignments</Label>
                  <p className="text-xs text-muted-foreground">When documents are assigned</p>
                </div>
                <Switch
                  checked={notificationSettings.taskAssignments}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, taskAssignments: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status Updates</Label>
                  <p className="text-xs text-muted-foreground">Document status changes</p>
                </div>
                <Switch
                  checked={notificationSettings.statusUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, statusUpdates: checked })
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
                  checked={notificationSettings.dailyDigest}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, dailyDigest: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Report</Label>
                  <p className="text-xs text-muted-foreground">Weekly summary email</p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyReport}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, weeklyReport: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Appearance & Localization
              </CardTitle>
              <CardDescription>Customize the look and regional settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select
                    value={appearanceSettings.theme}
                    onValueChange={(value) =>
                      setAppearanceSettings({ ...appearanceSettings, theme: value })
                    }
                  >
                    <SelectTrigger id="theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={appearanceSettings.language}
                    onValueChange={(value) =>
                      setAppearanceSettings({ ...appearanceSettings, language: value })
                    }
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ne">नेपाली (Nepali)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateFormat">Date Format</Label>
                  <Select
                    value={appearanceSettings.dateFormat}
                    onValueChange={(value) =>
                      setAppearanceSettings({ ...appearanceSettings, dateFormat: value })
                    }
                  >
                    <SelectTrigger id="dateFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PP">Nov 13, 2024</SelectItem>
                      <SelectItem value="dd/MM/yyyy">13/11/2024</SelectItem>
                      <SelectItem value="yyyy-MM-dd">2024-11-13</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timeFormat">Time Format</Label>
                  <Select
                    value={appearanceSettings.timeFormat}
                    onValueChange={(value) =>
                      setAppearanceSettings({ ...appearanceSettings, timeFormat: value })
                    }
                  >
                    <SelectTrigger id="timeFormat">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12-hour (2:30 PM)</SelectItem>
                      <SelectItem value="24h">24-hour (14:30)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pageSize">Default Page Size</Label>
                  <Select
                    value={appearanceSettings.pageSize}
                    onValueChange={(value) =>
                      setAppearanceSettings({ ...appearanceSettings, pageSize: value })
                    }
                  >
                    <SelectTrigger id="pageSize">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="20">20 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
                      <SelectItem value="100">100 items</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
