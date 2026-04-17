"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  IconFileText,
  IconCalendar,
  IconFiles,
  IconClock,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconTrendingUp,
  IconUsers,
  IconVideo,
  IconPlus,
  IconArrowRight,
  IconSchool,
  IconStar,
  IconMail
} from "@tabler/icons-react"
import { studentApi, type StudentDashboard } from "@/lib/student-api"

export default function StudentDashboard() {
  const [data, setData] = React.useState<StudentDashboard | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [unreadNotifications, setUnreadNotifications] = React.useState(0)

  React.useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true)
      setError(null)
      
      const { data: dashboardData, error: fetchError } = await studentApi.getDashboard()
      
      if (fetchError) {
        // If unauthorized, use mock data for development
        if (fetchError === 'Unauthorized') {
          setData({
            stats: {
              total: 5,
              draft: 1,
              submitted: 2,
              underReview: 1,
              interviewScheduled: 1,
              accepted: 0,
              rejected: 0
            },
            upcomingMeetings: [
              {
                id: "1",
                title: "Initial Interview",
                meeting_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                duration_minutes: 30,
                platform: "Zoom",
                meeting_url: "https://zoom.us/j/123456",
                status: "scheduled",
                created_at: new Date().toISOString(),
                applications: {
                  id: "app1",
                  programs: {
                    id: "prog1",
                    name: "Computer Science",
                    universities: { id: "u1", name_en: "Tsinghua University" }
                  }
                }
              },
              {
                id: "2",
                title: "Program Discussion",
                meeting_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
                duration_minutes: 45,
                platform: "Google Meet",
                meeting_url: "https://meet.google.com/abc-defg-hij",
                status: "scheduled",
                created_at: new Date().toISOString(),
                applications: {
                  id: "app2",
                  programs: {
                    id: "prog2",
                    name: "Data Science",
                    universities: { id: "u2", name_en: "Peking University" }
                  }
                }
              }
            ],
            pendingDocuments: [
              {
                id: "1",
                document_type: "Passport",
                status: "pending",
                file_url: "",
                created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                applications: {
                  id: "app1",
                  programs: { id: "prog1", name: "Computer Science" }
                }
              },
              {
                id: "2",
                document_type: "Academic Transcript",
                status: "rejected",
                file_url: "",
                rejection_reason: "Document is not clear",
                created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                applications: {
                  id: "app2",
                  programs: { id: "prog2", name: "Data Science" }
                }
              }
            ],
            recentApplications: [
              {
                id: "1",
                status: "under_review",
                created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                personal_statement: "",
                study_plan: "",
                programs: {
                  id: "prog1",
                  name: "Computer Science and Technology",
                  degree_level: "Master",
                  universities: { id: "u1", name_en: "Tsinghua University", city: "Beijing" }
                }
              },
              {
                id: "2",
                status: "submitted",
                created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                personal_statement: "",
                study_plan: "",
                programs: {
                  id: "prog2",
                  name: "Data Science",
                  degree_level: "Master",
                  universities: { id: "u2", name_en: "Peking University", city: "Beijing" }
                }
              }
            ],
            profileCompletion: 65
          })
        } else {
          setError(fetchError)
        }
      } else {
        setData(dashboardData)
      }
      
      setLoading(false)
    }

    fetchDashboard()
    
    // Fetch unread notification count
    const fetchUnreadCount = async () => {
      const { data: notifData } = await studentApi.getUnreadNotificationCount()
      if (notifData) {
        setUnreadNotifications(notifData.unreadCount)
      }
    }
    fetchUnreadCount()
  }, [])

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      draft: { label: "Draft", className: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
      submitted: { label: "Submitted", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      under_review: { label: "Under Review", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
      interview_scheduled: { label: "Interview", className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      accepted: { label: "Accepted", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      rejected: { label: "Rejected", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    }
    const c = config[status] || config.draft
    return <Badge className={c.className}>{c.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <IconAlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-lg font-medium">Error loading dashboard</p>
            <p className="text-muted-foreground text-sm">{error}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stats = data?.stats || { total: 0, draft: 0, submitted: 0, underReview: 0, interviewScheduled: 0, accepted: 0, rejected: 0 }
  const upcomingMeetings = data?.upcomingMeetings || []
  const pendingDocuments = data?.pendingDocuments || []
  const recentApplications = data?.recentApplications || []
  const profileCompletion = data?.profileCompletion || 0

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here&apos;s your application overview.</p>
        </div>
        <Button asChild>
          <Link href="/student-v2/applications/new">
            <IconPlus className="h-4 w-4 mr-2" />
            New Application
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconFileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconFiles className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-muted-foreground">Draft</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.draft}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Submitted</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.submitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconTrendingUp className="h-4 w-4 text-yellow-500" />
              <span className="text-sm text-muted-foreground">Review</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.underReview}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconVideo className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Interview</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.interviewScheduled}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconCheck className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Accepted</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.accepted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <IconX className="h-4 w-4 text-red-500" />
              <span className="text-sm text-muted-foreground">Rejected</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Completion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Completion</CardTitle>
            <CardDescription>Complete your profile to improve your applications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{profileCompletion}%</span>
                <Badge variant={profileCompletion >= 80 ? "default" : "secondary"}>
                  {profileCompletion >= 80 ? "Good" : profileCompletion >= 50 ? "Fair" : "Needs Work"}
                </Badge>
              </div>
              <Progress value={profileCompletion} />
              <Button variant="outline" className="w-full" asChild>
                <Link href="/student-v2/profile">
                  Complete Profile
                  <IconArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconCalendar className="h-5 w-5" />
              Upcoming Meetings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <IconCalendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No upcoming meetings</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingMeetings.slice(0, 3).map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconVideo className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{meeting.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(meeting.meeting_date)} at {formatTime(meeting.meeting_date)}
                      </p>
                      {meeting.applications?.programs && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {meeting.applications.programs.name}
                        </p>
                      )}
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">Join</a>
                    </Button>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/student-v2/meetings">
                    View All Meetings
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <IconFiles className="h-5 w-5" />
              Pending Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingDocuments.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <IconCheck className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">All documents verified!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDocuments.slice(0, 3).map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-lg ${doc.status === 'rejected' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                      <IconAlertCircle className={`h-4 w-4 ${doc.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{doc.document_type}</p>
                      <Badge variant="outline" className={doc.status === 'rejected' ? 'text-red-600' : 'text-yellow-600'}>
                        {doc.status === 'rejected' ? 'Rejected' : 'Pending'}
                      </Badge>
                      {doc.rejection_reason && (
                        <p className="text-xs text-red-600 mt-1">{doc.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                ))}
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/student-v2/profile#documents">
                    View All Documents
                    <IconArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Applications</CardTitle>
          <CardDescription>Your latest application activity</CardDescription>
        </CardHeader>
        <CardContent>
          {recentApplications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <IconFileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No applications yet</p>
              <p className="text-sm mt-1">Start your journey by creating your first application</p>
              <Button className="mt-4" asChild>
                <Link href="/student-v2/applications/new">
                  <IconPlus className="h-4 w-4 mr-2" />
                  Create Application
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <IconSchool className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{app.programs?.name}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{app.programs?.universities?.name_en}</span>
                          <span>•</span>
                          <span>{app.programs?.degree_level}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(app.status)}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/student-v2/applications/${app.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <Button variant="outline" className="w-full" asChild>
                <Link href="/student-v2/applications">
                  View All Applications
                  <IconArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/student-v2/universities">
            <CardContent className="pt-6 text-center">
              <IconSchool className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Browse Universities</p>
              <p className="text-xs text-muted-foreground mt-1">Explore 1000+ universities</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/student-v2/programs">
            <CardContent className="pt-6 text-center">
              <IconStar className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">Find Programs</p>
              <p className="text-xs text-muted-foreground mt-1">Discover your ideal program</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/student-v2/meetings">
            <CardContent className="pt-6 text-center">
              <IconVideo className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">My Meetings</p>
              <p className="text-xs text-muted-foreground mt-1">View scheduled interviews</p>
            </CardContent>
          </Link>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer relative">
          <Link href="/student-v2/notifications">
            <CardContent className="pt-6 text-center">
              <div className="relative inline-block">
                <IconMail className="h-8 w-8 mx-auto mb-2 text-primary" />
                {unreadNotifications > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
                  >
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </Badge>
                )}
              </div>
              <p className="font-medium">Notifications</p>
              <p className="text-xs text-muted-foreground mt-1">
                {unreadNotifications > 0 ? `${unreadNotifications} unread` : "Stay updated"}
              </p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}
