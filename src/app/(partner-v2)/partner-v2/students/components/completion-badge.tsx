'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { IconInfoCircle } from '@tabler/icons-react';
import { getCompletionColor, getMissingFields } from '../lib/student-utils';
import type { StudentProfile } from '../lib/types';

interface CompletionBadgeProps {
  profile: StudentProfile | undefined;
  showDetails?: boolean;
  variant?: 'badge' | 'progress';
}

/**
 * Display student profile completion status
 */
export function CompletionBadge({ 
  profile, 
  showDetails = false,
  variant = 'badge' 
}: CompletionBadgeProps) {
  const completion = profile 
    ? Math.round(
        calculateCompletion(profile)
      )
    : 0;
  
  const missingFields = getMissingFields(profile);
  const colorClass = getCompletionColor(completion);

  if (variant === 'progress') {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Profile Completion</span>
          <span className={`font-medium ${colorClass.split(' ')[0]}`}>
            {completion}%
          </span>
        </div>
        <Progress value={completion} className="h-2" />
        {showDetails && missingFields.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Missing: {missingFields.slice(0, 3).join(', ')}
            {missingFields.length > 3 && ` +${missingFields.length - 3} more`}
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1">
            <Badge className={colorClass}>
              {completion}% Complete
            </Badge>
            {showDetails && missingFields.length > 0 && (
              <IconInfoCircle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        </TooltipTrigger>
        {showDetails && missingFields.length > 0 && (
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium mb-1">Missing Fields:</p>
            <ul className="text-xs space-y-1">
              {missingFields.slice(0, 5).map((field) => (
                <li key={field}>• {field}</li>
              ))}
              {missingFields.length > 5 && (
                <li>• +{missingFields.length - 5} more</li>
              )}
            </ul>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Calculate completion percentage (duplicated to avoid circular dependency)
 */
function calculateCompletion(profile: StudentProfile): number {
  if (!profile) return 0;

  const requiredFields: Array<{ key: keyof StudentProfile; weight: number }> = [
    { key: 'nationality', weight: 10 },
    { key: 'date_of_birth', weight: 5 },
    { key: 'gender', weight: 5 },
    { key: 'current_address', weight: 5 },
    { key: 'chinese_name', weight: 5 },
    { key: 'passport_number', weight: 10 },
    { key: 'passport_expiry_date', weight: 5 },
    { key: 'passport_issuing_country', weight: 5 },
    { key: 'education_history', weight: 15 },
    { key: 'highest_education', weight: 5 },
    { key: 'gpa', weight: 5 },
    { key: 'hsk_level', weight: 5 },
    { key: 'ielts_score', weight: 5 },
    { key: 'emergency_contact_name', weight: 2 },
    { key: 'emergency_contact_phone', weight: 2 },
    { key: 'emergency_contact_relationship', weight: 1 },
  ];

  let totalWeight = 0;
  let filledWeight = 0;

  for (const field of requiredFields) {
    totalWeight += field.weight;
    const value = profile[field.key];
    
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          filledWeight += field.weight;
        }
      } else {
        filledWeight += field.weight;
      }
    }
  }

  return totalWeight > 0 ? Math.round((filledWeight / totalWeight) * 100) : 0;
}
