"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

interface ChartDataPoint {
  date: string
  applications: number
  students: number
}

interface ChartAreaInteractiveProps {
  data: ChartDataPoint[]
}

const chartConfig = {
  applications: {
    label: "Applications",
    color: "var(--primary)",
  },
  students: {
    label: "New Students",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("30d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  // Use provided data or generate sample data
  const chartData = React.useMemo(() => {
    if (data && data.length > 0) {
      return data.map(item => ({
        date: item.date,
        applications: item.applications || 0,
        students: item.students || 0,
      }))
    }
    
    // Generate sample data if no data provided
    // Use a fixed base date to ensure stable output
    const baseDate = new Date("2024-01-15")
    const sampleData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0]
      // Use deterministic values based on index
      sampleData.push({
        date,
        applications: (i * 3 + 5) % 12 + 1,
        students: (i * 2 + 3) % 6 + 1,
      })
    }
    return sampleData
  }, [data])

  const filteredData = React.useMemo(() => {
    const now = new Date()
    let daysToShow = 30
    
    if (timeRange === "7d") {
      daysToShow = 7
    } else if (timeRange === "90d") {
      daysToShow = 90
    }

    return chartData.filter((item) => {
      const date = new Date(item.date)
      const startDate = new Date(now)
      startDate.setDate(startDate.getDate() - daysToShow)
      return date >= startDate
    })
  }, [chartData, timeRange])

  // Calculate totals
  const totalApplications = filteredData.reduce((sum, item) => sum + item.applications, 0)
  const totalStudents = filteredData.reduce((sum, item) => sum + item.students, 0)

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Platform Activity</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Applications & New Students ({totalApplications} applications, {totalStudents} students)
          </span>
          <span className="@[540px]/card:hidden">Last {timeRange === "7d" ? "7 days" : timeRange === "30d" ? "30 days" : "3 months"}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">3 Months</ToggleGroupItem>
            <ToggleGroupItem value="30d">30 Days</ToggleGroupItem>
            <ToggleGroupItem value="7d">7 Days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select time range"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillApplications" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-applications)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillStudents" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-students)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-students)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
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
              dataKey="students"
              type="natural"
              fill="url(#fillStudents)"
              stroke="var(--color-students)"
              stackId="a"
            />
            <Area
              dataKey="applications"
              type="natural"
              fill="url(#fillApplications)"
              stroke="var(--color-applications)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
