'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Mail,
  Bell,
  Globe,
  Save,
  Loader2,
  Building,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Database,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface PlatformSettings {
  site_name: string;
  site_description: string;
  support_email: string;
  notification_email_enabled: boolean;
  meeting_reminder_hours: number;
  auto_approve_partners: boolean;
  max_applications_per_student: number;
  maintenance_mode: boolean;
  maintenance_message: string;
  default_meeting_duration: number;
  allowed_file_types: string;
  max_file_size: number;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>({
    site_name: 'Study In China Academy',
    site_description: 'Connect international students with Chinese universities',
    support_email: 'support@studyinchina.academy',
    notification_email_enabled: true,
    meeting_reminder_hours: 24,
    auto_approve_partners: false,
    max_applications_per_student: 5,
    maintenance_mode: false,
    maintenance_message: 'The platform is currently under maintenance. Please check back later.',
    default_meeting_duration: 30,
    allowed_file_types: 'pdf,doc,docx,jpg,jpeg,png',
    max_file_size: 10,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Settings saved successfully');
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const SettingRow = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string; 
    description?: string; 
    children: React.ReactNode 
  }) => (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="space-y-0.5 flex-1">
        <Label className="text-base">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-shrink-0">
        {children}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 h-auto p-1">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Applications</span>
          </TabsTrigger>
          <TabsTrigger value="meetings" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Meetings</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Site Information</CardTitle>
              </div>
              <CardDescription>Basic platform configuration and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input
                    id="site_name"
                    value={settings.site_name}
                    onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input
                    id="support_email"
                    type="email"
                    value={settings.support_email}
                    onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="site_description">Site Description</Label>
                <Textarea
                  id="site_description"
                  value={settings.site_description}
                  onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Partner Registration</CardTitle>
              </div>
              <CardDescription>Control how partners register and get approved</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">Auto-approve Partners</Label>
                    <Badge variant="outline" className="text-amber-600 bg-amber-500/10">
                      Not Recommended
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve new partner registrations without admin review
                  </p>
                </div>
                <Switch
                  checked={settings.auto_approve_partners}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, auto_approve_partners: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Applications Settings */}
        <TabsContent value="applications" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Application Rules</CardTitle>
              </div>
              <CardDescription>Configure application limits and constraints</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Max Applications per Student</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum number of active applications a student can have at once
                  </p>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={settings.max_applications_per_student}
                  onChange={(e) => setSettings({ ...settings, max_applications_per_student: parseInt(e.target.value) || 5 })}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Document Upload</CardTitle>
              </div>
              <CardDescription>Configure allowed file types and size limits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Allowed File Types</Label>
                  <p className="text-sm text-muted-foreground">
                    Comma-separated list of allowed file extensions
                  </p>
                </div>
                <Input
                  value={settings.allowed_file_types}
                  onChange={(e) => setSettings({ ...settings, allowed_file_types: e.target.value })}
                  className="w-64"
                />
              </div>
              <Separator />
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Max File Size (MB)</Label>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size for document uploads
                  </p>
                </div>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.max_file_size}
                  onChange={(e) => setSettings({ ...settings, max_file_size: parseInt(e.target.value) || 10 })}
                  className="w-24"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Meetings Settings */}
        <TabsContent value="meetings" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Meeting Defaults</CardTitle>
              </div>
              <CardDescription>Configure default meeting settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <Label className="text-base">Default Duration</Label>
                  <p className="text-sm text-muted-foreground">
                    Default duration for scheduled meetings
                  </p>
                </div>
                <Select
                  value={settings.default_meeting_duration.toString()}
                  onValueChange={(v) => 
                    setSettings({ ...settings, default_meeting_duration: parseInt(v) })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 min</SelectItem>
                    <SelectItem value="30">30 min</SelectItem>
                    <SelectItem value="45">45 min</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6 mt-0">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Email Notifications</CardTitle>
              </div>
              <CardDescription>Configure email and notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <SettingRow
                label="Enable Email Notifications"
                description="Send email notifications for important platform events"
              >
                <Switch
                  checked={settings.notification_email_enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, notification_email_enabled: checked })
                  }
                />
              </SettingRow>
              <Separator />
              <SettingRow
                label="Meeting Reminder Time"
                description="How long before a meeting to send reminder emails"
              >
                <Select
                  value={settings.meeting_reminder_hours.toString()}
                  onValueChange={(v) => 
                    setSettings({ ...settings, meeting_reminder_hours: parseInt(v) })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour before</SelectItem>
                    <SelectItem value="2">2 hours before</SelectItem>
                    <SelectItem value="12">12 hours before</SelectItem>
                    <SelectItem value="24">24 hours before</SelectItem>
                    <SelectItem value="48">48 hours before</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Email Templates</CardTitle>
              </div>
              <CardDescription>Manage notification email templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Application Submitted', status: 'active' },
                  { name: 'Application Status Update', status: 'active' },
                  { name: 'Meeting Scheduled', status: 'active' },
                  { name: 'Meeting Reminder', status: 'active' },
                  { name: 'Meeting Cancelled', status: 'active' },
                  { name: 'Partner Approved', status: 'active' },
                ].map((template) => (
                  <div
                    key={template.name}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                  >
                    <span className="text-sm font-medium">{template.name}</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Settings */}
        <TabsContent value="maintenance" className="space-y-6 mt-0">
          <Card className={settings.maintenance_mode ? 'border-amber-500/50' : ''}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className={settings.maintenance_mode ? 'h-5 w-5 text-amber-500' : 'h-5 w-5 text-muted-foreground'} />
                <CardTitle>Maintenance Mode</CardTitle>
              </div>
              <CardDescription>
                Temporarily restrict access to the platform for maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start justify-between gap-4 py-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Label className="text-base">Enable Maintenance Mode</Label>
                    {settings.maintenance_mode && (
                      <Badge className="bg-amber-500/10 text-amber-600">
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Only administrators will be able to access the platform when enabled
                  </p>
                </div>
                <Switch
                  checked={settings.maintenance_mode}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, maintenance_mode: checked })
                  }
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Maintenance Message</Label>
                <Textarea
                  value={settings.maintenance_message}
                  onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                  rows={3}
                  placeholder="Enter a message to display to users during maintenance..."
                />
                <p className="text-sm text-muted-foreground">
                  This message will be shown to all non-admin users
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                <CardTitle>System Status</CardTitle>
              </div>
              <CardDescription>Current system health and status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Database', status: 'healthy' },
                  { name: 'Email Service', status: 'healthy' },
                  { name: 'File Storage', status: 'healthy' },
                  { name: 'Authentication', status: 'healthy' },
                ].map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <span className="text-sm font-medium">{service.name}</span>
                    <Badge variant="outline" className="text-green-600 bg-green-500/10">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Healthy
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
