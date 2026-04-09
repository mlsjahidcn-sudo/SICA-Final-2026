"use client"

import { StudentSidebar } from "@/components/student-v2/student-sidebar"
import { StudentRealtimeProvider } from "@/components/student-v2/student-realtime-provider"
import { ChatWidget } from "@/components/chat/chat-widget"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth()
  
  return (
    <StudentRealtimeProvider userId={user?.id}>
      <SidebarProvider>
        <StudentSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
      {user && <ChatWidget />}
    </StudentRealtimeProvider>
  )
}
