"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  IconArrowLeft,
  IconCalendar,
  IconClock,
  IconVideo,
  IconSchool,
  IconExternalLink,
  IconMail,
  IconUser,
  IconFileText
} from "@tabler/icons-react"
import { format, parseISO } from "date-fns"

interface MeetingDetail {
  id: string
  title: string
  meeting_date: string
  duration_minutes: number
  platform: string
  meeting_url: string
  meeting_id?: string
  meeting_password?: string
  status: string
  notes?: string
  interviewer_name?: string
  interviewer_email?: string
  applications?: {
    id: string
    programs?: {
      id: string
      name_en: string
      degree_type: string
      universities?: {
        id: string
        name_en: string
        logo_url: string | null
      }
    }
  }
}

export default function MeetingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const meetingId = params.id as string

  const [meeting, setMeeting] = React.useState<MeetingDetail | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchMeeting = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/student/meetings/${meetingId}`)
        if (response.ok) {
          const data = await response.json()
          setMeeting(data.meeting)
        } else {
          // Mock data
          setMeeting({
            id: meetingId,
            title: "Initial Interview",
            meeting_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 30,
            platform: "Zoom",
            meeting_url: "https://zoom.us/j/123456789",
            meeting_id: "123 456 789",
            meeting_password: "abc123",
            status: "scheduled",
            notes: "Please prepare to discuss your academic background and research interests. Have your portfolio ready if applicable.",
            interviewer_name: "Dr. Wang Wei",
            interviewer_email: "wang.wei@tsinghua.edu.cn",
            applications: {
              id: "app1",
              programs: {
                id: "prog1",
                name_en: "Computer Science",
                degree_type: "Master",
                universities: {
                  id: "uni1",
                  name_en: "Tsinghua University",
                  logo_url: null
                }
              }
            }
          })
        }
      } catch (error) {
        console.error("Error fetching meeting:", error)
      } finally {
        setLoading(false)
      }
    }

    if (meetingId) {
      fetchMeeting()
    }
  }, [meetingId])

  const getPlatformIcon = (platform: string) => {
    switch (platform?.toLowerCase()) {
      case "zoom":
        return <IconVideo className="h-5 w-5 text-blue-500" />
      case "google meet":
        return <IconVideo className="h-5 w-5 text-green-500" />
      case "teams":
        return <IconVideo className="h-5 w-5 text-purple-500" />
      default:
        return <IconVideo className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      completed: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
      cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    }
    const c = config[status] || config.scheduled
    return <Badge className={c.className}>{c.label}</Badge>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <IconCalendar className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">Meeting not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    )
  }

  const meetingDate = parseISO(meeting.meeting_date)
  const isUpcoming = meeting.status === "scheduled" && meetingDate > new Date()

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <IconArrowLeft className="h-4 w-4 mr-2" />
          Back to Meetings
        </Button>
      </div>

      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                {getPlatformIcon(meeting.platform)}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <CardTitle className="text-xl">{meeting.title}</CardTitle>
                  {getStatusBadge(meeting.status)}
                </div>
                <CardDescription>
                  {meeting.applications?.programs?.name_en} • {meeting.applications?.programs?.universities?.name_en}
                </CardDescription>
              </div>
            </div>
            {isUpcoming && (
              <Button asChild>
                <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                  <IconExternalLink className="h-4 w-4 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <IconCalendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium">{format(meetingDate, "MMM d, yyyy")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium">{format(meetingDate, "h:mm a")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconClock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Duration</p>
                <p className="font-medium">{meeting.duration_minutes} minutes</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <IconVideo className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Platform</p>
                <p className="font-medium">{meeting.platform}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Meeting Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meeting Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Meeting Link</p>
              <a 
                href={meeting.meeting_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {meeting.meeting_url}
              </a>
            </div>
            {meeting.meeting_id && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Meeting ID</p>
                <p className="font-mono">{meeting.meeting_id}</p>
              </div>
            )}
            {meeting.meeting_password && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Password</p>
                <p className="font-mono">{meeting.meeting_password}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interviewer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interviewer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {meeting.interviewer_name && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <IconUser className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{meeting.interviewer_name}</p>
                </div>
              </div>
            )}
            {meeting.interviewer_email && (
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <IconMail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a href={`mailto:${meeting.interviewer_email}`} className="text-primary hover:underline">
                    {meeting.interviewer_email}
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {meeting.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes & Preparation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{meeting.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Related Application */}
      {meeting.applications && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Related Application</CardTitle>
          </CardHeader>
          <CardContent>
            <Link 
              href={`/student-v2/applications/${meeting.applications.id}`}
              className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="p-2 rounded-lg bg-background">
                <IconFileText className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{meeting.applications.programs?.name_en}</p>
                <p className="text-sm text-muted-foreground">
                  {meeting.applications.programs?.universities?.name_en} • {meeting.applications.programs?.degree_type}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
