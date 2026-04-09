"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/dashboard-v2-sidebar"
import { SiteHeader } from "@/components/dashboard-v2-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  IconSettings,
  IconDeviceFloppy,
  IconMail,
  IconBell,
  IconShield,
  IconWorld
} from "@tabler/icons-react"

interface PlatformSettings {
  site_name: string
  site_description: string
  contact_email: string
  support_email: string
  notification_enabled: boolean
  email_notifications: boolean
  maintenance_mode: boolean
  allow_registration: boolean
  default_application_status: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<PlatformSettings>({
    site_name: 'Study In China Academy',
    site_description: 'Your gateway to studying in China',
    contact_email: 'contact@sica.edu',
    support_email: 'support@sica.edu',
    notification_enabled: true,
    email_notifications: true,
    maintenance_mode: false,
    allow_registration: true,
    default_application_status: 'submitted',
  })

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/admin/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchSettings() {
      try {
        const token = localStorage.getItem('sica_auth_token')
        const response = await fetch('/api/admin/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.settings) {
            // Transform nested settings into flat format
            const flatSettings: Partial<PlatformSettings> = {}
            
            if (data.settings.general) {
              flatSettings.site_name = data.settings.general.site_name
              flatSettings.site_description = data.settings.general.site_description
              flatSettings.contact_email = data.settings.general.contact_email
              flatSettings.support_email = data.settings.general.support_email
            }
            
            if (data.settings.notifications) {
              flatSettings.notification_enabled = data.settings.notifications.notification_enabled
              flatSettings.email_notifications = data.settings.notifications.email_notifications
            }
            
            if (data.settings.security) {
              flatSettings.maintenance_mode = data.settings.security.maintenance_mode
              flatSettings.allow_registration = data.settings.security.allow_registration
            }
            
            if (data.settings.applications) {
              flatSettings.default_application_status = data.settings.applications.default_application_status
            }
            
            setSettings(prev => ({ ...prev, ...flatSettings }))
          }
        }
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user && user.role === 'admin') {
      fetchSettings()
    }
  }, [user])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem('sica_auth_token')
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        toast.success('Settings saved successfully')
      } else {
        toast.error('Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Settings" />
          <div className="flex flex-col gap-6 p-6">
            {/* General Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconWorld className="h-5 w-5" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic platform configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="site_name">Site Name</Label>
                    <Input
                      id="site_name"
                      value={settings.site_name}
                      onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contact_email">Contact Email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={settings.contact_email}
                      onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_description">Site Description</Label>
                  <Textarea
                    id="site_description"
                    value={settings.site_description}
                    onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                    rows={2}
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
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconBell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>
                  Configure notification preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow platform to send notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notification_enabled}
                    onCheckedChange={(checked) => setSettings({ ...settings, notification_enabled: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email notifications for important events
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Security & Access */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconShield className="h-5 w-5" />
                  Security & Access
                </CardTitle>
                <CardDescription>
                  Control platform access and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow new users to register on the platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.allow_registration}
                    onCheckedChange={(checked) => setSettings({ ...settings, allow_registration: checked })}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-destructive">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Put the platform in maintenance mode (only admins can access)
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) => setSettings({ ...settings, maintenance_mode: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Email Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconMail className="h-5 w-5" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Email templates and SMTP settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Email templates are managed in the email templates section. 
                  SMTP settings are configured in environment variables.
                </p>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconDeviceFloppy className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
