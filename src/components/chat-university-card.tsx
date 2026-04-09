'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building, MapPin, Trophy, DollarSign, Users } from 'lucide-react';

export interface ChatUniversityCardProps {
  id: string;
  name: string;
  nameCn?: string | null;
  city?: string | null;
  province?: string | null;
  ranking?: number | null;
  types?: string[];
  tuitionMin?: number | null;
  tuitionMax?: number | null;
  currency?: string;
  studentCount?: number | null;
  logoUrl?: string | null;
}

export function ChatUniversityCard({
  id,
  name,
  nameCn,
  city,
  province,
  ranking,
  types,
  tuitionMin,
  tuitionMax,
  currency = 'CNY',
  studentCount,
  logoUrl,
}: ChatUniversityCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border/50">
      <CardContent className="p-0">
        {/* Header with Logo */}
        <div className="flex items-start gap-3 p-3 bg-muted/30">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={name}
              className="w-12 h-12 rounded-lg object-cover border bg-background"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building className="w-6 h-6 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h4 className="font-semibold text-sm truncate">{name}</h4>
                {nameCn && (
                  <p className="text-xs text-muted-foreground truncate">{nameCn}</p>
                )}
              </div>
              {ranking && (
                <Badge variant="secondary" className="text-xs shrink-0">
                  #{ranking}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="p-3 space-y-2 text-xs">
          {/* Location */}
          {(city || province) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span>{city}{city && province ? ', ' : ''}{province}</span>
            </div>
          )}

          {/* Types */}
          {types && types.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {types.slice(0, 3).map((type) => (
                <Badge key={type} variant="outline" className="text-[10px] px-1.5 py-0">
                  {type.toUpperCase()}
                </Badge>
              ))}
            </div>
          )}

          {/* Tuition & Students */}
          <div className="flex items-center justify-between text-muted-foreground">
            {tuitionMin && (
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                <span>
                  {currency}{tuitionMin.toLocaleString()}
                  {tuitionMax && tuitionMax !== tuitionMin && ` - ${tuitionMax.toLocaleString()}`}
                  /yr
                </span>
              </div>
            )}
            {studentCount && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>{(studentCount / 1000).toFixed(0)}k students</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Link */}
        <Link
          href={`/universities/${id}`}
          className="block px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border/50"
        >
          View University →
        </Link>
      </CardContent>
    </Card>
  );
}

// Skeleton loader for loading state
export function ChatUniversityCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 animate-pulse">
      <CardContent className="p-0">
        <div className="flex items-start gap-3 p-3 bg-muted/30">
          <div className="w-12 h-12 rounded-lg bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-3 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
        <div className="h-8 bg-muted/50 border-t border-border/50" />
      </CardContent>
    </Card>
  );
}
