'use client';

import { memo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, FileText, User, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================

export interface ApplicationCardData {
  id: string;
  status: string;
  priority?: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
  students?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };
  programs?: {
    id: string;
    name: string;
    degree_level: string;
    universities?: {
      id: string;
      name_en: string;
      name_cn?: string | null;
      city?: string;
    };
  };
  partners?: {
    id: string;
    company_name: string;
    users?: {
      full_name: string;
    };
  };
}

interface ApplicationCardProps {
  application: ApplicationCardData;
  locale?: string;
  variant?: 'partner' | 'student' | 'admin';
}

// ============================================
// Helper Functions
// ============================================

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  under_review: { label: 'Under Review', variant: 'default' },
  document_request: { label: 'Documents Required', variant: 'outline' },
  interview_scheduled: { label: 'Interview Scheduled', variant: 'default' },
  accepted: { label: 'Accepted', variant: 'default' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'secondary' },
};

const priorityConfig: Record<number, { label: string; className: string }> = {
  0: { label: 'Normal', className: 'text-muted-foreground' },
  1: { label: 'Low', className: 'text-blue-500' },
  2: { label: 'High', className: 'text-orange-500' },
  3: { label: 'Urgent', className: 'text-red-500' },
};

function getStatusBadge(status: string) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function getPriorityIndicator(priority: number = 0) {
  const config = priorityConfig[priority] || priorityConfig[0];
  return (
    <span className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
}

// ============================================
// Application Card Component
// ============================================

function ApplicationCardInner({
  application,
  locale = 'en',
  variant = 'partner',
}: ApplicationCardProps) {
  const student = application.students;
  const program = application.programs;
  const university = program?.universities;
  const partner = application.partners;

  const formattedDate = application.submitted_at
    ? format(new Date(application.submitted_at), 'MMM d, yyyy')
    : format(new Date(application.created_at), 'MMM d, yyyy');

  return (
    <Link href={`/${variant === 'student' ? 'student-v2' : variant === 'partner' ? 'partner-v2' : 'admin'}/applications/${application.id}`}>
      <Card className="group h-full transition-all duration-200 hover:shadow-md hover:border-primary/20">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {program?.name || 'Unknown Program'}
              </h3>
              <p className="text-sm text-muted-foreground truncate mt-0.5">
                {university?.name_en || 'Unknown University'}
              </p>
            </div>
            {getStatusBadge(application.status)}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
            {/* Student Info (for partner/admin) */}
            {(variant === 'partner' || variant === 'admin') && student && (
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{student.full_name}</span>
              </div>
            )}

            {/* Partner Info (for admin) */}
            {variant === 'admin' && partner && (
              <div className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{partner.company_name}</span>
              </div>
            )}

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              <span>{formattedDate}</span>
            </div>

            {/* Degree Level */}
            {program?.degree_level && (
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="capitalize">{program.degree_level}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            {getPriorityIndicator(application.priority)}
            <span className="text-xs text-muted-foreground">
              ID: {application.id.slice(0, 8)}...
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Export with memo for performance
export const ApplicationCard = memo(ApplicationCardInner);

// ============================================
// Skeleton Component
// ============================================

export function ApplicationCardSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 space-y-2">
            <div className="h-5 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
          <div className="h-4 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}
