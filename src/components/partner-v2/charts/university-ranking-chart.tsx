"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface UniversityData {
  name: string
  applications: number
  accepted: number
  acceptanceRate: number
}

interface UniversityRankingChartProps {
  data?: UniversityData[]
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
} satisfies ChartConfig

// Generate sample data
function generateSampleData(): UniversityData[] {
  return [
    { name: "Tsinghua University", applications: 156, accepted: 78, acceptanceRate: 50 },
    { name: "Peking University", applications: 142, accepted: 71, acceptanceRate: 50 },
    { name: "Fudan University", applications: 128, accepted: 58, acceptanceRate: 45 },
    { name: "Shanghai Jiao Tong", applications: 115, accepted: 52, acceptanceRate: 45 },
    { name: "Zhejiang University", applications: 98, accepted: 45, acceptanceRate: 46 },
    { name: "University of Sci & Tech", applications: 87, accepted: 35, acceptanceRate: 40 },
    { name: "Nanjing University", applications: 76, accepted: 30, acceptanceRate: 39 },
    { name: "Wuhan University", applications: 65, accepted: 26, acceptanceRate: 40 },
  ]
}

export function UniversityRankingChart({ data: propData, isLoading }: UniversityRankingChartProps) {
  const chartData = propData || generateSampleData()

  if (isLoading) {
    return (
      <div className="h-[280px] w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  // Truncate long names
  const formatName = (name: string) => {
    return name.length > 18 ? name.substring(0, 18) + '...' : name
  }

  return (
    <ChartContainer
      config={chartConfig}
      className="h-[280px] w-full"
    >
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 10, right: 10 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => value.toString()}
        />
        <YAxis
          dataKey="name"
          type="category"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={120}
          tickFormatter={(value) => formatName(value)}
          style={{ fontSize: '12px' }}
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              formatter={(value, name, item) => (
                <div className="space-y-1">
                  <div className="font-medium">{item.payload.name}</div>
                  <div>Applications: {item.payload.applications}</div>
                  <div>Accepted: {item.payload.accepted}</div>
                  <div>Rate: {item.payload.acceptanceRate}%</div>
                </div>
              )}
            />
          }
        />
        <Bar
          dataKey="applications"
          fill="var(--color-applications)"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
