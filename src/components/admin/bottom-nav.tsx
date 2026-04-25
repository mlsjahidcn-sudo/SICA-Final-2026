'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  Settings,
  MoreHorizontal,
  Building2,
  GraduationCap,
  BookOpen,
  Award,
  Newspaper,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const primaryNavItems = [
  {
    name: 'Home',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    name: 'Students',
    href: '/admin/students',
    icon: Users,
  },
  {
    name: 'Applications',
    href: '/admin/applications',
    icon: FileText,
  },
  {
    name: 'Meetings',
    href: '/admin/meetings',
    icon: Calendar,
  },
];

const moreNavItems = [
  {
    name: 'Blog',
    href: '/admin/blog',
    icon: Newspaper,
  },
  {
    name: 'Partners',
    href: '/admin/partners',
    icon: Building2,
  },
  {
    name: 'Universities',
    href: '/admin/universities',
    icon: GraduationCap,
  },
  {
    name: 'Programs',
    href: '/admin/programs',
    icon: Award,
  },
  {
    name: 'Scholarships',
    href: '/admin/scholarships',
    icon: Award,
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const isMoreActive = moreNavItems.some(item => isActive(item.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm lg:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full px-1 py-1 text-xs font-medium transition-all duration-200',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-10 rounded-lg transition-colors',
                  active && 'bg-primary/10'
                )}
              >
                <item.icon className={cn('h-5 w-5', active && 'text-primary')} />
              </div>
              <span className="mt-0.5">{item.name}</span>
            </Link>
          );
        })}

        {/* More Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex flex-col items-center justify-center w-full h-full px-1 py-1 text-xs font-medium transition-all duration-200',
                isMoreActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-10 rounded-lg transition-colors',
                  isMoreActive && 'bg-primary/10'
                )}
              >
                <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'text-primary')} />
              </div>
              <span className="mt-0.5">More</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 mb-2">
            {moreNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <DropdownMenuItem key={item.name} asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 cursor-pointer',
                      active && 'text-primary'
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
