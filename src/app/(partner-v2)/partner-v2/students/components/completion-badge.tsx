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
import { calculateProfileCompletion, getCompletionColor, getMissingFields } from '../lib/student-utils';
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
  const completion = calculateProfileCompletion(profile);
  
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
