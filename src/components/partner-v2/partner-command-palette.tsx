'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  IconDashboard,
  IconFileText,
  IconUsers,
  IconSettings,
  IconBell,
  IconChartBar,
  IconCalendar,
  IconBuilding,
  IconUserCircle,
  IconPlus,
  IconUsersGroup,
  IconClipboardList,
} from '@tabler/icons-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  group: string;
  adminOnly?: boolean;
}

const partnerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/partner-v2', icon: <IconDashboard className="size-4" />, group: 'Navigation' },
  { label: 'Applications', href: '/partner-v2/applications', icon: <IconFileText className="size-4" />, group: 'Navigation' },
  { label: 'New Application', href: '/partner-v2/applications/new', icon: <IconPlus className="size-4" />, group: 'Actions' },
  { label: 'Tasks', href: '/partner-v2/tasks', icon: <IconClipboardList className="size-4" />, group: 'Navigation' },
  { label: 'Students', href: '/partner-v2/students', icon: <IconUsers className="size-4" />, group: 'Navigation' },
  { label: 'Team', href: '/partner-v2/team', icon: <IconUsersGroup className="size-4" />, group: 'Navigation', adminOnly: true },
  { label: 'Universities', href: '/partner-v2/universities', icon: <IconBuilding className="size-4" />, group: 'Navigation' },
  { label: 'Meetings', href: '/partner-v2/meetings', icon: <IconCalendar className="size-4" />, group: 'Navigation' },
  { label: 'Analytics', href: '/partner-v2/analytics', icon: <IconChartBar className="size-4" />, group: 'Navigation' },
  { label: 'Notifications', href: '/partner-v2/notifications', icon: <IconBell className="size-4" />, group: 'Navigation' },
  { label: 'Settings', href: '/partner-v2/settings', icon: <IconSettings className="size-4" />, group: 'Navigation' },
  { label: 'Profile', href: '/partner-v2/profile', icon: <IconUserCircle className="size-4" />, group: 'Account' },
];

export function PartnerCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const isPartnerAdmin = !(user as unknown as Record<string, unknown>)?.partner_role || (user as unknown as Record<string, unknown>)?.partner_role === 'partner_admin';

  // Group items by their group property, filter admin-only items for members
  const groups = partnerNavItems
    .filter(item => !item.adminOnly || isPartnerAdmin)
    .reduce<Record<string, NavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Partner Portal"
      description="Quick navigation and actions"
    >
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {Object.entries(groups).map(([groupName, items]) => (
          <CommandGroup key={groupName} heading={groupName}>
            {items.map((item) => (
              <CommandItem
                key={item.href}
                onSelect={() => runCommand(() => router.push(item.href))}
              >
                {item.icon}
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Help">
          <CommandItem onSelect={() => runCommand(() => router.push('/contact'))}>
            <IconBell className="size-4" />
            <span>Contact Support</span>
          </CommandItem>
        </CommandGroup>
        {user && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Signed in as">
              <CommandItem disabled>
                <IconUserCircle className="size-4" />
                <span>{user.email}</span>
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
