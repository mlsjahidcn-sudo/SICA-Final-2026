"use client"

import * as React from "react"
import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

interface DistributionData {
  status: string
  count: number
  percentage: number
}

interface StatusDistributionChartProps {
  data?: DistributionData[]
  isLoading?: boolean
}

const chartConfig = {
  submitted: {
    label: "Submitted",
    color: "hsl(217.2 91.2% 59.8%)",
  },
  under_review: {
    label: "Under Review",
    color: "hsl(45.4 93.4% 47.5%)",
  },
  accepted: {
    label: "Accepted",
    color: "hsl(142.1 76.2% 36.3%)",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(0 72.2% 50.6%)",
  },
  document_request: {
    label: "Document Request",
    color: "hsl(24.6 95% 53.1%)",
  },
  interview_scheduled: {
    label: "Interview",
    color: "hsl(262.1 83.3% 57.8%)",
  },
} satisfies ChartConfig

const STATUS_COLORS: Record<string, string> = {
  submitted: "hsl(217.2 91.2% 59.8%)",
  under_review: "hsl(45.4 93.4% 47.5%)",
  accepted: "hsl(142.1 76.2% 36.3%)",
  rejected: "hsl(0 72.2% 50.6%)",
  document_request: "hsl(24.6 95% 53.1%)",
  interview_scheduled: "hsl(262.1 83.3% 57.8%)",
}

// Generate sample data
function generateSampleData(): DistributionData[] {
  const statuses = ['submitted', 'under_review', 'accepted', 'rejected', 'document_request', 'interview_scheduled']
  const counts = [45, 32, 28, 15, 12, 8]
  const total = counts.reduce((a, b) => a + b, 0)
  
  return statuses.map((status, i) => ({
    status,
    count: counts[i],
    percentage: Math.round((counts[i] / total) * 100),
  }))
}

export function StatusDistributionChart({ data: propData, isLoading }: StatusDistributionChartProps) {
  const chartData = propData || generateSampleData()

  if (isLoading) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  const total = chartData.reduce((sum, item) => sum + item.count, 0)

  return (
    <div className="space-y-4">
      <ChartContainer
        config={chartConfig}
        className="h-[200px] w-full"
      >
        <PieChart>
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={STATUS_COLORS[entry.status] || "hsl(var(--muted))"}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => (
                  <div className="flex items-center gap-2">
                    <span>{chartConfig[name as keyof typeof chartConfig]?.label || name}:</span>
                    <span className="font-bold">{value}</span>
                    <span className="text-muted-foreground">
                      ({chartData.find(d => d.status === name)?.percentage}%)
                    </span>
                  </div>
                )}
              />
            }
          />
        </PieChart>
      </ChartContainer>
      
      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        {chartData.map((item) => (
          <div key={item.status} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: STATUS_COLORS[item.status] }}
            />
            <span className="text-muted-foreground">
              {chartConfig[item.status as keyof typeof chartConfig]?.label || item.status}
            </span>
            <span className="font-medium ml-auto">{item.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
