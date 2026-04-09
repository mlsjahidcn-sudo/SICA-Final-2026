"use client"

import * as React from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconBell,
  IconMail,
  IconLanguage,
  IconClock,
  IconLock,
  IconShield,
  IconDeviceFloppy,
  IconLoader2,
  IconRefresh,
  IconEye,
  IconFileDescription
} from "@tabler/icons-react"
import { studentApi, type UserSettings } from "@/lib/student-api"
import { toast } from "sonner"

// Common timezones
const TIMEZONES = [
  { value: 'Asia/Shanghai', label: 'China (Asia/Shanghai)' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong (Asia/Hong_Kong)' },
  { value: 'Asia/Tokyo', label: 'Japan (Asia/Tokyo)' },
  { value: 'Asia/Seoul', label: 'South Korea (Asia/Seoul)' },
  { value: 'Asia/Singapore', label: 'Singapore (Asia/Singapore)' },
  { value: 'America/New_York', label: 'New York (America/New_York)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (America/Los_Angeles)' },
  { value: 'Europe/London', label: 'London (Europe/London)' },
  { value: 'Europe/Paris', label: 'Paris (Europe/Paris)' },
  { value: 'Australia/Sydney', label: 'Sydney (Australia/Sydney)' },
]

// Date formats
const DATE_FORMATS = [
  { value: 'MMM d, yyyy', label: 'Jan 1, 2024' },
  { value: 'd MMM yyyy', label: '1 Jan 2024' },
  { value: 'yyyy-MM-dd', label: '2024-01-01' },
  { value: 'dd/MM/yyyy', label: '01/01/2024' },
  { value: 'MM/dd/yyyy', label: '01/01/2024' },
]

export default function SettingsPage() {
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [isDefault, setIsDefault] = React.useState(false)
  const [settings, setSettings] = React.useState<UserSettings>({
    email_notifications: true,
    push_notifications: true,
    meeting_reminders: true,
    application_updates: true,
    document_updates: true,
    language: 'en',
    timezone: 'Asia/Shanghai',
    date_format: 'MMM d, yyyy',
    profile_visibility: 'public',
    show_contact_info: false,
  })

  const fetchSettings = React.useCallback(async () => {
    setFetching(true)
    
    const { data, error } = await studentApi.getSettings()
    
    if (error) {
      // Use mock data for development if unauthorized
      if (error === 'Unauthorized') {
        setSettings({
          email_notifications: true,
          push_notifications: true,
          meeting_reminders: true,
          application_updates: true,
          document_updates: true,
          language: 'en',
          timezone: 'Asia/Shanghai',
          date_format: 'MMM d, yyyy',
          profile_visibility: 'public',
          show_contact_info: false,
        })
        setIsDefault(true)
      } else {
        console.error("Error fetching settings:", error)
        toast.error("Failed to load settings")
      }
    } else if (data) {
      setSettings(data.settings)
      setIsDefault(data.isDefault || false)
    }
    
    setFetching(false)
  }, [])

  React.useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    setLoading(true)
    
    const { data, error } = await studentApi.updateSettings(settings)
    
    if (error) {
      toast.error(error || "Failed to save settings")
    } else if (data) {
      toast.success(data.message || "Settings saved successfully")
      setIsDefault(false)
    }
    
    setLoading(false)
  }

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (fetching) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
          {isDefault && (
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
              Using default settings. Customize and save your preferences.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSettings} disabled={fetching}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconDeviceFloppy className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconBell className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Notifications</CardTitle>
          </div>
          <CardDescription>Choose how you want to receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                Email Notifications
              </Label>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive real-time push notifications</p>
            </div>
            <Switch
              checked={settings.push_notifications}
              onCheckedChange={(checked) => updateSetting('push_notifications', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <IconClock className="h-4 w-4" />
                Meeting Reminders
              </Label>
              <p className="text-sm text-muted-foreground">Get reminded before scheduled meetings</p>
            </div>
            <Switch
              checked={settings.meeting_reminders}
              onCheckedChange={(checked) => updateSetting('meeting_reminders', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Application Updates</Label>
              <p className="text-sm text-muted-foreground">Notifications about application status changes</p>
            </div>
            <Switch
              checked={settings.application_updates}
              onCheckedChange={(checked) => updateSetting('application_updates', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                <IconFileDescription className="h-4 w-4" />
                Document Updates
              </Label>
              <p className="text-sm text-muted-foreground">Notifications about document verification status</p>
            </div>
            <Switch
              checked={settings.document_updates}
              onCheckedChange={(checked) => updateSetting('document_updates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconLanguage className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Display</CardTitle>
          </div>
          <CardDescription>Customize your display preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={settings.language}
                onValueChange={(value) => updateSetting('language', value as 'en' | 'zh')}
              >
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="zh">中文</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={settings.timezone}
                onValueChange={(value) => updateSetting('timezone', value)}
              >
                <SelectTrigger id="timezone">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select
              value={settings.date_format}
              onValueChange={(value) => updateSetting('date_format', value)}
            >
              <SelectTrigger id="dateFormat">
                <SelectValue placeholder="Select date format" />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMATS.map(df => (
                  <SelectItem key={df.value} value={df.value}>
                    {df.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconShield className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Privacy</CardTitle>
          </div>
          <CardDescription>Control your privacy preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="visibility">Profile Visibility</Label>
            <Select
              value={settings.profile_visibility}
              onValueChange={(value) => updateSetting('profile_visibility', value as 'public' | 'partners_only' | 'private')}
            >
              <SelectTrigger id="visibility">
                <SelectValue placeholder="Select visibility" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <IconEye className="h-4 w-4" />
                    Public - Visible to everyone
                  </div>
                </SelectItem>
                <SelectItem value="partners_only">
                  <div className="flex items-center gap-2">
                    <IconShield className="h-4 w-4" />
                    Partners Only - Only visible to assigned partners
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center gap-2">
                    <IconLock className="h-4 w-4" />
                    Private - Only visible to administrators
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Control who can view your profile information
            </p>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Contact Information</Label>
              <p className="text-sm text-muted-foreground">
                Allow partners and administrators to see your contact details
              </p>
            </div>
            <Switch
              checked={settings.show_contact_info}
              onCheckedChange={(checked) => updateSetting('show_contact_info', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings (Future) */}
      <Card className="opacity-60">
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconLock className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-lg">Security</CardTitle>
          </div>
          <CardDescription>Manage your account security (Coming soon)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Change Password</Label>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <Button variant="outline" disabled>
              Change
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
            </div>
            <Button variant="outline" disabled>
              Enable
            </Button>
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Active Sessions</Label>
              <p className="text-sm text-muted-foreground">Manage your active login sessions</p>
            </div>
            <Button variant="outline" disabled>
              View
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
