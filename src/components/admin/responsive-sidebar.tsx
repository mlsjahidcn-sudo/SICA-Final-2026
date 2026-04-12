'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  GraduationCap,
  BookOpen,
  Calendar,
  Settings,
  LogOut,
  Menu,
  X,
  Award,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Bell,
  Search,
  Moon,
  Sun,
  User,
  MoreHorizontal,
  ClipboardCheck,
  Newspaper,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navigation = [
  {
    section: 'Overview',
    items: [
      {
        name: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        badge: null,
      },
    ],
  },
  {
    section: 'Management',
    items: [
      {
        name: 'Students',
        href: '/admin/students',
        icon: Users,
        badge: null,
      },
      {
        name: 'Partners',
        href: '/admin/partners',
        icon: Building2,
        badge: 'pending',
      },
      {
        name: 'Applications',
        href: '/admin/applications',
        icon: FileText,
        badge: 'new',
      },
      {
        name: 'Free Assessments',
        href: '/admin/assessments',
        icon: ClipboardCheck,
        badge: null,
      },
    ],
  },
  {
    section: 'Content',
    items: [
      {
        name: 'Blog',
        href: '/admin/blog',
        icon: Newspaper,
        badge: null,
      },
      {
        name: 'Universities',
        href: '/admin/universities',
        icon: GraduationCap,
        badge: null,
      },
      {
        name: 'Programs',
        href: '/admin/programs',
        icon: Award,
        badge: null,
      },
      {
        name: 'Scholarships',
        href: '/admin/scholarships',
        icon: Award,
        badge: null,
      },
    ],
  },
  {
    section: 'Communication',
    items: [
      {
        name: 'Meetings',
        href: '/admin/meetings',
        icon: Calendar,
        badge: null,
      },
    ],
  },
  {
    section: 'System',
    items: [
      {
        name: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        badge: null,
      },
    ],
  },
];

interface NavContentProps {
  onNavigate?: () => void;
  collapsed?: boolean;
}

function NavContent({ onNavigate, collapsed = false }: NavContentProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navigation.map(n => n.section)
  );

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (section: string) => {
    if (collapsed) return;
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  return (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-4">
      {navigation.map((group) => (
        <div key={group.section} className="mb-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection(group.section)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>{group.section}</span>
              {expandedSections.includes(group.section) ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </button>
          )}
          {collapsed && (
            <div className="px-4 py-2">
              <div className="h-px bg-border" />
            </div>
          )}
          <div
            className={cn(
              'space-y-0.5 px-2',
              !collapsed && !expandedSections.includes(group.section) && 'hidden'
            )}
          >
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <TooltipProvider key={item.name} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative',
                          active
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                          collapsed && 'justify-center px-2'
                        )}
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.name}</span>}
                        {!collapsed && item.badge && (
                          <span
                            className={cn(
                              'ml-auto h-2 w-2 rounded-full',
                              item.badge === 'pending' && 'bg-amber-500',
                              item.badge === 'new' && 'bg-green-500'
                            )}
                          />
                        )}
                        {active && collapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                        )}
                      </Link>
                    </TooltipTrigger>
                    {collapsed && (
                      <TooltipContent side="right" className="font-medium">
                        {item.name}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function UserProfile({ collapsed }: { collapsed: boolean }) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const initials = user?.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase() || 'AD';

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div
      className={cn(
        'border-t p-4',
        collapsed ? 'flex justify-center' : 'flex items-center gap-3'
      )}
    >
      <Avatar className="h-9 w-9">
        <AvatarImage src={user?.avatar_url} />
        <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.full_name || 'Admin'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
      )}
      {!collapsed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function AdminMobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="flex h-16 items-center justify-between border-b bg-card px-4 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">SICA Admin</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 flex flex-col">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <div className="flex h-16 items-center justify-between border-b px-4">
              <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-bold text-foreground">SICA Admin</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <NavContent onNavigate={() => setOpen(false)} />
            <UserProfile collapsed={false} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <DesktopSidebar />
    </>
  );
}

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r bg-card h-screen sticky top-0 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-foreground">SICA Admin</span>
          )}
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <NavContent collapsed={collapsed} />

      {/* User Profile */}
      <UserProfile collapsed={collapsed} />
    </aside>
  );
}
