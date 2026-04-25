'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Award, Users, Building, Calendar, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AspectRatio } from '@/components/ui/aspect-ratio';

// ============================================
// Types
// ============================================

export interface UniversityCardData {
  id: string;
  name_en: string;
  name_cn: string | null;
  short_name?: string | null;
  logo_url: string | null;
  cover_image_url?: string | null;
  province: string;
  city: string;
  type: string[];
  category?: string | null;
  ranking_national?: number | null;
  ranking_international?: number | null;
  scholarship_available?: boolean;
  student_count?: number | null;
  tuition_min?: number | null;
  tuition_max?: number | null;
  tuition_currency?: string | null;
  application_deadline?: string | null;
}

interface UniversityCardProps {
  university: UniversityCardData;
  locale?: string;
  showStats?: boolean;
}

// ============================================
// Helper Functions
// ============================================

const formatTuition = (min: number | null, currency?: string | null): string => {
  if (!min) return 'N/A';
  const symbol = currency === 'CNY' || currency === '¥' ? '¥' : currency || '$';
  return `${symbol}${min.toLocaleString()}`;
};

const getDeadlineDays = (deadline: string | null): number | null => {
  if (!deadline) return null;
  try {
    const deadlineDate = new Date(deadline);
    const now = new Date();
    return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  } catch {
    return null;
  }
};

// ============================================
// University Card Component
// ============================================

function UniversityCardInner({
  university,
  locale = 'en',
  showStats = true,
}: UniversityCardProps) {
  const name = locale === 'zh' && university.name_cn ? university.name_cn : university.name_en;
  const location = `${university.city}, ${university.province}`;
  const deadlineDays = getDeadlineDays(university.application_deadline || null);

  return (
    <Link href={`/universities/${university.id}`} className="group block">
      <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:ring-2 hover:ring-primary/20 hover:-translate-y-1 bg-gradient-to-br from-card to-card/95 border-border/80 hover:border-primary/40 active:scale-[0.98] sm:active:scale-100">
        {/* Cover Image */}
        <div className="relative">
          <AspectRatio ratio={16 / 9}>
            {university.cover_image_url ? (
              <Image
                src={university.cover_image_url}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-muted to-muted/50 flex items-center justify-center">
                <Building className="h-8 w-8 text-muted-foreground/40" />
              </div>
            )}
          </AspectRatio>

          {/* Top Badges Overlay */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start gap-2 pointer-events-none">
            <div className="flex gap-1.5 flex-wrap max-w-[70%]">
              {university.ranking_national && (
                <Badge 
                  variant="secondary" 
                  className="gap-1 text-xs shadow-md backdrop-blur-md bg-background/90 font-medium"
                >
                  <Award className="h-3 w-3 text-amber-500" />
                  #{university.ranking_national}
                </Badge>
              )}
              {university.scholarship_available && (
                <Badge 
                  className="bg-amber-500/95 text-white gap-1 text-xs border-0 shadow-md backdrop-blur-md font-medium"
                >
                  Scholarship
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          {/* Header: Logo + Name */}
          <div className="flex items-start gap-3">
            {/* Logo */}
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-background shadow-sm">
              {university.logo_url ? (
                <Image
                  src={university.logo_url}
                  alt={name}
                  fill
                  className="object-contain p-1"
                  sizes="48px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/5">
                  <Building className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Title & Location */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base text-foreground truncate group-hover:text-primary transition-colors leading-tight">
                {name}
              </h3>
              {university.name_cn && locale !== 'zh' && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {university.name_cn}
                </p>
              )}
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </p>
            </div>
          </div>

          {/* Type Badges */}
          {university.type && university.type.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {university.type.slice(0, 3).map((type) => (
                <Badge 
                  key={type} 
                  variant="outline" 
                  className="text-xs font-medium border-primary/30 text-primary/80 bg-primary/5"
                >
                  {type}
                </Badge>
              ))}
            </div>
          )}

          {/* Stats Grid */}
          {showStats && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
              {/* Student Count */}
              {university.student_count && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/30">
                    <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Students</span>
                    <span className="font-medium text-xs">
                      {(university.student_count / 1000).toFixed(1)}K
                    </span>
                  </div>
                </div>
              )}

              {/* Tuition */}
              {university.tuition_min && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="p-1.5 rounded-md bg-green-50 dark:bg-green-950/30">
                    <Clock className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Tuition</span>
                    <span className="font-medium text-xs">
                      {formatTuition(university.tuition_min, university.tuition_currency)}/yr
                    </span>
                  </div>
                </div>
              )}

              {/* Application Deadline */}
              {deadlineDays !== null && (
                <div className="flex items-center gap-2 text-sm col-span-2">
                  <div className={`p-1.5 rounded-md ${
                    deadlineDays <= 0 ? 'bg-red-50 dark:bg-red-950/30' :
                    deadlineDays <= 30 ? 'bg-amber-50 dark:bg-amber-950/30' :
                    'bg-purple-50 dark:bg-purple-950/30'
                  }`}>
                    <Calendar className={`h-3.5 w-3.5 ${
                      deadlineDays <= 0 ? 'text-red-600 dark:text-red-400' :
                      deadlineDays <= 30 ? 'text-amber-600 dark:text-amber-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Deadline</span>
                    <span className={`font-medium text-xs ${
                      deadlineDays <= 0 ? 'text-red-600 dark:text-red-400' :
                      deadlineDays <= 30 ? 'text-amber-600 dark:text-amber-400' :
                      'text-foreground'
                    }`}>
                      {deadlineDays <= 0 ? 'Closed' : 
                       deadlineDays === 1 ? 'Tomorrow' : 
                       `${deadlineDays} days left`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}

// Export with memo for performance
export const UniversityCard = memo(UniversityCardInner);

// ============================================
// Skeleton Component
// ============================================

export function UniversityCardSkeleton() {
  return (
    <Card className="h-full overflow-hidden border-border/80">
      {/* Cover skeleton */}
      <div className="relative">
        <AspectRatio ratio={16 / 9}>
          <div className="w-full h-full bg-muted animate-pulse" />
        </AspectRatio>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
            <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
          </div>
        </div>

        {/* Badges */}
        <div className="flex gap-1.5">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>

        {/* Stats */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <div className="h-10 bg-muted rounded animate-pulse" />
            <div className="h-10 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    </Card>
  );
}
