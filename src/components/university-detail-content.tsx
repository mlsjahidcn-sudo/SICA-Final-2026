'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { SchemaOrg } from './schema-org';
import { Breadcrumbs } from './breadcrumbs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Kbd } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Item,
  ItemMedia,
  ItemContent,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemGroup,
} from '@/components/ui/item';
import {
  Field,
  FieldTitle,
  FieldDescription,
} from '@/components/ui/field';
import {
  IconMapPin,
  IconUsers,
  IconCalendar,
  IconGlobe,
  IconAward,
  IconStar,
  IconBook,
  IconBuilding,
  IconArrowLeft,
  IconLoader2,
  IconClock,
  IconTrophy,
  IconCash,
  IconSchool,
  IconChevronRight,
  IconExternalLink,
  IconBrandWechat,
  IconMail,
  IconPhone,
  IconLanguage,
  IconCategory,
  IconCoinYuan,
  IconClipboardCheck,
} from '@tabler/icons-react';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  short_name: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  province: string;
  city: string;
  address: string | null;
  address_en: string | null;
  address_cn: string | null;
  website: string | null;
  slug: string | null;
  type: string[] | null;
  tags: string[];
  category: string | null;
  ranking_national: number | null;
  ranking_international: number | null;
  founded_year: number | null;
  student_count: number | null;
  international_student_count: number | null;
  faculty_count: number | null;
  teaching_languages: string[] | null;
  scholarship_available: boolean;
  scholarship_info: string | null;
  scholarship_info_cn: string | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  facilities: string | null;
  facilities_en: string | null;
  facilities_cn: string | null;
  accommodation_info: string | null;
  accommodation_info_en: string | null;
  accommodation_info_cn: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  latitude: string | null;
  longitude: string | null;
  meta_title: string | null;
  meta_description: string | null;
  og_image: string | null;
  country: string | null;
  tuition_min: number | null;
  tuition_max: number | null;
  tuition_currency: string | null;
  default_tuition_per_year: number | null;
  default_tuition_currency: string | null;
  use_default_tuition: boolean;
  scholarship_percentage: number | null;
  tuition_by_degree: Record<string, number> | null;
  scholarship_by_degree: Record<string, number> | null;
  tier: string | null;
  acceptance_flexibility: string | null;
  csca_required: boolean;
  has_application_fee: boolean;
  accommodation_fee: number | null;
  accommodation_fee_currency: string | null;
  application_deadline: string | null;
  intake_months: (string | number)[] | null;
  images: string[] | null;
  video_urls: string[] | null;
}

