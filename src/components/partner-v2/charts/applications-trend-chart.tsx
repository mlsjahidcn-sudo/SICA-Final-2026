"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface TrendDataPoint {
  date: string
  applications: number
  accepted: number
  rejected: number
}

interface ApplicationsTrendChartProps {
  data?: TrendDataPoint[]
  isLoading?: boolean
}

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
  accepted: {
    label: "Accepted",
    color: "hsl(142.1 76.2% 36.3%)",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(0 72.2% 50.6%)",
  },
} satisfies ChartConfig

// Generate sample data
function generateSampleData(): TrendDataPoint[] {
  const data: TrendDataPoint[] = []
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const apps = Math.floor(Math.random() * 15) + 5
    data.push({
      date: date.toISOString().split("T")[0],
      applications: apps,
      accepted: Math.floor(apps * (0.3 + Math.random() * 0.2)),
      rejected: Math.floor(apps * (0.1 + Math.random() * 0.15)),
    })
  }
  
  return data
}

export function ApplicationsTrendChart({ data: propData, isLoading }: ApplicationsTrendChartProps) {
  const isMobile = useIsMobile()
  
  const chartData = propData || generateSampleData()

  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-[300px] w-full"
    >
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-applications)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-applications)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-accepted)"
              stopOpacity={0.4}
            />
            <stop
              offset="95%"
              stopColor="var(--color-accepted)"
              stopOpacity={0.05}
            />
          </linearGradient>
          <linearGradient id="fillRejected" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-rejected)"
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor="var(--color-rejected)"
              stopOpacity={0.05}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={isMobile ? 50 : 32}
          tickFormatter={(value) => {
            const date = new Date(value)
            return date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })
          }}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          tickFormatter={(value) => value.toString()}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              }}
              indicator="dot"
            />
          }
        />
        <Area
          dataKey="rejected"
          type="natural"
          fill="url(#fillRejected)"
          stroke="var(--color-rejected)"
          strokeWidth={2}
        />
        <Area
          dataKey="accepted"
          type="natural"
          fill="url(#fillAccepted)"
          stroke="var(--color-accepted)"
          strokeWidth={2}
        />
        <Area
          dataKey="applications"
          type="natural"
          fill="url(#fillApplications)"
          stroke="var(--color-applications)"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  )
}
