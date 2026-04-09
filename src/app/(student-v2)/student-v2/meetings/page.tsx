"use client"

import * as React from "react"
import Link from "next/link"
import { 
  Card, 
  CardContent
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IconCalendar,
  IconVideo,
  IconClock,
  IconMapPin,
  IconSchool,
  IconRefresh,
  IconExternalLink,
  IconCalendarTime
} from "@tabler/icons-react"
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns"
import { studentApi, type Meeting } from "@/lib/student-api"

const getStatusBadge = (status: string) => {
  const config: Record<string, { label: string; className: string }> = {
    scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    completed: { label: "Completed", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    cancelled: { label: "Cancelled", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
    rescheduled: { label: "Rescheduled", className: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  }
  const c = config[status] || config.scheduled
  return <Badge className={c.className}>{c.label}</Badge>
}

const getPlatformColor = (platform: string) => {
  const colors: Record<string, string> = {
    "Zoom": "bg-blue-500",
    "Google Meet": "bg-green-500",
    "Microsoft Teams": "bg-purple-500",
    "Tencent Meeting": "bg-cyan-500",
  }
  return colors[platform] || "bg-gray-500"
}

const getRelativeDate = (dateString: string) => {
  const date = parseISO(dateString)
  if (isToday(date)) return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  return format(date, "EEE, MMM d")
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = React.useState<Meeting[]>([])
  const [loading, setLoading] = React.useState(true)
  const [filter, setFilter] = React.useState("all")

  const fetchMeetings = React.useCallback(async () => {
    setLoading(true)
    
    const { data, error } = await studentApi.getMeetings(
      filter !== "all" ? { status: filter } : undefined
    )
    
    if (error) {
      // Use mock data for development if unauthorized
      if (error === 'Unauthorized') {
        setMeetings([
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
                name_en: "Computer Science",
                universities: { id: "u1", name_en: "Tsinghua University", logo_url: undefined }
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
                name_en: "Data Science",
                universities: { id: "u2", name_en: "Peking University", logo_url: undefined }
              }
            }
          },
          {
            id: "3",
            title: "Document Review",
            meeting_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            duration_minutes: 20,
            platform: "Microsoft Teams",
            meeting_url: "https://teams.microsoft.com/meet/xyz",
            status: "completed",
            created_at: new Date().toISOString(),
            applications: {
              id: "app3",
              programs: {
                id: "prog3",
                name_en: "International Business",
                universities: { id: "u3", name_en: "Fudan University", logo_url: undefined }
              }
            }
          }
        ])
      } else {
        console.error("Error fetching meetings:", error)
      }
    } else if (data) {
      setMeetings(data.meetings || [])
    }
    
    setLoading(false)
  }, [filter])

  React.useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  // Group meetings by date
  const groupedMeetings = React.useMemo(() => {
    const groups: Record<string, Meeting[]> = {}
    
    meetings.forEach((meeting) => {
      const dateKey = format(parseISO(meeting.meeting_date), "yyyy-MM-dd")
      if (!groups[dateKey]) groups[dateKey] = []
      groups[dateKey].push(meeting)
    })

    // Sort meetings within each group by time
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => 
        new Date(a.meeting_date).getTime() - new Date(b.meeting_date).getTime()
      )
    })

    return groups
  }, [meetings])

  const upcomingMeetings = meetings.filter((m) => !isPast(parseISO(m.meeting_date)) && m.status === "scheduled")
  const pastMeetings = meetings.filter((m) => isPast(parseISO(m.meeting_date)) || m.status !== "scheduled")

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Meetings</h1>
          <p className="text-muted-foreground">View and join your scheduled interviews and meetings</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/student-v2/meetings/calendar">
              <IconCalendarTime className="h-4 w-4 mr-2" />
              Calendar View
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meetings</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" onClick={() => { setLoading(true); fetchMeetings(); }}>
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <div className="ml-auto text-sm text-muted-foreground">
              {upcomingMeetings.length} upcoming • {pastMeetings.length} past
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meetings List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : meetings.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <IconVideo className="h-16 w-16 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No meetings scheduled</h3>
            <p className="text-muted-foreground text-center">
              Your scheduled interviews will appear here once arranged
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMeetings).map(([date, dateMeetings]) => (
            <div key={date}>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <IconCalendar className="h-5 w-5 text-primary" />
                {format(parseISO(date), "EEEE, MMMM d, yyyy")}
                {isToday(parseISO(date)) && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">Today</Badge>
                )}
                {isTomorrow(parseISO(date)) && (
                  <Badge className="ml-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Tomorrow</Badge>
                )}
              </h2>
              <div className="grid gap-4">
                {dateMeetings.map((meeting) => {
                  const meetingDate = parseISO(meeting.meeting_date)
                  const isUpcoming = !isPast(meetingDate) && meeting.status === "scheduled"
                  
                  return (
                    <Card key={meeting.id} className={isPast(meetingDate) ? "opacity-70" : ""}>
                      <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${getPlatformColor(meeting.platform)} text-white`}>
                              <IconVideo className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{meeting.title}</h3>
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <IconClock className="h-4 w-4" />
                                  {format(meetingDate, "h:mm a")} • {meeting.duration_minutes} min
                                </div>
                                <div className="flex items-center gap-1">
                                  <IconVideo className="h-4 w-4" />
                                  {meeting.platform}
                                </div>
                              </div>
                              {meeting.applications?.programs && (
                                <div className="flex items-center gap-2 mt-2 text-sm">
                                  <IconSchool className="h-4 w-4 text-muted-foreground" />
                                  <span>{meeting.applications.programs.name_en}</span>
                                  {meeting.applications.programs.universities && (
                                    <>
                                      <span className="text-muted-foreground">at</span>
                                      <span className="font-medium">{meeting.applications.programs.universities.name_en}</span>
                                    </>
                                  )}
                                </div>
                              )}
                              {meeting.notes && (
                                <p className="text-sm text-muted-foreground mt-2">{meeting.notes}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(meeting.status)}
                            {isUpcoming && (
                              <Button asChild>
                                <a href={meeting.meeting_url} target="_blank" rel="noopener noreferrer">
                                  <IconExternalLink className="h-4 w-4 mr-2" />
                                  Join Meeting
                                </a>
                              </Button>
                            )}
                            <Button variant="outline" asChild>
                              <Link href={`/student-v2/meetings/${meeting.id}`}>
                                View Details
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
