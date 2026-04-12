"use client"

import * as React from "react"

import { NavDocuments } from "@/components/dashboard-v2-nav-docs"
import { NavMain } from "@/components/dashboard-v2-nav-main"
import { NavSecondary } from "@/components/dashboard-v2-nav-secondary"
import { NavUser } from "@/components/dashboard-v2-nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { IconDashboard, IconListDetails, IconChartBar, IconFolder, IconUsers, IconCamera, IconFileDescription, IconFileAi, IconSettings, IconHelp, IconSearch, IconDatabase, IconReport, IconFileWord, IconInnerShadowTop, IconArticle, IconUser, IconFileText, IconFolderOpen } from "@tabler/icons-react"

import { IconCalendar, IconBuilding, IconClipboardList, IconUserStar } from "@tabler/icons-react"
import { useAuth } from "@/contexts/auth-context"

const navData = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/v2",
      icon: (
        <IconDashboard
        />
      ),
    },
    {
      title: "Leads",
      url: "/admin/v2/leads",
      icon: (
        <IconUserStar
        />
      ),
    },
    {
      title: "Analytics",
      url: "/admin/v2/analytics",
      icon: (
        <IconChartBar
        />
      ),
    },
    {
      title: "Reports",
      url: "/admin/v2/reports",
      icon: (
        <IconReport
        />
      ),
    },
    {
      title: "Individual Students",
      url: "/admin/v2/individual-students",
      icon: (
        <IconUser
        />
      ),
    },
    {
      title: "Partner Students",
      url: "/admin/v2/partner-students",
      icon: (
        <IconUsers
        />
      ),
    },
    {
      title: "Individual Applications",
      url: "/admin/v2/individual-applications",
      icon: (
        <IconFileText
        />
      ),
    },
    {
      title: "Partner Applications",
      url: "/admin/v2/partner-applications",
      icon: (
        <IconFolderOpen
        />
      ),
    },
    {
      title: "All Students",
      url: "/admin/v2/students",
      icon: (
        <IconUsers
        />
      ),
    },
    {
      title: "All Applications",
      url: "/admin/v2/applications",
      icon: (
        <IconFileDescription
        />
      ),
    },
    {
      title: "Universities",
      url: "/admin/v2/universities",
      icon: (
        <IconDatabase
        />
      ),
    },
    {
      title: "Programs",
      url: "/admin/v2/programs",
      icon: (
        <IconFolder
        />
      ),
    },
    {
      title: "Meetings",
      url: "/admin/v2/meetings",
      icon: (
        <IconCalendar
        />
      ),
    },
    {
      title: "Tasks",
      url: "/admin/v2/tasks",
      icon: (
        <IconClipboardList
        />
      ),
    },
    {
      title: "Partners",
      url: "/admin/v2/partners",
      icon: (
        <IconBuilding
        />
      ),
    },
    {
      title: "Blog",
      url: "/admin/v2/blog",
      icon: (
        <IconArticle
        />
      ),
    },
    {
      title: "Assessments",
      url: "/admin/v2/assessments",
      icon: (
        <IconFileAi
        />
      ),
    },
  ],
  navClouds: [],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/v2/settings",
      icon: (
        <IconSettings
        />
      ),
    },
    {
      title: "Help",
      url: "/contact",
      icon: (
        <IconHelp
        />
      ),
    },
  ],
  documents: [
    {
      name: "Export Data",
      url: "/admin/v2/reports",
      icon: (
        <IconDatabase
        />
      ),
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  
  // Map auth user to sidebar user format
  const sidebarUser = {
    name: user?.full_name || user?.email?.split('@')[0] || 'Admin',
    email: user?.email || 'admin@sica.edu',
    avatar: user?.avatar_url || '/avatars/admin.jpg',
  }

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="/admin/v2">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">SICA Admin</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navData.navMain} />
        <NavDocuments items={navData.documents} />
        <NavSecondary items={navData.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
