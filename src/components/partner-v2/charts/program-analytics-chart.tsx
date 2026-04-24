"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface ProgramData {
  name: string
  degree: string
  applications: number
}

interface ProgramAnalyticsChartProps {
  data?: ProgramData[]
  isLoading?: boolean
}

const chartConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

const DEGREE_COLORS: Record<string, string> = {
  Bachelor: "hsl(217.2 91.2% 59.8%)",
  Master: "hsl(262.1 83.3% 57.8%)",
  PhD: "hsl(142.1 76.2% 36.3%)",
}

// Generate sample data
function generateSampleData(): ProgramData[] {
  return [
    { name: "Computer Science", degree: "Master", applications: 89 },
    { name: "Business Admin", degree: "Master", applications: 76 },
    { name: "International Relations", degree: "Bachelor", applications: 65 },
    { name: "Chinese Language", degree: "Bachelor", applications: 58 },
    { name: "Electronic Engineering", degree: "PhD", applications: 52 },
    { name: "Economics", degree: "Master", applications: 48 },
    { name: "Mechanical Eng", degree: "Master", applications: 42 },
    { name: "Medicine", degree: "Bachelor", applications: 38 },
  ]
}

export function ProgramAnalyticsChart({ data: propData, isLoading }: ProgramAnalyticsChartProps) {
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
    return name.length > 15 ? name.substring(0, 15) + '...' : name
  }

  return (
    <div className="space-y-4">
      <ChartContainer
        config={chartConfig}
        className="h-[220px] w-full"
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
            width={100}
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
                    <div>Degree: {item.payload.degree}</div>
                    <div>Applications: {item.payload.applications}</div>
                  </div>
                )}
              />
            }
          />
          <Bar
            dataKey="applications"
            radius={[0, 4, 4, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={DEGREE_COLORS[entry.degree] || "hsl(var(--primary))"}
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
      
      {/* Degree Legend */}
      <div className="flex gap-4 text-sm">
        {Object.entries(DEGREE_COLORS).map(([degree, color]) => (
          <div key={degree} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{degree}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
