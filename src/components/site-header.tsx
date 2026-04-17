'use client';

import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const routeTitles: Record<string, string> = {
  '/partner-v2': 'Dashboard',
  '/partner-v2/applications': 'Applications',
  '/partner-v2/applications/new': 'New Application',
  '/partner-v2/students': 'Students',
  '/partner-v2/universities': 'Universities',
  '/partner-v2/meetings': 'Meetings',
  '/partner-v2/analytics': 'Analytics',
  '/partner-v2/notifications': 'Notifications',
  '/partner-v2/settings': 'Settings',
  '/partner-v2/profile': 'Profile',
  '/partner-v2/tasks': 'Tasks',
  '/partner-v2/team': 'Team',
  '/student-v2': 'Dashboard',
  '/student-v2/applications': 'Applications',
  '/student-v2/applications/new': 'New Application',
  '/student-v2/meetings': 'Meetings',
  '/student-v2/universities': 'Universities',
  '/student-v2/programs': 'Programs',
  '/student-v2/notifications': 'Notifications',
  '/student-v2/settings': 'Settings',
  '/student-v2/profile': 'Profile',
  '/student-v2/favorites': 'Favorites',
  '/student-v2/templates': 'Templates',
  '/admin/v2': 'Dashboard',
  '/admin/v2/students': 'Students',
  '/admin/v2/applications': 'Applications',
  '/admin/v2/universities': 'Universities',
  '/admin/v2/programs': 'Programs',
  '/admin/v2/meetings': 'Meetings',
  '/admin/v2/blog': 'Blog',
  '/admin/v2/settings': 'Settings',
  '/admin/v2/partners': 'Partners',
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  // Dynamic route matching
  if (pathname.match(/\/partner-v2\/applications\/[^/]+\/documents/)) return 'Application Documents';
  if (pathname.match(/\/partner-v2\/applications\/[^/]+/)) return 'Application Details';
  if (pathname.match(/\/partner-v2\/students\/[^/]+/)) return 'Student Details';
  if (pathname.match(/\/partner-v2\/universities\/[^/]+/)) return 'University Details';
  if (pathname.match(/\/partner-v2\/meetings\/[^/]+/)) return 'Meeting Details';
  if (pathname.match(/\/student-v2\/applications\/[^/]+\/documents/)) return 'Application Documents';
  if (pathname.match(/\/student-v2\/applications\/[^/]+\/edit/)) return 'Edit Application';
  if (pathname.match(/\/student-v2\/applications\/[^/]+/)) return 'Application Details';
  if (pathname.match(/\/student-v2\/universities\/[^/]+/)) return 'University Details';
  if (pathname.match(/\/student-v2\/programs\/[^/]+/)) return 'Program Details';
  if (pathname.match(/\/student-v2\/meetings\/[^/]+/)) return 'Meeting Details';
  if (pathname.match(/\/student-v2\/templates\/[^/]+/)) return 'Template Details';
  if (pathname.match(/\/admin\/v2\/students\/[^/]+/)) return 'Student Details';
  if (pathname.match(/\/admin\/v2\/applications\/[^/]+/)) return 'Application Details';
  if (pathname.match(/\/admin\/v2\/universities\/[^/]+/)) return 'University Details';
  if (pathname.match(/\/admin\/v2\/programs\/[^/]+/)) return 'Program Details';
  if (pathname.match(/\/admin\/v2\/blog\/[^/]+/)) return 'Edit Post';

  // Fallback: extract last segment and capitalize
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1] || 'Dashboard';
  return lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
}

export function SiteHeader() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
      </div>
    </header>
  );
}
