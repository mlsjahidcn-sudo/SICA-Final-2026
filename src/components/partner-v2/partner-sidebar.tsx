"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { 
  IconDashboard, 
  IconFileText, 
  IconUsers, 
  IconSettings, 
  IconHelp,
  IconLogout,
  IconUserCircle,
  IconBell,
  IconPlus,
  IconChartBar,
  IconCalendar,
  IconBuilding,
  IconUsersGroup,
  IconClipboardList,
  IconArrowsDiff,
  IconInnerShadowTop
} from "@tabler/icons-react"

const navItems = [
  {
    title: "Dashboard",
    url: "/partner-v2",
    icon: <IconDashboard />,
  },
  {
    title: "Applications",
    url: "/partner-v2/applications",
    icon: <IconFileText />,
  },
  {
    title: "Tasks",
    url: "/partner-v2/tasks",
    icon: <IconClipboardList />,
  },
  {
    title: "Students",
    url: "/partner-v2/students",
    icon: <IconUsers />,
  },
  {
    title: "Team",
    url: "/partner-v2/team",
    icon: <IconUsersGroup />,
    adminOnly: true,
  },
  {
    title: "Universities",
    url: "/partner-v2/universities",
    icon: <IconBuilding />,
  },
  {
    title: "Compare",
    url: "/partner-v2/universities/compare",
    icon: <IconArrowsDiff />,
  },
  {
    title: "Meetings",
    url: "/partner-v2/meetings",
    icon: <IconCalendar />,
  },
  {
    title: "Analytics",
    url: "/partner-v2/analytics",
    icon: <IconChartBar />,
  },
  {
    title: "Notifications",
    url: "/partner-v2/notifications",
    icon: <IconBell />,
    showBadge: true,
  },
  {
    title: "Profile",
    url: "/partner-v2/profile",
    icon: <IconUserCircle />,
  },
  {
    title: "Settings",
    url: "/partner-v2/settings",
    icon: <IconSettings />,
  },
]

function NavUser({ user, isPartnerAdmin }: { user: { full_name: string; email: string; avatar_url?: string | null; partner_role?: string } | null; isPartnerAdmin: boolean }) {
  const { isMobile } = useSidebar()
  const { signOut } = useAuth()
  const router = useRouter()
  const initials = user?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "P"

  const handleLogout = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{user?.full_name || "Partner"}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {isPartnerAdmin ? "Admin" : "Member"} · {user?.email || "partner@sica.com"}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user?.avatar_url || undefined} />
                  <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{user?.full_name || "Partner"}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user?.email || "partner@sica.com"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/partner-v2/profile">
                  <IconUserCircle />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/partner-v2/notifications">
                  <IconBell />
                  Notifications
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

export function PartnerSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isPartnerAdmin = !(user as unknown as Record<string, unknown>)?.partner_role || (user as unknown as Record<string, unknown>)?.partner_role === 'partner_admin'
  const [unreadCount, setUnreadCount] = React.useState(0)

  // Fetch unread notification count
  React.useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!user) return;

        const { getValidToken } = await import('@/lib/auth-token');
        const token = await getValidToken();
        if (!token) return;

        const response = await fetch('/api/partner/notifications/unread-count', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUnreadCount(data.count || 0);
        }
      } catch {
        // Silently fail - badge is non-critical
      }
    };

    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/partner-v2">
                <IconInnerShadowTop className="size-5! text-primary" />
                <span className="text-base font-semibold">SICA Partner</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton
                  tooltip="New Application"
                  className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  asChild
                >
                  <Link href="/partner-v2/applications/new">
                    <IconPlus />
                    <span>New Application</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems
                .filter(item => !item.adminOnly || isPartnerAdmin)
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    tooltip={item.title}
                    isActive={pathname === item.url || (item.url !== "/partner-v2" && pathname.startsWith(item.url))}
                    asChild
                  >
                    <Link href={item.url} className="relative flex items-center w-full">
                      {item.icon}
                      <span>{item.title}</span>
                      {item.showBadge && unreadCount > 0 && (
                        <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link href="/contact">
                    <IconHelp />
                    <span>Help & Support</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} isPartnerAdmin={isPartnerAdmin} />
      </SidebarFooter>
    </Sidebar>
  )
}
