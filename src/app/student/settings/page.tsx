'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/auth-context';
import {
  ArrowLeft,
  Loader2,
  Save,
  Bell,
  Mail,
  Lock,
  User,
  Globe,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface NotificationPreferences {
  application_updates: boolean;
  meeting_reminders: boolean;
  document_requests: boolean;
  promotional_emails: boolean;
  weekly_digest: boolean;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function StudentSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences>({
    application_updates: true,
    meeting_reminders: true,
    document_requests: true,
    promotional_emails: false,
    weekly_digest: true,
  });
  
  // Security settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Language preference
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user?.role === 'student') {
      // Load preferences (would come from API in real app)
      setIsLoading(false);
    }
  }, [user]);

  const handleNotificationChange = (key: keyof NotificationPreferences, value: boolean) => {
    setNotificationPrefs(prev => ({ ...prev, [key]: value }));
  };

  const saveNotificationPreferences = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      // In a real app, this would save to the database
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!securitySettings.currentPassword || !securitySettings.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (securitySettings.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      // In a real app, this would call the Supabase auth API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast.success('Password changed successfully');
      setShowPasswordDialog(false);
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    toast.error('Account deletion requires admin verification. Please contact support.');
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" asChild className="mb-2 -ml-4">
            <Link href="/student">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account preferences and security
          </p>
        </div>

        <div className="space-y-6">
          {/* Notification Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose how you want to receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Application Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when your application status changes
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.application_updates}
                  onCheckedChange={(checked) => handleNotificationChange('application_updates', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Meeting Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive reminders before scheduled meetings
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.meeting_reminders}
                  onCheckedChange={(checked) => handleNotificationChange('meeting_reminders', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Document Requests</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified when additional documents are requested
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.document_requests}
                  onCheckedChange={(checked) => handleNotificationChange('document_requests', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your application progress
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.weekly_digest}
                  onCheckedChange={(checked) => handleNotificationChange('weekly_digest', checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Promotional Emails</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive news about new programs and special offers
                  </p>
                </div>
                <Switch
                  checked={notificationPrefs.promotional_emails}
                  onCheckedChange={(checked) => handleNotificationChange('promotional_emails', checked)}
                />
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={saveNotificationPreferences} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Password</Label>
                  <p className="text-sm text-muted-foreground">
                    Last changed: Never (using social login)
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Badge variant="outline">Coming Soon</Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Active Sessions</Label>
                  <p className="text-sm text-muted-foreground">
                    Manage your active login sessions
                  </p>
                </div>
                <Button variant="outline">
                  View Sessions
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Language & Region */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Set your preferred language and timezone
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <select
                    id="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="zh">中文</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <select
                    id="timezone"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    defaultValue="Asia/Shanghai"
                  >
                    <option value="Asia/Shanghai">China (Beijing)</option>
                    <option value="Asia/Tokyo">Japan (Tokyo)</option>
                    <option value="Asia/Seoul">Korea (Seoul)</option>
                    <option value="America/New_York">US (Eastern)</option>
                    <option value="America/Los_Angeles">US (Pacific)</option>
                    <option value="Europe/London">UK (London)</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Input value="Student" disabled className="bg-muted" />
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p>Account created: {new Date().toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Delete Account</Label>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Button variant="destructive" onClick={deleteAccount}>
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Change Password Dialog */}
        <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your current password and choose a new one
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={securitySettings.currentPassword}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={securitySettings.newPassword}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, newPassword: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={securitySettings.confirmPassword}
                  onChange={(e) => setSecuritySettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </div>
              
              {securitySettings.newPassword && securitySettings.newPassword.length < 8 && (
                <div className="flex items-center gap-2 text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Password must be at least 8 characters
                </div>
              )}
              
              {securitySettings.newPassword && securitySettings.confirmPassword && 
               securitySettings.newPassword !== securitySettings.confirmPassword && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Passwords do not match
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Changing...
                  </>
                ) : (
                  'Change Password'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
