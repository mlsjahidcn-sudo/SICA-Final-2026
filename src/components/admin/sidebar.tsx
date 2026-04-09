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
  ChevronLeft,
  ChevronRight,
  Award,
  ClipboardCheck,
  Newspaper,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';

const navigation = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    name: 'Partners',
    href: '/admin?tab=partners',
    icon: Building2,
  },
  {
    name: 'Applications',
    href: '/admin/applications',
    icon: FileText,
  },
  {
    name: 'Free Assessments',
    href: '/admin/assessments',
    icon: ClipboardCheck,
  },
  {
    name: 'Universities',
    href: '/admin/universities',
    icon: GraduationCap,
  },
  {
    name: 'Programs',
    href: '/admin/programs',
    icon: BookOpen,
  },
  {
    name: 'Scholarships',
    href: '/admin/scholarships',
    icon: Award,
  },
  {
    name: 'Blog',
    href: '/admin/blog',
    icon: Newspaper,
  },
  {
    name: 'Testimonials',
    href: '/admin/testimonials',
    icon: MessageCircle,
  },
  {
    name: 'Meetings',
    href: '/admin/meetings',
    icon: Calendar,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-card transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/admin" className="flex items-center">
            <span className="text-lg font-bold text-primary">SICA Admin</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-2">
        {navigation.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center'
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-2">
        <button
          onClick={handleLogout}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Log out' : undefined}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </aside>
  );
}
