"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  IconBell,
  IconFileText,
  IconCalendar,
  IconCheck,
  IconChecks,
  IconRefresh,
  IconWifi,
  IconWifiOff
} from "@tabler/icons-react"
import { studentApi, type Notification } from "@/lib/student-api"

interface PendingNotification {
  id: string
  type: string
  title: string
  content: string
  created_at: string
  link?: string
}

// Custom hook to safely get realtime notifications
function useRealtimeNotificationsSafe() {
  const [isConnected, setIsConnected] = React.useState(false)
  const [pendingNotifications, setPendingNotifications] = React.useState<PendingNotification[]>([])

  React.useEffect(() => {
    // Only run on client side
    const initWebSocket = async () => {
      try {
        const { useRealtimeNotifications } = await import('@/contexts/realtime-notifications-context')
        // This is a simplified version - in real app, you'd use the context properly
        setIsConnected(false) // Will be true when WebSocket connects
      } catch {
        setIsConnected(false)
      }
    }
    initWebSocket()
  }, [])

  const acknowledgeNotification = React.useCallback((id: string) => {
    setPendingNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { isConnected, pendingNotifications, acknowledgeNotification }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState("all")
  
  // Get real-time connection status
  const { isConnected: realtimeConnected } = useRealtimeNotificationsSafe()

  const fetchNotifications = React.useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await studentApi.getNotifications(
      filter === "unread" ? { unread: true } :
      filter !== "all" ? { type: filter } : undefined
    )
    
    if (error) {
      // Use mock data for development if unauthorized
      if (error === 'Unauthorized') {
        setNotifications([
          { id: "1", type: "application", title: "Application Status Updated", content: "Your application to Computer Science at Tsinghua University has been moved to Under Review status.", is_read: false, created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), link: "/student-v2/applications/1" },
          { id: "2", type: "meeting", title: "Interview Scheduled", content: "Your interview for Data Science at Peking University has been scheduled for Dec 15, 2024 at 2:00 PM.", is_read: false, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), link: "/student-v2/meetings/2" },
          { id: "3", type: "document", title: "Document Verified", content: "Your Passport document has been verified successfully.", is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), link: "/student-v2/documents" },
          { id: "4", type: "application", title: "New Application Created", content: "You have successfully created a new application for Artificial Intelligence at Zhejiang University.", is_read: true, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
          { id: "5", type: "document", title: "Document Rejected", content: "Your Language Test (IELTS) document was rejected. Reason: Document is not clear. Please upload a higher resolution scan.", is_read: false, created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), link: "/student-v2/documents" },
        ])
        setUnreadCount(3)
      } else {
        console.error("Error fetching notifications:", error)
      }
    } else if (data) {
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
    }
    
    setLoading(false)
  }, [filter])

  React.useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "application": return <IconFileText className="h-4 w-4 text-blue-500" />
      case "meeting": return <IconCalendar className="h-4 w-4 text-purple-500" />
      case "document": return <IconCheck className="h-4 w-4 text-green-500" />
      default: return <IconBell className="h-4 w-4" />
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)
    
    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const markAsRead = async (id: string) => {
    await studentApi.markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? {...n, is_read: true} : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await studentApi.markAllNotificationsRead()
    setNotifications(prev => prev.map(n => ({...n, is_read: true})))
    setUnreadCount(0)
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : "All caught up!"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Real-time connection status */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            {realtimeConnected ? (
              <>
                <IconWifi className="h-3 w-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">Live</span>
              </>
            ) : (
              <>
                <IconWifiOff className="h-3 w-3" />
                <span>Offline</span>
              </>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <IconChecks className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
          <Button variant="ghost" onClick={() => fetchNotifications()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">{unreadCount}</Badge>
              )}
            </Button>
            <Button
              variant={filter === "application" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("application")}
            >
              <IconFileText className="h-4 w-4 mr-1" />
              Applications
            </Button>
            <Button
              variant={filter === "meeting" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("meeting")}
            >
              <IconCalendar className="h-4 w-4 mr-1" />
              Meetings
            </Button>
            <Button
              variant={filter === "document" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("document")}
            >
              <IconCheck className="h-4 w-4 mr-1" />
              Documents
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications ({notifications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <IconBell className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No notifications</h3>
              <p className="text-muted-foreground">
                {filter !== "all" ? "Try changing your filter" : "You're all caught up!"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    notification.is_read 
                      ? "bg-background hover:bg-muted/50" 
                      : "bg-primary/5 hover:bg-primary/10 border-primary/20"
                  }`}
                >
                  <div className="p-2 rounded-full bg-muted">
                    {getTypeIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.content}</p>
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatTime(notification.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          <IconCheck className="h-4 w-4 mr-1" />
                          Mark as read
                        </Button>
                      )}
                      {notification.link && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={notification.link}>View Details</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
