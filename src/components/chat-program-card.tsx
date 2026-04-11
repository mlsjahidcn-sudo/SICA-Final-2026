'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, Building, Globe, Clock, DollarSign, Award, ArrowRight, ExternalLink } from 'lucide-react';

export interface ChatProgramCardProps {
  id: string;
  name: string;
  nameCn?: string | null;
  degree?: string | null;
  major?: string | null;
  universityName?: string | null;
  universityId?: string | null;
  language?: string | null;
  duration?: string | null;
  durationMonths?: number | null;
  tuition?: number | null;
  currency?: string;
  scholarshipAvailable?: boolean;
}

const DEGREE_COLORS: Record<string, string> = {
  bachelor: 'bg-blue-500/10 text-blue-600 border-blue-200',
  master: 'bg-purple-500/10 text-purple-600 border-purple-200',
  phd: 'bg-amber-500/10 text-amber-600 border-amber-200',
  doctoral: 'bg-amber-500/10 text-amber-600 border-amber-200',
};

export function ChatProgramCard({
  id,
  name,
  nameCn,
  degree,
  major,
  universityName,
  universityId,
  language,
  duration,
  durationMonths,
  tuition,
  currency = 'CNY',
  scholarshipAvailable,
}: ChatProgramCardProps) {
  const degreeLower = degree?.toLowerCase() || '';
  const degreeColor = DEGREE_COLORS[degreeLower] || 'bg-muted text-muted-foreground';
  
  const displayDuration = duration || (durationMonths ? `${durationMonths} months` : null);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border/50 group">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-3 bg-muted/30">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-sm truncate">{name}</h4>
                {degree && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${degreeColor}`}>
                    {degree.toUpperCase()}
                  </Badge>
                )}
              </div>
              {nameCn && (
                <p className="text-xs text-muted-foreground truncate">{nameCn}</p>
              )}
            </div>
          </div>
          
          {/* Major */}
          {major && (
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{major}</span>
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="p-3 space-y-2 text-xs">
          {/* University */}
          {universityName && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{universityName}</span>
            </div>
          )}

          {/* Language & Duration */}
          <div className="flex items-center justify-between text-muted-foreground">
            {language && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                <span>{language}</span>
              </div>
            )}
            {displayDuration && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{displayDuration}</span>
              </div>
            )}
          </div>

          {/* Tuition & Scholarship */}
          <div className="flex items-center justify-between">
            {tuition && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <DollarSign className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">
                  {currency}{tuition.toLocaleString()}
                  {degreeLower === 'bachelor' ? '/yr' : '/total'}
                </span>
              </div>
            )}
            {scholarshipAvailable && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-200">
                <Award className="w-3 h-3 mr-1" />
                Scholarship
              </Badge>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex border-t border-border/50">
          <Link
            href={`/programs/${id}`}
            className="flex-1 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex items-center justify-center gap-1 border-r border-border/50"
          >
            <ExternalLink className="w-3 h-3" />
            Details
          </Link>
          <Link
            href={`/apply/${id}`}
            className="flex-1 px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
          >
            Apply Now
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Skeleton loader
export function ChatProgramCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border/50 animate-pulse">
      <CardContent className="p-0">
        <div className="p-3 bg-muted/30 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="p-3 space-y-2">
          <div className="h-3 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
        <div className="h-8 bg-muted/50 border-t border-border/50" />
      </CardContent>
    </Card>
  );
}
