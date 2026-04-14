'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  ListTodo,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

interface TaskStatsHeaderProps {
  stats: TaskStats;
}

const statCards = [
  {
    key: 'total',
    label: 'Total Tasks',
    icon: ListTodo,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    key: 'todo',
    label: 'To Do',
    icon: Clock,
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 dark:bg-slate-950/30',
    borderColor: 'border-slate-200 dark:border-slate-800',
  },
  {
    key: 'inProgress',
    label: 'In Progress',
    icon: TrendingUp,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    key: 'done',
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200 dark:border-green-800',
  },
  {
    key: 'overdue',
    label: 'Overdue',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800',
  },
];

export function TaskStatsHeader({ stats }: TaskStatsHeaderProps) {
  const getStatValue = (key: string): number => {
    switch (key) {
      case 'total':
        return stats.total;
      case 'todo':
        return stats.todo;
      case 'inProgress':
        return stats.inProgress;
      case 'done':
        return stats.done;
      case 'overdue':
        return stats.overdue;
      default:
        return 0;
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {statCards.map((card) => {
        const Icon = card.icon;
        const value = getStatValue(card.key);
        
        return (
          <Card
            key={card.key}
            className={`${card.bgColor} ${card.borderColor} border transition-all hover:shadow-sm`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">
                    {card.label}
                  </p>
                  <p className={`text-2xl font-bold ${card.color} mt-1`}>
                    {value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
