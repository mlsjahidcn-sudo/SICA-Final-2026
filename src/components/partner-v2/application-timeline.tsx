"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { STATUS_CONFIG } from "./application-status-badge"
import { IconCheck } from "@tabler/icons-react"

interface TimelineEvent {
  id: string
  old_status: string | null
  new_status: string
  changed_at: string
  changed_by_name?: string
  notes?: string
}

interface ApplicationTimelineProps {
  events: TimelineEvent[]
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ApplicationTimeline({ events }: ApplicationTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Timeline</CardTitle>
          <CardDescription>Status change history</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No status changes recorded yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Timeline</CardTitle>
        <CardDescription>Status change history</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
          
          {/* Timeline events */}
          <div className="space-y-4">
            {events.map((event, index) => {
              const newConfig = STATUS_CONFIG[event.new_status] || STATUS_CONFIG.draft
              const oldConfig = event.old_status ? STATUS_CONFIG[event.old_status] : null
              
              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary">
                    <IconCheck className="h-3 w-3 text-primary" />
                  </div>
                  
                  {/* Event content */}
                  <div className="flex-1 pb-4">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {oldConfig && (
                        <>
                          <Badge variant="outline" className={oldConfig.color}>
                            {oldConfig.label}
                          </Badge>
                          <span className="text-muted-foreground">→</span>
                        </>
                      )}
                      <Badge variant="outline" className={newConfig.color}>
                        {newConfig.label}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.changed_at)}
                      {event.changed_by_name && (
                        <span> by {event.changed_by_name}</span>
                      )}
                    </p>
                    
                    {event.notes && (
                      <p className="text-sm mt-1 text-foreground/80">
                        {event.notes}
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
