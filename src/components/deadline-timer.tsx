'use client';

import * as React from 'react';
import { IconHourglass } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface DeadlineTimerProps {
  deadline: string | Date;
  onExpired?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
}

export function DeadlineTimer({ deadline, onExpired }: DeadlineTimerProps) {
  const [timeRemaining, setTimeRemaining] = React.useState<TimeRemaining | null>(null);
  const [isExpired, setIsExpired] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // Calculate time remaining
  const calculateTimeRemaining = React.useCallback((): TimeRemaining | null => {
    const targetDate = new Date(deadline);
    const now = new Date();
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
      return null;
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      totalSeconds: Math.floor(diff / 1000),
    };
  }, [deadline]);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isMounted) return;

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      
      if (remaining === null) {
        setIsExpired(true);
        setTimeRemaining(null);
        onExpired?.();
      } else {
        setIsExpired(false);
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isMounted, calculateTimeRemaining, onExpired]);

  // Don't render anything until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null;
  }

  // Expired state
  if (isExpired) {
    return (
      <div className="p-4 rounded-lg border bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800">
        <div className="text-center">
          <IconHourglass className="mx-auto h-8 w-8 text-red-500 mb-2" />
          <p className="font-semibold text-red-700 dark:text-red-400">Applications Closed</p>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            The application deadline has passed.
          </p>
        </div>
      </div>
    );
  }

  // No time remaining data
  if (!timeRemaining) {
    return null;
  }

  // Determine urgency level
  const isUrgent = timeRemaining.totalSeconds < 86400; // Less than 24 hours
  const isWarning = timeRemaining.totalSeconds < 604800; // Less than 7 days

  return (
    <div
      className={cn(
        "p-4 rounded-lg border",
        isUrgent
          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800"
          : isWarning
          ? "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800"
          : "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800"
      )}
    >
      <p
        className={cn(
          "text-xs font-medium mb-2 flex items-center gap-1",
          isUrgent
            ? "text-red-600 dark:text-red-400"
            : isWarning
            ? "text-amber-600 dark:text-amber-400"
            : "text-muted-foreground"
        )}
      >
        <IconHourglass className="h-3 w-3" />
        {isUrgent ? "Urgent! Deadline in" : "Deadline in"}
      </p>
      
      <div className="grid grid-cols-4 gap-2 text-center">
        <TimeUnit value={timeRemaining.days} label="Days" urgent={isUrgent} />
        <TimeUnit value={timeRemaining.hours} label="Hours" urgent={isUrgent} />
        <TimeUnit value={timeRemaining.minutes} label="Mins" urgent={isUrgent} />
        <TimeUnit value={timeRemaining.seconds} label="Secs" urgent={isUrgent} />
      </div>
    </div>
  );
}

// Single time unit component
function TimeUnit({ value, label, urgent }: { value: number; label: string; urgent?: boolean }) {
  return (
    <div
      className={cn(
        "bg-background rounded-md p-2 border shadow-sm",
        urgent && "animate-pulse"
      )}
    >
      <div
        className={cn(
          "text-xl font-bold tabular-nums",
          urgent && "text-red-600 dark:text-red-400"
        )}
      >
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
