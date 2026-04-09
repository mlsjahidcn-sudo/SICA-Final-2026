"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { IconTrendingUp, IconTrendingDown, IconFileText, IconClock, IconCheck, IconUsers } from "@tabler/icons-react"

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
      trend: isPositiveGrowth ? "up" : "down",
      trendValue: `${Math.abs(growth)}%`,
      icon: <IconFileText className="size-4" />,
    },
    {
      title: "Pending Review",
      value: stats?.pending ?? 0,
      description: "Awaiting review",
      trend: "neutral",
      trendValue: stats ? `${Math.round((stats.pending / (stats.totalApplications || 1)) * 100)}%` : "0%",
      icon: <IconClock className="size-4" />,
    },
    {
      title: "Accepted",
      value: stats?.accepted ?? 0,
      description: "Successfully accepted",
      trend: "up",
      trendValue: stats ? `${Math.round((stats.accepted / (stats.totalApplications || 1)) * 100)}%` : "0%",
      icon: <IconCheck className="size-4" />,
    },
    {
      title: "Under Review",
      value: stats?.underReview ?? 0,
      description: "In review process",
      trend: "neutral",
      trendValue: stats ? `${Math.round((stats.underReview / (stats.totalApplications || 1)) * 100)}%` : "0%",
      icon: <IconUsers className="size-4" />,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <CardDescription className="h-4 w-24 bg-muted animate-pulse rounded" />
              <CardTitle className="text-2xl font-semibold tabular-nums h-8 w-16 bg-muted animate-pulse rounded mt-2" />
            </CardHeader>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card) => (
        <Card key={card.title} className="@container/card">
          <CardHeader>
            <CardDescription>{card.title}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value.toLocaleString()}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trend === "up" && <IconTrendingUp className="size-3" />}
                {card.trend === "down" && <IconTrendingDown className="size-3" />}
                {card.trendValue}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.description}
              {card.trend === "up" && <IconTrendingUp className="size-4" />}
            </div>
            <div className="text-muted-foreground">
              {card.title === "Total Applications" 
                ? `${stats?.thisMonth ?? 0} this month` 
                : `of total applications`}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