function cleanUrl(url: string): string {
  return url.replace(/^["']+|["']+$/g, '').trim();
}

// Type badge styling helper
function getTypeBadgeStyle(type: string | null): string {
  switch (type) {
    case '985':
      return 'bg-red-500/10 text-red-600 border-red-200';
    case '211':
      return 'bg-blue-500/10 text-blue-600 border-blue-200';
    case 'Double First-Class':
      return 'bg-purple-500/10 text-purple-600 border-purple-200';
    case 'Provincial':
      return 'bg-green-500/10 text-green-600 border-green-200';
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function getTypeLabel(type: string | null): string {
  switch (type) {
    case '985':
      return '985 Project';
    case '211':
      return '211 Project';
    case 'Double First-Class':
      return 'Double First-Class';
    case 'Provincial':
      return 'Provincial Key';
    default:
      return type || '';
  }
}

interface Program {
  id: string;
  name: string;
  name_fr: string | null;
  slug: string | null;
  degree_level: string;
  language: string;
  tuition_fee_per_year: number | null;
  currency: string;
  category: string | null;
  sub_category: string | null;
  curriculum_en: string | null;
  curriculum_cn: string | null;
  career_prospects_en: string | null;
  is_active: boolean;
}

interface RelatedUniversity {
  id: string;
  name_en: string;
  name_cn: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  city: string;
  province: string;
  tags: string[];
  ranking_national: number | null;
  tuition_min: number | null;
  tuition_currency: string | null;
  scholarship_available: boolean;
  application_deadline: string | null;
  intake_months: (string | number)[] | null;
  degree_types: string[] | null;
}

// Gallery Grid Component
function GalleryGrid({ images, universityName }: { images: string[]; universityName: string }) {
  const [showAll, setShowAll] = useState(false);
  const displayImages = showAll ? images : images.slice(0, 6);

  if (images.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        {displayImages.map((img, i) => (
          <AspectRatio key={i} ratio={4/3} className="rounded-lg overflow-hidden bg-muted">
            <img
              src={cleanUrl(img)}
              alt={`${universityName} - Image ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </AspectRatio>
        ))}
      </div>
      {images.length > 6 && !showAll && (
        <Button variant="outline" size="sm" onClick={() => setShowAll(true)} className="w-full">
          View all {images.length} photos
        </Button>
      )}
    </div>
  );
}

// Related University Card Component
function RelatedUniversityCard({ university }: { university: RelatedUniversity }) {
  // Calculate days until deadline
  const getDeadlineInfo = (deadline: string | null): { date: Date; daysLeft: number } | null => {
    if (!deadline) return null;
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { date: deadlineDate, daysLeft };
    } catch {
      return null;
    }
  };

  const deadlineInfo = getDeadlineInfo(university.application_deadline);
  
  // Format intake months
  const formatIntake = (months: (string | number)[] | null): string | null => {
    if (!months || months.length === 0) return null;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.slice(0, 3).map(m => {
      const num = typeof m === 'string' ? parseInt(m, 10) : m;
      return monthNames[num - 1] || String(m);
    }).join('/');
  };

  // Format degrees - convert degree types to abbreviations
  const formatDegrees = (degrees: string[] | null): string | null => {
    if (!degrees || degrees.length === 0) return null;
    const degreeMap: Record<string, string> = {
      'bachelor': 'B',
      'master': 'M',
      'phd': 'D',
      'doctoral': 'D',
      'doctor': 'D',
    };
    return degrees.map(d => degreeMap[d.toLowerCase()] || d.charAt(0).toUpperCase()).join('/');
  };

  return (
    <Link href={`/universities/${university.id}`} className="group block">
      <div className="h-full transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-primary/20 overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
        {/* Cover Image */}
        <div className="relative">
          <AspectRatio ratio={16/9}>
            {university.cover_image_url && university.cover_image_url.trim() !== '' ? (
              <img
                src={university.cover_image_url}
                alt={university.name_en}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-muted to-muted/50 flex items-center justify-center">
                <IconBuilding className="h-8 w-8 text-muted-foreground/50" />
              </div>
            )}
          </AspectRatio>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
            {university.ranking_national && (
              <Badge variant="secondary" className="gap-1 text-xs shadow-sm backdrop-blur-sm bg-background/80">
                <IconTrophy className="h-3 w-3 text-amber-500" />
                #{university.ranking_national}
              </Badge>
            )}
            {university.scholarship_available ? (
              <Badge className="bg-amber-500/90 text-white gap-1 text-xs border-0 shadow-sm">
                <IconAward className="h-3 w-3" />
                Scholarship
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs shadow-sm backdrop-blur-sm bg-background/80 text-muted-foreground">
                No Scholarship
              </Badge>
            )}
          </div>
        </div>

        {/* Header: Logo + Name */}
        <div className="px-3 pt-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg border bg-background flex items-center justify-center shrink-0 overflow-hidden">
              {university.logo_url && university.logo_url.trim() !== '' ? (
                <img src={university.logo_url} alt="" className="w-full h-full object-contain" />
              ) : (
                <IconBuilding className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {university.name_en}
              </h3>
              {university.name_cn && (
                <p className="text-xs text-muted-foreground truncate">{university.name_cn}</p>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                <IconMapPin className="h-3 w-3" />
                {university.city}, {university.province}
              </div>
            </div>
          </div>
        </div>

        {/* Meta Info: Deadline, Intake, Degrees */}
        <div className="px-3 py-2">
          <div className="grid grid-cols-3 gap-2 text-xs">
            {/* Deadline */}
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <IconCalendar className="h-3 w-3" />
                Deadline
              </span>
              {deadlineInfo ? (
                <span className={cn(
                  "font-medium",
                  deadlineInfo.daysLeft <= 0 ? "text-muted-foreground" :
                  deadlineInfo.daysLeft <= 30 ? "text-red-600" : 
                  deadlineInfo.daysLeft <= 60 ? "text-amber-600" : "text-foreground"
                )}>
                  {deadlineInfo.daysLeft <= 0 ? "Closed" : `${deadlineInfo.daysLeft}d left`}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>

            {/* Intake */}
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <IconClock className="h-3 w-3" />
                Intake
              </span>
              <span className="font-medium truncate">
                {formatIntake(university.intake_months) || '-'}
              </span>
            </div>

            {/* Degrees */}
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground flex items-center gap-1">
                <IconSchool className="h-3 w-3" />
                Degrees
              </span>
              <span className="font-medium">
                {formatDegrees(university.degree_types) || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Tuition */}
        <div className="px-3 py-2 border-t flex justify-between items-center">
          <div className="text-sm">
            {university.tuition_min ? (
              <span className="font-semibold">
                {university.tuition_currency || '¥'}{university.tuition_min.toLocaleString()}
                <span className="text-xs text-muted-foreground font-normal">/yr</span>
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Tuition on request</span>
            )}
          </div>
          <IconChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Link>
  );
}

// Deadline Countdown Card
function DeadlineCard({ deadline, timeLeft }: { deadline: string; timeLeft: { days: number; hours: number; minutes: number; seconds: number } | null }) {
  return (
    <Card size="sm" className="border-primary/20">
      <CardHeader className="pb-1.5 pt-3 px-3">
        <CardTitle className="flex items-center gap-1.5 text-xs">
          <IconCalendar className="h-3.5 w-3.5" />
          Application Deadline
        </CardTitle>
        <CardAction>
          <Badge variant="secondary" className="rounded-full text-[10px]">
            {timeLeft ? "Open" : "Closed"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-2 px-3 pb-3">
        <div className="text-sm font-bold">
          {new Date(deadline).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })}
        </div>

        {timeLeft ? (
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { value: timeLeft.days, label: 'Days' },
              { value: timeLeft.hours, label: 'Hrs' },
              { value: timeLeft.minutes, label: 'Mins' },
              { value: timeLeft.seconds, label: 'Secs' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <Kbd className="text-sm font-bold w-full justify-center mb-0.5 py-0.5 px-1">
                  {value}
                </Kbd>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-2 border-2 border-dashed rounded-lg">
            <IconClock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <div className="text-xs text-muted-foreground">Applications are currently closed</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Info Sidebar Card
function InfoSidebarCard({ university }: { university: University }) {
  return (
    <div className="space-y-4">
      {/* Quick Info */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Quick Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {university.ranking_national && (
            <Field orientation="horizontal">
              <FieldTitle className="text-muted-foreground flex items-center gap-1.5">
                <IconTrophy className="h-4 w-4 text-amber-500" />
                National Rank
              </FieldTitle>
              <FieldDescription className="font-semibold">#{university.ranking_national}</FieldDescription>
            </Field>
          )}

          {university.ranking_international && (
            <Field orientation="horizontal">
              <FieldTitle className="text-muted-foreground flex items-center gap-1.5">
                <IconGlobe className="h-4 w-4 text-blue-500" />
                World Rank
              </FieldTitle>
              <FieldDescription className="font-semibold">#{university.ranking_international}</FieldDescription>
            </Field>
          )}

          {university.founded_year && (
            <Field orientation="horizontal">
              <FieldTitle className="text-muted-foreground">Founded</FieldTitle>
              <FieldDescription>{university.founded_year}</FieldDescription>
            </Field>
          )}

          <Field orientation="horizontal">
            <FieldTitle className="text-muted-foreground flex items-center gap-1.5">
              <IconMapPin className="h-4 w-4 text-red-500" />
              Location
            </FieldTitle>
            <FieldDescription>{university.city}, {university.province}</FieldDescription>
          </Field>

          {university.student_count && (
            <Field orientation="horizontal">
              <FieldTitle className="text-muted-foreground">Students</FieldTitle>
              <FieldDescription>{university.student_count.toLocaleString()}</FieldDescription>
            </Field>
          )}

          {university.international_student_count && (
            <Field orientation="horizontal">
              <FieldTitle className="text-muted-foreground">Int&apos;l Students</FieldTitle>
              <FieldDescription>{university.international_student_count.toLocaleString()}</FieldDescription>
            </Field>
          )}

          {university.faculty_count && (
            <Field orientation="horizontal">
              <FieldTitle className="text-muted-foreground">Faculty</FieldTitle>
              <FieldDescription>{university.faculty_count.toLocaleString()}</FieldDescription>
            </Field>
          )}
        </CardContent>
      </Card>

      {/* Tuition */}
      <Card size="sm">
        <CardHeader>
          <CardTitle>Tuition</CardTitle>
        </CardHeader>
        <CardContent>
          {university.tuition_min ? (
            <div className="space-y-1">
              <div className="text-2xl font-bold">
                {(university.tuition_currency || '¥')}{university.tuition_min.toLocaleString()}
                <span className="text-sm text-muted-foreground font-normal">/year</span>
              </div>
              {university.tuition_max && university.tuition_max !== university.tuition_min && (
                <div className="text-sm text-muted-foreground">
                  Up to {(university.tuition_currency || '¥')}{university.tuition_max.toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Contact for tuition info</div>
          )}
        </CardContent>
      </Card>

      {/* Teaching Languages */}
      {university.teaching_languages && university.teaching_languages.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Teaching Languages</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {university.teaching_languages.map((lang) => (
                <Kbd key={lang}>{lang}</Kbd>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact */}
      {(university.contact_email || university.contact_phone) && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {university.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <IconMail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${university.contact_email}`} className="hover:text-primary">
                  {university.contact_email}
                </a>
              </div>
            )}
            {university.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <IconPhone className="h-4 w-4 text-muted-foreground" />
                <span>{university.contact_phone}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Skeleton */}
      <div className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Skeleton className="h-4 w-48 mb-6" />
          <div className="flex items-start gap-6">
            <Skeleton className="w-24 h-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-4 gap-2 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-lg" />
      </div>
    </div>
  );
}

interface UniversityDetailContentProps {
  universityId: string;
}

export function UniversityDetailContent({ universityId }: UniversityDetailContentProps) {
  const [university, setUniversity] = useState<University | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [relatedUniversities, setRelatedUniversities] = useState<RelatedUniversity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const uniResponse = await fetch(`/api/universities/${universityId}`);
        const uniData = await uniResponse.json();

        if (uniData.error) {
          throw new Error(uniData.error);
        }

        setUniversity(uniData.university);

        const progResponse = await fetch(`/api/programs?university_id=${universityId}`);
        const progData = await progResponse.json();
        setPrograms(progData.programs || []);

        if (uniData.university?.province) {
          const sameProvinceResponse = await fetch(`/api/universities?province=${uniData.university.province}&limit=5`);
          const sameProvinceData = await sameProvinceResponse.json();

          let related = (sameProvinceData.universities || [])
            .filter((u: RelatedUniversity) => u.id !== universityId)
            .slice(0, 4);

          if (related.length < 4) {
            const allResponse = await fetch('/api/universities?limit=10');
            const allData = await allResponse.json();
            const others = (allData.universities || [])
              .filter((u: RelatedUniversity) => u.id !== universityId && !related.find((r: RelatedUniversity) => r.id === u.id));
            related = [...related, ...others.slice(0, 4 - related.length)];
          }

          setRelatedUniversities(related);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [universityId]);

  useEffect(() => {
    const deadlineStr = university?.application_deadline;
    if (!deadlineStr) {
      setTimeLeft(null);
      return;
    }

    const calculateTimeLeft = () => {
      const deadline = new Date(deadlineStr);
      const now = new Date();
      const difference = deadline.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [university?.application_deadline]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!university) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card size="sm" className="max-w-md">
          <CardContent className="py-8 text-center">
            <IconBuilding className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">University not found</h1>
            <p className="text-sm text-muted-foreground mb-4">The university you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Button asChild>
              <Link href="/universities">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to Universities
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const universitySchema = university ? {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: university.name_en,
    ...(university.name_cn && { alternateName: university.name_cn }),
    ...(university.logo_url && { logo: university.logo_url }),
    ...(university.description && { description: university.description }),
    address: {
      '@type': 'PostalAddress',
      addressLocality: university.city,
      addressRegion: university.province,
      addressCountry: 'CN',
      ...(university.address && { streetAddress: university.address }),
    },
    ...(university.website && { url: university.website }),
    ...(university.contact_email && { email: university.contact_email }),
    ...(university.contact_phone && { telephone: university.contact_phone }),
    ...(university.founded_year && { foundingDate: university.founded_year.toString() }),
  } : null;

  return (
    <>
      {universitySchema && <SchemaOrg schema={universitySchema} />}
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 py-6">
            {/* Breadcrumb */}
            <Breadcrumbs 
              items={[
                { label: 'Home', href: '/' },
                { label: 'Universities', href: '/universities' },
                { label: university.name_en },
              ]} 
              className="mb-6"
            />

            {/* Hero Section */}
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-6 text-center lg:text-left">
              {/* Logo */}
              <div className="flex-shrink-0">
                {university.logo_url && university.logo_url.trim() !== '' ? (
                  <img 
                    src={university.logo_url} 
                    alt={university.name_en} 
                    className="w-28 h-28 lg:w-32 lg:h-32 rounded-full object-contain" 
                  />
                ) : (
                  <div className="w-28 h-28 lg:w-32 lg:h-32 rounded-full bg-muted flex items-center justify-center">
                    <IconBuilding className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col items-center lg:items-start">
                <h1 className="text-2xl lg:text-3xl font-bold">{university.name_en}</h1>
                
                {/* Chinese name + Location inline */}
                <div className="flex flex-wrap items-center gap-2 mt-1 justify-center lg:justify-start">
                  {university.name_cn && (
                    <p className="text-base text-muted-foreground">{university.name_cn}</p>
                  )}
                  <span className="text-muted-foreground/50">•</span>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconMapPin className="h-4 w-4" />
                    {university.city}, {university.province}
                  </div>
                </div>
                
                {/* Type Badges + Ranks */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {university.type && university.type.length > 0 && university.type.map((type) => (
                    <Badge key={type} variant="outline" className={cn(
                      "text-sm px-3 py-1",
                      getTypeBadgeStyle(type)
                    )}>
                      {getTypeLabel(type)}
                    </Badge>
                  ))}
                  {university.ranking_national && (
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                      <IconTrophy className="h-3.5 w-3.5 mr-1 text-amber-500" />
                      National Rank #{university.ranking_national}
                    </Badge>
                  )}
                  {university.ranking_international && (
                    <Badge variant="outline" className="text-sm px-3 py-1 bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400">
                      <IconGlobe className="h-3.5 w-3.5 mr-1 text-blue-500" />
                      Global Rank #{university.ranking_international}
                    </Badge>
                  )}
                </div>
                
                {/* CTA Buttons */}
                <div className="flex flex-wrap gap-3 mt-4 justify-center lg:justify-start">
                  <Button asChild size="lg">
                    <Link href={`/apply?university_id=${university.id}`}>Apply Now</Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild>
                    <Link href="/assessment">
                      <IconClipboardCheck className="mr-2 h-4 w-4" />
                      Free Assessment
                    </Link>
                  </Button>
                  {university.website && (
                    <Button variant="ghost" asChild size="lg">
                      <a href={university.website} target="_blank" rel="noopener noreferrer">
                        <IconGlobe className="mr-2 h-4 w-4" />
                        Visit Website
                      </a>
                    </Button>
                  )}
                </div>
              </div>

              {/* Right: Deadline Card (Desktop) */}
              {university.application_deadline && (
                <div className="hidden lg:block w-72 shrink-0">
                  <DeadlineCard deadline={university.application_deadline} timeLeft={timeLeft} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Left: Tabs Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile Deadline Card */}
              {university.application_deadline && (
                <div className="lg:hidden mb-6">
                  <DeadlineCard deadline={university.application_deadline} timeLeft={timeLeft} />
                </div>
              )}

              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="w-full justify-start overflow-x-auto h-auto p-1">
                  <TabsTrigger value="overview" className="px-4 py-2">Overview</TabsTrigger>
                  <TabsTrigger value="programs" className="px-4 py-2">Programs</TabsTrigger>
                  <TabsTrigger value="scholarships" className="px-4 py-2">Scholarships</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* About */}
                  {(university.description_en || university.description_cn || university.description) && (
                    <Card size="sm">
                      <CardHeader>
                        <CardTitle>About</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground leading-relaxed">
                        {university.description_en || university.description_cn || university.description}
                      </CardContent>
                    </Card>
                  )}

                  {/* Gallery */}
                  {university.images && university.images.length > 0 && (
                    <Card size="sm">
                      <CardHeader>
                        <CardTitle>Gallery</CardTitle>
                        <CardAction>
                          <Badge variant="secondary">{university.images.length} photos</Badge>
                        </CardAction>
                      </CardHeader>
                      <CardContent>
                        <GalleryGrid images={university.images} universityName={university.name_en} />
                      </CardContent>
                    </Card>
                  )}

                  {/* Facilities */}
                  {(university.facilities_en || university.facilities_cn || university.facilities) && (
                    <Card size="sm">
                      <CardHeader>
                        <CardTitle>Facilities</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {university.facilities_en || university.facilities_cn || university.facilities}
                      </CardContent>
                    </Card>
                  )}

                  {/* Accommodation */}
                  {(university.accommodation_info_en || university.accommodation_info_cn || university.accommodation_info) && (
                    <Card size="sm">
                      <CardHeader>
                        <CardTitle>Accommodation</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        {university.accommodation_info_en || university.accommodation_info_cn || university.accommodation_info}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="programs" className="space-y-4">
                  {programs.length === 0 ? (
                    <Card size="sm">
                      <CardContent className="py-12 text-center">
                        <IconBook className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                        <p className="text-muted-foreground">No programs found for this university.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-3">
                        {programs.map((program) => (
                          <Card key={program.id} className="overflow-hidden group">
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                {/* Header: Badge + Name */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <Badge 
                                      variant="outline" 
                                      className={cn(
                                        "font-semibold px-2.5 py-0.5 text-[11px] uppercase tracking-wide",
                                        program.degree_level?.toLowerCase() === 'bachelor' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' :
                                        program.degree_level?.toLowerCase() === 'master' ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400' :
                                        program.degree_level?.toLowerCase() === 'phd' || program.degree_level?.toLowerCase() === 'doctoral' ? 'border-purple-200 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400' :
                                        'border-muted-foreground/20'
                                      )}
                                    >
                                      {program.degree_level?.toLowerCase() === 'bachelor' ? 'Bachelor' :
                                       program.degree_level?.toLowerCase() === 'master' ? 'Master' :
                                       program.degree_level?.toLowerCase() === 'phd' || program.degree_level?.toLowerCase() === 'doctoral' ? 'PhD' :
                                       program.degree_level || 'N/A'}
                                    </Badge>
                                    {program.tuition_fee_per_year && (
                                      <span className="text-sm font-bold text-foreground">
                                        {program.currency || '¥'}{program.tuition_fee_per_year.toLocaleString()}
                                        <span className="text-[10px] text-muted-foreground font-normal">/yr</span>
                                      </span>
                                    )}
                                  </div>
                                  <Link
                                    href={
                                      university.slug && program.slug
                                        ? `/universities/${university.slug}/programs/${program.slug}`
                                        : `/programs/${program.id}`
                                    }
                                    className="font-semibold text-base hover:text-primary transition-colors block line-clamp-2 leading-snug"
                                  >
                                    {program.name}
                                  </Link>
                                </div>

                                {/* Info Chips */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {program.language && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                      <IconLanguage className="h-3 w-3" />
                                      {program.language}
                                    </span>
                                  )}
                                  {(program as any).duration_years && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                                      <IconClock className="h-3 w-3" />
                                      {(program as any).duration_years} year{(program as any).duration_years > 1 ? 's' : ''}
                                    </span>
                                  )}
                                  {(program as any).scholarship_available && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400">
                                      <IconAward className="h-3 w-3" />
                                      Scholarship
                                    </span>
                                  )}
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-2 pt-1">
                                  <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                                    <Link href={
                                      university.slug && program.slug
                                        ? `/universities/${university.slug}/programs/${program.slug}`
                                        : `/programs/${program.id}`
                                    }>
                                      View Details
                                    </Link>
                                  </Button>
                                  <Button size="sm" variant="default" className="flex-1 text-xs" asChild>
                                    <Link href={`/apply?program_id=${program.id}`}>Apply Now</Link>
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Desktop List View */}
                      <div className="hidden md:block rounded-lg border overflow-hidden">
                        <div className="divide-y">
                          {programs.map((program) => (
                            <div 
                              key={program.id} 
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 transition-colors"
                            >
                              {/* Degree Badge */}
                              <Badge variant="secondary" className="font-medium px-2.5 py-0.5 text-[11px] shrink-0">
                                {program.degree_level?.toLowerCase() === 'bachelor' ? 'Bachelor' : 
                                 program.degree_level?.toLowerCase() === 'master' ? 'Master' : 
                                 program.degree_level?.toLowerCase() === 'phd' || program.degree_level?.toLowerCase() === 'doctoral' ? 'PhD' : 
                                 program.degree_level || 'N/A'}
                              </Badge>

                              {/* Program Name */}
                              <Link 
                                href={
                                  university.slug && program.slug 
                                    ? `/universities/${university.slug}/programs/${program.slug}` 
                                    : `/programs/${program.id}`
                                } 
                                className="font-medium text-sm hover:underline truncate min-w-0"
                              >
                                {program.name}
                              </Link>

                              {/* Metadata - inline */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-auto">
                                <span className="flex items-center gap-1">
                                  <IconLanguage className="h-3 w-3" />
                                  {program.language}
                                </span>
                                {program.tuition_fee_per_year && (
                                  <span className="flex items-center gap-1 font-medium text-foreground">
                                    <IconCoinYuan className="h-3 w-3" />
                                    {program.currency || '¥'}{program.tuition_fee_per_year.toLocaleString()}
                                  </span>
                                )}
                              </div>

                              {/* Apply Button */}
                              <Button size="sm" variant="default" className="h-7 px-3 text-xs shrink-0" asChild>
                                <Link href={`/apply?program_id=${program.id}`}>Apply</Link>
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="scholarships" className="space-y-4">
                  <Card size="sm">
                    <CardHeader>
                      <CardTitle>Scholarship Opportunities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {university.scholarship_available ? (
                        <div className="space-y-4">
                          {university.scholarship_info ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              <p className="text-sm text-muted-foreground whitespace-pre-line">
                                {university.scholarship_info}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              This university offers scholarship opportunities for international students. Please contact the university directly for detailed scholarship information.
                            </p>
                          )}
                          {university.scholarship_percentage && (
                            <div className="flex items-center gap-2 text-sm">
                              <IconAward className="h-4 w-4 text-amber-500" />
                              <span className="font-medium">Scholarship Coverage:</span>
                              <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-200">
                                Up to {university.scholarship_percentage}%
                              </Badge>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Please contact the university directly for scholarship information.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right: Sidebar */}
            <aside className="hidden lg:block w-72 shrink-0">
              <div className="sticky top-20">
                <InfoSidebarCard university={university} />
              </div>
            </aside>
          </div>

          {/* Related Universities */}
          {relatedUniversities.length > 0 && (
            <div className="mt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Related Universities</h2>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/universities?province=${university.province}`}>
                    View All
                    <IconChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {relatedUniversities.map((relatedUni) => (
                  <RelatedUniversityCard key={relatedUni.id} university={relatedUni} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
