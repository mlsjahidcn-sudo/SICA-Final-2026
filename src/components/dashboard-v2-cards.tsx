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
import { IconTrendingUp, IconTrendingDown, IconUsers, IconFileText, IconBuilding, IconPercentage } from "@tabler/icons-react"

interface DashboardStats {
  totalStudents: number
  pendingApplications: number
  partnerUniversities: number
  acceptanceRate: number
}

interface SectionCardsProps {
  stats: DashboardStats
}

export function SectionCards({ stats }: SectionCardsProps) {
  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toLocaleString()
  }

  const cards = [
    {
      title: "Total Students",
      value: formatNumber(stats.totalStudents),
      description: "Active registered students",
      trend: stats.totalStudents > 0 ? "up" : "neutral",
      trendValue: stats.totalStudents > 0 ? "+12%" : "New",
      icon: IconUsers,
    },
    {
      title: "Pending Applications",
      value: formatNumber(stats.pendingApplications),
      description: "Awaiting review",
      trend: stats.pendingApplications > 50 ? "up" : "down",
      trendValue: stats.pendingApplications > 50 ? "+5%" : "-8%",
      icon: IconFileText,
    },
    {
      title: "Partner Universities",
      value: formatNumber(stats.partnerUniversities),
      description: "Chinese universities partnered",
      trend: "up",
      trendValue: "+3",
      icon: IconBuilding,
    },
    {
      title: "Acceptance Rate",
      value: `${stats.acceptanceRate}%`,
      description: "Overall success rate",
      trend: stats.acceptanceRate >= 70 ? "up" : "down",
      trendValue: stats.acceptanceRate >= 70 ? "+2.5%" : "-1.2%",
      icon: IconPercentage,
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {cards.map((card, index) => (
        <Card key={index} className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <card.icon className="size-4 text-muted-foreground" />
              {card.title}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {card.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                {card.trend === "up" ? (
                  <IconTrendingUp className="text-emerald-500" />
                ) : (
                  <IconTrendingDown className="text-amber-500" />
                )}
                {card.trendValue}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {card.trend === "up" ? "Growing" : "Stable"} performance{" "}
              {card.trend === "up" ? (
                <IconTrendingUp className="size-4 text-emerald-500" />
              ) : (
                <IconTrendingDown className="size-4 text-amber-500" />
              )}
            </div>
            <div className="text-muted-foreground">
              {card.description}
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
