"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  IconTrendingUp,
  IconTrendingDown,
  IconFileText,
  IconClock,
  IconCheck,
  IconUsers,
  IconLoader,
  IconX,
} from "@tabler/icons-react"

interface DashboardStats {
  totalApplications: number
  pending: number
  underReview: number
  accepted: number
  rejected: number
  thisMonth: number
  lastMonth: number
}

interface PartnerStatsCardsProps {
  stats: DashboardStats | null
  isLoading?: boolean
}

function getGrowthPercentage(stats: DashboardStats | null): number {
  if (!stats || stats.lastMonth === 0) return 0
  return Math.round(((stats.thisMonth - stats.lastMonth) / stats.lastMonth) * 100)
}

export function PartnerStatsCards({ stats, isLoading }: PartnerStatsCardsProps) {
  const growth = getGrowthPercentage(stats)
  const isPositiveGrowth = growth >= 0

  const cards = [
    {
      title: "Total Applications",
      value: stats?.totalApplications ?? 0,
      description: "All time applications",
      subtext: `${stats?.thisMonth ?? 0} this month`,
      trend: isPositiveGrowth ? "up" : "down",
      trendValue: `${Math.abs(growth)}%`,
      icon: IconFileText,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-600",
      trendColor: isPositiveGrowth ? "text-emerald-600" : "text-rose-600",
      borderColor: "border-blue-500/20",
      barColor: "bg-blue-500",
      barWidth: stats?.totalApplications ? Math.min(100, (stats.totalApplications / 20) * 100) : 0,
    },
    {
      title: "Pending Review",
      value: stats?.pending ?? 0,
      description: "Awaiting review",
      subtext: `${stats ? Math.round((stats.pending / (stats.totalApplications || 1)) * 100) : 0}% of total`,
      trend: "neutral",
      trendValue: stats?.pending ? `${stats.pending} active` : "0 active",
      icon: IconClock,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-600",
      trendColor: "text-amber-600",
      borderColor: "border-amber-500/20",
      barColor: "bg-amber-500",
      barWidth: stats?.totalApplications ? Math.min(100, (stats.pending / (stats.totalApplications || 1)) * 100) : 0,
    },
    {
      title: "Accepted",
      value: stats?.accepted ?? 0,
      description: "Successfully accepted",
      subtext: `${stats ? Math.round((stats.accepted / (stats.totalApplications || 1)) * 100) : 0}% success rate`,
      trend: "up",
      trendValue: stats?.accepted ? `${stats.accepted} total` : "0 total",
      icon: IconCheck,
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600",
      trendColor: "text-emerald-600",
      borderColor: "border-emerald-500/20",
      barColor: "bg-emerald-500",
      barWidth: stats?.totalApplications ? Math.min(100, (stats.accepted / (stats.totalApplications || 1)) * 100) : 0,
    },
    {
      title: "Under Review",
      value: stats?.underReview ?? 0,
      description: "In review process",
      subtext: `${stats ? Math.round((stats.underReview / (stats.totalApplications || 1)) * 100) : 0}% of total`,
      trend: "neutral",
      trendValue: stats?.underReview ? `${stats.underReview} active` : "0 active",
      icon: IconLoader,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600",
      trendColor: "text-violet-600",
      borderColor: "border-violet-500/20",
      barColor: "bg-violet-500",
      barWidth: stats?.totalApplications ? Math.min(100, (stats.underReview / (stats.totalApplications || 1)) * 100) : 0,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-32 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
              </div>
              <div className="mt-4 h-1.5 w-full bg-muted animate-pulse rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card
            key={card.title}
            className={`overflow-hidden border ${card.borderColor} transition-all duration-300 hover:shadow-md hover:-translate-y-0.5`}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-medium text-muted-foreground truncate">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold tracking-tight">
                    {card.value.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${card.trendColor} border-current/20`}
                    >
                      {card.trend === "up" && <IconTrendingUp className="size-3 mr-0.5" />}
                      {card.trend === "down" && <IconTrendingDown className="size-3 mr-0.5" />}
                      {card.trendValue}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {card.subtext}
                    </span>
                  </div>
                </div>
                <div className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <Icon className={`size-5 ${card.iconColor}`} />
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4">
                <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${card.barColor} transition-all duration-700 ease-out`}
                    style={{ width: `${card.barWidth}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
