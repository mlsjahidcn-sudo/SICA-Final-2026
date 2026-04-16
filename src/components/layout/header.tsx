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
  IconX,
  IconAward,
  IconGlobe,
  IconSend,
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
    description,
    href,
  }: {
    title: string;
    description: string;
    href: string;
  }) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <Link
            href={href}
            className={cn(
              "block select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-all",
              "hover:bg-muted focus:bg-muted"
            )}
          >
            <span className="text-sm font-medium leading-none">{title}</span>
            {description && (
              <p className="line-clamp-2 text-xs text-muted-foreground leading-relaxed mt-1">
                {description}
              </p>
            )}
          </Link>
        </NavigationMenuLink>
      </li>
    );
  };

  // Program items data
  const degreePrograms = [
    {
      title: "Bachelor's Degrees",
      href: "/programs?degree_type=bachelor",
      description: "4-year undergraduate programs with diverse majors and scholarships",
    },
    {
      title: "Master's Degrees",
      href: "/programs?degree_type=master",
      description: "Graduate programs with research opportunities and thesis tracks",
    },
    {
      title: "PhD Programs",
      href: "/programs?degree_type=phd",
      description: "Doctoral research programs across various disciplines",
    },
  ];

  const otherPrograms = [
    {
      title: "Language Programs",
      href: "/programs?degree_type=language",
      description: "Chinese language courses for international students",
    },
    {
      title: "Short-term Programs",
      href: "/programs?degree_type=short_term",
      description: "Summer schools, exchange programs, and winter camps",
    },
  ];

  // Mobile navigation items with icons
  const mainNavItems = [
    { label: 'Free Assessment', href: '/assessment', icon: IconSparkles, highlight: true },
    { label: 'Universities', href: '/universities', icon: IconSchool },
  ];

  const resourceNavItems = [
    { label: 'Blog', href: '/blog', icon: IconFileText },
    { label: 'Success Cases', href: '/success-cases', icon: IconAward },
  ];

  const aboutNavItems = [
    { label: 'About', href: '/about', icon: IconInfoCircle },
    { label: 'Partners', href: '/partners', icon: IconBuilding },
    { label: 'Contact', href: '/contact', icon: IconMail },
  ];

  const programItems = [
    { label: "Bachelor's Degrees", href: '/programs?degree_type=bachelor' },
    { label: "Master's Degrees", href: '/programs?degree_type=master' },
    { label: 'PhD Programs', href: '/programs?degree_type=phd' },
    { label: 'Language Programs', href: '/programs?degree_type=language' },
    { label: 'Short-term Programs', href: '/programs?degree_type=short_term' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center">
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
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {/* Free Assessment - Highlighted */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link
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
                <ul className="grid w-[600px] gap-1 p-2 md:grid-cols-2 lg:grid-cols-2">
                  {/* Degree Programs Section */}
                  <li className="col-span-2">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Degree Programs
                    </div>
                  </li>
                  {degreePrograms.map((program) => (
                    <ListItem
                      key={program.href}
                      title={program.title}
                      description={program.description}
                      href={program.href}
                    />
                  ))}
                  
                  {/* Other Programs Section */}
                  <li className="col-span-2 mt-2">
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Other Programs
                    </div>
                  </li>
                  {otherPrograms.map((program) => (
                    <ListItem
                      key={program.href}
                      title={program.title}
                      description={program.description}
                      href={program.href}
                    />
                  ))}
                  
                  {/* View All */}
                  <li className="col-span-2 mt-2 pt-2 border-t">
                    <NavigationMenuLink asChild>
                      <Link
                        href="/programs"
                        className={cn(
                          "flex items-center gap-2 rounded-lg p-3 text-primary font-medium transition-all",
                          "hover:bg-primary/5"
                        )}
                      >
                        <IconChevronRight className="h-4 w-4" />
                        View All Programs
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {/* Universities */}
            <NavigationMenuItem>
              <NavigationMenuLink asChild>
                <Link href="/universities" className={cn(navigationMenuTriggerStyle(), "gap-1.5")}>
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
                <ul className="w-[280px] p-2">
                  <ListItem
                    title="Blog"
                    description="Latest news, guides, and insights about studying in China"
                    href="/blog"
                  />
                  <ListItem
                    title="Success Cases"
                    description="Real stories from students who achieved their dreams"
                    href="/success-cases"
                  />
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
                <ul className="w-[280px] p-2">
                  <ListItem
                    title="About Us"
                    description="Learn about our mission and team"
                    href="/about"
                  />
                  <ListItem
                    title="Partners"
                    description="Our university and institutional partners"
                    href="/partners"
                  />
                  <ListItem
                    title="Contact"
                    description="Get in touch with our team"
                    href="/contact"
                  />
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
                    <Link href={user.role === 'partner' ? '/partner-v2' : user.role === 'admin' ? '/admin/v2' : user.role === 'student' ? '/student-v2' : '/dashboard'} className="flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={user.role === 'partner' ? '/partner-v2/profile' : user.role === 'student' ? '/student-v2/profile' : '/profile'} className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {user.role === 'student' && (
                    <DropdownMenuItem asChild>
                      <Link href="/assessment/track" className="flex items-center">
                        <FileText className="mr-2 h-4 w-4" />
                        My Assessments
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/admin/v2" className="flex items-center">
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
                        <Link href="/partner-v2" className="flex items-center">
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
                      <Link href="/login" className="flex items-center">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/register" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        Register
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href="/login" className="flex items-center">
                        <Building2 className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button asChild className="gap-2">
                <Link href="/apply">
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
            <SheetContent side="top" className="h-auto max-h-[90vh] overflow-y-auto p-0">
              <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
              
              {/* Header with close button */}
              <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b bg-background/95 backdrop-blur z-10">
                <Image
                  src="/logo.png"
                  alt="SICA"
                  width={80}
                  height={32}
                  className="h-8 w-auto"
                />
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsOpen(false)}
                  className="h-9 w-9 rounded-full hover:bg-muted"
                >
                  <IconX className="h-5 w-5" />
                </Button>
              </div>

              <div className="px-5 py-6 space-y-6">
                {/* User Info Card */}
                {user && (
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 ring-2 ring-primary/20">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{user.full_name}</div>
                        <div className="text-sm text-muted-foreground truncate">{user.email}</div>
                        <Badge variant="secondary" className="mt-1 text-xs capitalize">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <Link href="/apply" onClick={() => setIsOpen(false)}>
                  <Button className="w-full h-11 font-semibold shadow-sm transition-all active:scale-[0.98]">
                    <IconSend className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </Link>

                {/* Main Navigation Section */}
                <nav className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                    Menu
                  </div>
                  {mainNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-colors",
                          item.highlight 
                            ? "bg-primary/10 text-primary font-medium" 
                            : "hover:bg-muted text-foreground"
                        )}
                      >
                        <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Programs Section */}
                <Collapsible className="space-y-1">
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted transition-colors text-foreground">
                      <IconGlobe className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 text-left">Programs</span>
                      <IconChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="overflow-hidden">
                    <div className="pl-11 pt-1 space-y-0.5">
                      {programItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className="flex items-center gap-2 py-2 px-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors text-sm"
                        >
                          <IconChevronRight className="h-3.5 w-3.5" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      <Link
                        href="/programs"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-2 py-2 px-3 rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors text-sm"
                      >
                        <IconChevronRight className="h-3.5 w-3.5" />
                        <span>View All</span>
                      </Link>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Resources Section */}
                <nav className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                    Resources
                  </div>
                  {resourceNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* About Section */}
                <nav className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                    Company
                  </div>
                  {aboutNavItems.map((item) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                      >
                        <IconComponent className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>

                {/* Account Section (logged in) */}
                {user && (
                  <nav className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-3">
                      Account
                    </div>
                    <Link
                      href={user.role === 'partner' ? '/partner-v2' : user.role === 'admin' ? '/admin/v2' : user.role === 'student' ? '/student-v2' : '/dashboard'}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconLayoutDashboard className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href={user.role === 'partner' ? '/partner-v2/profile' : user.role === 'student' ? '/student-v2/profile' : '/profile'}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconUser className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                      <span>Profile</span>
                    </Link>
                    {user.role === 'student' && (
                      <Link
                        href="/assessment/track"
                        className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted text-foreground transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        <IconFileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <span>My Assessments</span>
                      </Link>
                    )}
                  </nav>
                )}

                {/* Auth Section */}
                <div className="pt-4 border-t">
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
                      <Link href="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full h-10 gap-2">
                          <IconLogin className="h-4 w-4" />
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full h-10 gap-2">
                          <IconUser className="h-4 w-4" />
                          Register
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>

                {/* Portal Links (not logged in) */}
                {!user && (
                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <Link
                      href="/login"
                      className="hover:text-primary transition-colors flex items-center gap-1.5"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconBuilding className="h-4 w-4" />
                      Partner
                    </Link>
                    <Link
                      href="/login"
                      className="hover:text-primary transition-colors flex items-center gap-1.5"
                      onClick={() => setIsOpen(false)}
                    >
                      <IconSettings className="h-4 w-4" />
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
