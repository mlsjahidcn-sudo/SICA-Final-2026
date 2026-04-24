'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import {
  Menu,
  User,
  LogIn,
  LogOut,
  Building2,
  Settings,
  ChevronDown,
  LayoutDashboard,
  FileText,
  ChevronRight,
  Send,
} from 'lucide-react';
import {
  IconSparkles,
  IconBuilding,
  IconSchool,
  IconInfoCircle,
  IconMail,
  IconLayoutDashboard,
  IconFileText,
  IconLogout,
  IconLogin,
  IconUser,
  IconSettings,
  IconChevronDown,
  IconChevronRight,
  IconMenu2,
  IconAward,
  IconGlobe,
  IconSend,
  IconHelpCircle,
} from '@tabler/icons-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

export function Header() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getUserInitials = () => {
    if (!user?.full_name) return 'U';
    return user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/login');
  };

  // Navigation Menu ListItem component
  const ListItem = ({
    title,
    href,
    icon: Icon,
  }: {
    title: string;
    href: string;
    icon?: React.ComponentType<{ className?: string }>;
  }) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link prefetch={false}
            href={href}
            className={cn(
              "flex items-center gap-2 select-none rounded-md px-3 py-2 text-sm font-medium leading-none no-underline outline-none transition-colors",
              "hover:bg-muted hover:text-primary focus:bg-muted"
            )}
          >
            {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            <span>{title}</span>
          </Link>
        </NavigationMenuLink>
      </li>
    );
  };

  // Program items data
  const degreePrograms = [
    { title: "Bachelor's Degrees", href: "/programs?degree_type=Bachelor" },
    { title: "Master's Degrees", href: "/programs?degree_type=Master" },
    { title: "PhD Programs", href: "/programs?degree_type=PhD" },
  ];

  const otherPrograms = [
    { title: "Language Programs", href: "/programs?degree_type=Chinese Language" },
    { title: "Short-term Programs", href: "/programs?degree_type=Diploma" },
  ];

  const programItems = [
    { label: "Bachelor's Degrees", href: '/programs?degree_type=Bachelor' },
    { label: "Master's Degrees", href: '/programs?degree_type=Master' },
    { label: 'PhD Programs', href: '/programs?degree_type=PhD' },
    { label: 'Language Programs', href: '/programs?degree_type=Chinese Language' },
    { label: 'Short-term Programs', href: '/programs?degree_type=Diploma' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo */}
        <Link prefetch={false} href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="SICA - Study in China Academy"
            width={100}
            height={40}
            className="h-8 sm:h-10 w-auto"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden lg:flex" viewport={false}>
          <NavigationMenuList>
            {/* Free Assessment - Highlighted */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link prefetch={false}
                  href="/assessment"
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-primary font-semibold gap-1.5"
                  )}
                >
                  <IconSparkles className="h-4 w-4" />
                  Free Assessment
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Programs Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-1.5">
                <IconGlobe className="h-4 w-4" />
                Programs
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-56 p-2">
                  {/* Degree Programs */}
                  <li>
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Degree
                    </div>
                  </li>
                  {degreePrograms.map((program) => (
                    <ListItem key={program.href} title={program.title} href={program.href} />
                  ))}

                  {/* Other Programs */}
                  <li className="mt-2 pt-2 border-t">
                    <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Other
                    </div>
                  </li>
                  {otherPrograms.map((program) => (
                    <ListItem key={program.href} title={program.title} href={program.href} />
                  ))}

                  {/* View All */}
                  <li className="mt-2 pt-2 border-t">
                    <Link prefetch={false}
                      href="/programs"
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 transition-colors"
                    >
                      <IconChevronRight className="h-3.5 w-3.5" />
                      View All Programs
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Universities */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link prefetch={false} href="/universities" className={cn(navigationMenuTriggerStyle(), "gap-1.5")}>
                  <IconSchool className="h-4 w-4" />
                  Universities
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>

            {/* Resources Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-1.5">
                <IconFileText className="h-4 w-4" />
                Resources
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-48 p-2">
                  <ListItem title="Blog" href="/blog" icon={IconFileText} />
                  <ListItem title="Success Cases" href="/success-cases" icon={IconAward} />
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* About Dropdown */}
            <NavigationMenuItem>
              <NavigationMenuTrigger className="gap-1.5">
                <IconInfoCircle className="h-4 w-4" />
                About
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="w-48 p-2">
                  <ListItem title="About Us" href="/about" icon={IconInfoCircle} />
                  <ListItem title="Partners" href="/partners" icon={IconBuilding} />
                  <ListItem title="Contact" href="/contact" icon={IconMail} />
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            mounted && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">{user.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link prefetch={false} href={user.role === 'partner' ? '/partner-v2' : user.role === 'admin' ? '/admin/v2' : user.role === 'student' ? '/student-v2' : '/dashboard'} className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link prefetch={false} href={user.role === 'partner' ? '/partner-v2/profile' : user.role === 'student' ? '/student-v2/profile' : '/profile'} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'student' && (
                    <DropdownMenuItem asChild>
                      <Link prefetch={false} href="/assessment/track" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        My Assessments
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link prefetch={false} href="/admin/v2" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Admin Panel
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  {user.role === 'partner' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link prefetch={false} href="/partner-v2" className="flex items-center">
                          <Building2 className="mr-2 h-4 w-4" />
                          Partner Portal
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <>
              {mounted && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="User menu">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link prefetch={false} href="/login" className="flex items-center">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link prefetch={false} href="/register" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Register
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link prefetch={false} href="/login" className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button asChild className="gap-2">
                <Link prefetch={false} href="/apply">
                  <Send className="h-4 w-4" />
                  Apply Now
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        {mounted && (
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" aria-label="Open menu" className="h-9 w-9">
                <IconMenu2 className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px] p-0 flex flex-col">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>

              <div className="flex-1 overflow-y-auto">
                <div className="px-4 py-5 space-y-5">

                  {/* User Info Card */}
                  {user && (
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                          <AvatarImage src={user.avatar_url} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{getUserInitials()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm truncate">{user.full_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                          <Badge variant="secondary" className="mt-1 text-[10px] capitalize">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Menu Section */}
                  <nav className="space-y-0.5">
                    <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                      Menu
                    </div>
                    <Link prefetch={false}
                      href="/assessment"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-primary/10 text-primary font-medium transition-colors"
                    >
                      <IconSparkles className="h-5 w-5 flex-shrink-0 text-primary/70" />
                      <span>Free Assessment</span>
                    </Link>

                    {/* Programs Collapsible */}
                    <Collapsible className="space-y-0.5">
                      <CollapsibleTrigger asChild>
                        <button className="group w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted transition-colors text-foreground">
                          <IconGlobe className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          <span className="flex-1 text-left">Programs</span>
                          <IconChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="overflow-hidden">
                        <div className="ml-6 pl-4 border-l-2 border-primary/15 space-y-0.5">
                          {programItems.map((item) => (
                            <Link prefetch={false}
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              className="flex items-center gap-2 py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                              <span>{item.label}</span>
                            </Link>
                          ))}
                          <Link prefetch={false}
                            href="/programs"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-2 py-2 px-3 rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors text-sm"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            <span>View All Programs</span>
                          </Link>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <Link prefetch={false}
                      href="/universities"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconSchool className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Universities</span>
                    </Link>

                    <Link prefetch={false}
                      href="/scholarships"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconAward className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Scholarships</span>
                    </Link>
                  </nav>

                  {/* Resources Section */}
                  <nav className="space-y-0.5 pt-4 border-t">
                    <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                      Resources
                    </div>
                    <Link prefetch={false}
                      href="/blog"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconFileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Blog</span>
                    </Link>
                    <Link prefetch={false}
                      href="/success-cases"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconAward className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Success Cases</span>
                    </Link>
                    <Link prefetch={false}
                      href="/faq"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconHelpCircle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>FAQ</span>
                    </Link>
                  </nav>

                  {/* Company Section */}
                  <nav className="space-y-0.5 pt-4 border-t">
                    <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                      Company
                    </div>
                    <Link prefetch={false}
                      href="/about"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconInfoCircle className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>About</span>
                    </Link>
                    <Link prefetch={false}
                      href="/partners"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconBuilding className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Partners</span>
                    </Link>
                    <Link prefetch={false}
                      href="/contact"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <IconMail className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Contact</span>
                    </Link>
                  </nav>

                  {/* Account Section */}
                  {user && (
                    <nav className="space-y-0.5 pt-4 border-t">
                      <div className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2 px-3">
                        Account
                      </div>
                      <Link prefetch={false}
                        href={user.role === 'partner' ? '/partner-v2' : user.role === 'admin' ? '/admin/v2' : user.role === 'student' ? '/student-v2' : '/dashboard'}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <IconLayoutDashboard className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span>Dashboard</span>
                      </Link>
                      <Link prefetch={false}
                        href={user.role === 'partner' ? '/partner-v2/profile' : user.role === 'student' ? '/student-v2/profile' : '/profile'}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <IconUser className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span>Profile</span>
                      </Link>
                      {user.role === 'student' && (
                        <Link prefetch={false}
                          href="/assessment/track"
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                        >
                          <IconFileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                          <span>My Assessments</span>
                        </Link>
                      )}
                    </nav>
                  )}

                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-4 py-4 border-t space-y-3 bg-muted/30">
                {user ? (
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 gap-3 h-10"
                    onClick={handleSignOut}
                  >
                    <IconLogout className="h-5 w-5" />
                    <span>Sign Out</span>
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Link prefetch={false} href="/login" onClick={() => setIsOpen(false)} className="block">
                      <Button variant="outline" className="w-full h-10 gap-2">
                        <IconLogin className="h-4 w-4" />
                        Sign In
                      </Button>
                    </Link>
                    <Link prefetch={false} href="/register" onClick={() => setIsOpen(false)} className="block">
                      <Button className="w-full h-10 gap-2">
                        <IconUser className="h-4 w-4" />
                        Register
                      </Button>
                    </Link>
                  </div>
                )}

                <Link prefetch={false} href="/apply" onClick={() => setIsOpen(false)} className="block">
                  <Button className="w-full h-11 font-semibold shadow-sm transition-all active:scale-[0.98] gap-2">
                    <IconSend className="h-4 w-4" />
                    Apply Now
                  </Button>
                </Link>

                {/* Portal Links */}
                {!user && (
                  <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground pt-1">
                    <Link prefetch={false}
                      href="/login"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconBuilding className="h-3.5 w-3.5" />
                      Partner
                    </Link>
                    <Link prefetch={false}
                      href="/login"
                      className="hover:text-primary transition-colors flex items-center gap-1"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconSettings className="h-3.5 w-3.5" />
                      Admin
                    </Link>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  );
}
