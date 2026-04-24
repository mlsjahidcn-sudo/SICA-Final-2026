'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Award, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
}

interface UniversityCardProps {
  university: UniversityCardData;
  locale?: string;
  showStats?: boolean;
}

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

  return (
    <Link href={`/universities/${university.id}`}>
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* Cover Image */}
        {university.cover_image_url && (
          <div className="relative h-32 w-full overflow-hidden bg-muted">
            <Image
              src={university.cover_image_url}
              alt={name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}

        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {/* Logo */}
            {university.logo_url && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={university.logo_url}
                  alt={name}
                  fill
                  className="object-contain"
                  sizes="48px"
                />
              </div>
            )}

            {/* Title */}
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{location}</span>
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {university.type && university.type.length > 0 && university.type.map((type) => (
              <Badge key={type} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
            {university.scholarship_available && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                Scholarship
              </Badge>
            )}
          </div>

          {/* Stats */}
          {showStats && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t text-sm text-muted-foreground">
              {university.ranking_national && (
                <div className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  <span>#{university.ranking_national}</span>
                </div>
              )}
              {university.student_count && (
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{(university.student_count / 1000).toFixed(0)}K</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
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
    <Card className="h-full overflow-hidden">
      <div className="h-32 w-full bg-muted animate-pulse" />
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg bg-muted animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="flex gap-1.5 mt-3">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-12 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
