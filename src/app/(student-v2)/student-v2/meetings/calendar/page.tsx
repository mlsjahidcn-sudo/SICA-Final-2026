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
  IconChevronLeft,
  IconChevronRight,
  IconVideo,
  IconCalendar
} from "@tabler/icons-react"
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths,
  parseISO
} from "date-fns"

interface Meeting {
  id: string
  title: string
  meeting_date: string
  platform: string
  status: string
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  const [meetings, setMeetings] = React.useState<Meeting[]>([])

  React.useEffect(() => {
    // Mock meetings
    setMeetings([
      { id: "1", title: "Initial Interview", meeting_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), platform: "Zoom", status: "scheduled" },
      { id: "2", title: "Program Discussion", meeting_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), platform: "Google Meet", status: "scheduled" },
      { id: "3", title: "Follow-up Interview", meeting_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), platform: "Teams", status: "scheduled" },
      { id: "4", title: "Final Review", meeting_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), platform: "Zoom", status: "scheduled" },
    ])
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get day of week for the first day (0 = Sunday)
  const startDay = monthStart.getDay()
  // Add padding days from previous month
  const paddingDays = Array(startDay).fill(null)

  const getMeetingsForDay = (date: Date) => {
    return meetings.filter(meeting => 
      isSameDay(parseISO(meeting.meeting_date), date)
    )
  }

  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">View your interview schedule</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/student-v2/meetings">
            <IconCalendar className="h-4 w-4 mr-2" />
            List View
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={previousMonth}>
              <IconChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle className="text-lg">
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={nextMonth}>
              <IconChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Weekday Headers */}
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
            
            {/* Padding Days */}
            {paddingDays.map((_, i) => (
              <div key={`padding-${i}`} className="p-2 min-h-[100px]" />
            ))}
            
            {/* Calendar Days */}
            {days.map((day) => {
              const dayMeetings = getMeetingsForDay(day)
              const isCurrentDay = isToday(day)
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={`p-2 min-h-[100px] border rounded-lg ${isCurrentDay ? "bg-primary/5 border-primary" : "border-border"}`}
                >
                  <div className={`text-sm font-medium mb-1 ${isCurrentDay ? "text-primary" : ""}`}>
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1">
                    {dayMeetings.slice(0, 2).map((meeting) => (
                      <Link 
                        key={meeting.id}
                        href={`/student-v2/meetings/${meeting.id}`}
                        className="block text-xs p-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 truncate hover:bg-blue-200 dark:hover:bg-blue-900/50"
                      >
                        {meeting.title}
                      </Link>
                    ))}
                    {dayMeetings.length > 2 && (
                      <span className="text-xs text-muted-foreground">
                        +{dayMeetings.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Meetings Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {meetings.slice(0, 4).map((meeting) => (
              <Link 
                key={meeting.id} 
                href={`/student-v2/meetings/${meeting.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="p-2 rounded-lg bg-primary/10">
                  <IconVideo className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(meeting.meeting_date), "MMM d 'at' h:mm a")} • {meeting.platform}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
