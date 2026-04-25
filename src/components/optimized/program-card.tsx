'use client';

import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, DollarSign, GraduationCap, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// ============================================
// Types
// ============================================

export interface ProgramCardData {
  id: string;
  name: string;
  degree_level: string;
  language?: string[];
  category?: string | null;
  tuition_fee_per_year?: number | null;
  currency?: string;
  scholarship_coverage?: number | null;
  duration_years?: number | null;
  universities?: {
    id: string;
    name_en: string;
    name_cn?: string | null;
    city?: string;
    province?: string;
    logo_url?: string | null;
    type?: string;
  };
}

interface ProgramCardProps {
  program: ProgramCardData;
  locale?: string;
}

// ============================================
// Helper Functions
// ============================================

function formatDegreeLevel(level: string): string {
  const levels: Record<string, string> = {
    bachelor: "Bachelor's",
    master: "Master's",
    doctoral: 'Doctoral',
    phd: 'PhD',
    chinese: 'Chinese Language',
  };
  return levels[level.toLowerCase()] || level;
}

function formatTuition(fee: number | null | undefined, currency = 'CNY'): string {
  if (!fee) return 'Contact for fees';
  const symbol = currency === 'CNY' ? '¥' : currency === 'USD' ? '$' : currency;
  return `${symbol}${(fee / 1000).toFixed(0)}K/year`;
}

// ============================================
// Program Card Component
// ============================================

function ProgramCardInner({ program, locale = 'en' }: ProgramCardProps) {
  const university = program.universities;
  const universityName = university?.name_en || 'Unknown University';
  const universityLocation = university?.city && university?.province 
    ? `${university.city}, ${university.province}` 
    : '';

  return (
    <Link href={`/programs/${program.id}`}>
      <Card className="group h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <CardHeader className="pb-2">
          {/* University Info */}
          <div className="flex items-center gap-2 mb-2">
            {university?.logo_url && (
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded bg-muted">
                <Image
                  src={university.logo_url}
                  alt={universityName}
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">
                {universityName}
              </p>
              {universityLocation && (
                <p className="text-xs text-muted-foreground/70 truncate">
                  {universityLocation}
                </p>
              )}
            </div>
          </div>

          {/* Program Title */}
          <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
            {program.name}
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            <Badge variant="secondary" className="text-xs">
              {formatDegreeLevel(program.degree_level)}
            </Badge>
            {program.language?.includes('English') && (
              <Badge variant="outline" className="text-xs">
                English
              </Badge>
            )}
            {program.scholarship_coverage && program.scholarship_coverage > 0 && (
              <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                {program.scholarship_coverage}% Scholarship
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{formatDegreeLevel(program.degree_level)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{program.duration_years || 4} Years</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {formatTuition(program.tuition_fee_per_year, program.currency)}
              </span>
            </div>
            {program.scholarship_coverage && program.scholarship_coverage > 0 && (
              <div className="flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-green-600">{program.scholarship_coverage}%</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Export with memo for performance
export const ProgramCard = memo(ProgramCardInner);

// ============================================
// Skeleton Component
// ============================================

export function ProgramCardSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 shrink-0 rounded bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-5 w-full bg-muted rounded animate-pulse" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-1.5 mb-3">
          <div className="h-5 w-16 bg-muted rounded animate-pulse" />
          <div className="h-5 w-14 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
