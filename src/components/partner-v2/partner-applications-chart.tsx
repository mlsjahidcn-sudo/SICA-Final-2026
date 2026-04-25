"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { IconTrendingUp } from "@tabler/icons-react"

interface ChartDataPoint {
  date: string
  applications: number
  accepted: number
}

interface PartnerApplicationsChartProps {
  data?: ChartDataPoint[]
}

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
  accepted: {
    label: "Accepted",
    color: "hsl(145 60% 45%)",
  },
} satisfies ChartConfig

// Generate sample data based on time range
function generateChartData(days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const baseApps = isWeekend ? 1 : 4
    data.push({
      date: date.toISOString().split("T")[0],
      applications: Math.floor(Math.random() * 6) + baseApps,
      accepted: Math.floor(Math.random() * 3),
    })
  }

  return data
}

export function PartnerApplicationsChart({ data: propData }: PartnerApplicationsChartProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const chartData = propData || (() => {
    let days = 90
    if (timeRange === "30d") days = 30
    else if (timeRange === "7d") days = 7
    return generateChartData(days)
  })()

  const filteredData = chartData.filter((item) => {
    if (!propData) return true

    const date = new Date(item.date)
    const referenceDate = new Date()
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  const totalApps = filteredData.reduce((sum, d) => sum + d.applications, 0)
  const totalAccepted = filteredData.reduce((sum, d) => sum + d.accepted, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5">
          <div className="flex items-center gap-2">
            <CardTitle>Applications Overview</CardTitle>
            <div className="flex h-5 items-center gap-1 rounded-full bg-emerald-50 px-2 text-xs font-medium text-emerald-700 border border-emerald-200">
              <IconTrendingUp className="h-3 w-3" />
              Active
            </div>
          </div>
          <CardDescription>
            Application trends over time
          </CardDescription>
        </div>
        <div className="flex flex-col justify-center gap-1 border-t bg-muted/20 px-6 py-4 sm:border-l sm:border-t-0">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total</span>
          <span className="text-2xl font-bold leading-none">{totalApps}</span>
          <span className="text-xs text-emerald-600 font-medium">{totalAccepted} accepted</span>
        </div>
        <div className="flex">
          <CardAction className="flex items-center px-6 py-4 self-center">
            <ToggleGroup
              type="single"
              value={timeRange}
              onValueChange={setTimeRange}
              variant="outline"
              className=""
            >
              <ToggleGroupItem value="7d" className="text-xs h-8 px-3">7d</ToggleGroupItem>
              <ToggleGroupItem value="30d" className="text-xs h-8 px-3">30d</ToggleGroupItem>
              <ToggleGroupItem value="90d" className="text-xs h-8 px-3">90d</ToggleGroupItem>
            </ToggleGroup>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[280px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="fillAccepted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145 60% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145 60% 45%)" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
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
              tickFormatter={(value) => `${value}`}
              width={30}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              type="monotone"
              dataKey="applications"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#fillApplications)"
              animationDuration={1000}
              animationEasing="ease-out"
            />
            <Area
              type="monotone"
              dataKey="accepted"
              stroke="hsl(145 60% 45%)"
              strokeWidth={2}
              fill="url(#fillAccepted)"
              animationDuration={1200}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Applications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-muted-foreground">Accepted</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
