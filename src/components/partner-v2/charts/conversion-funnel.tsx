"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface FunnelData {
  submitted: number
  underReview: number
  interview: number
  accepted: number
}

interface ConversionFunnelProps {
  data?: FunnelData
  isLoading?: boolean
}

// Generate sample data
function generateSampleData(): FunnelData {
  return {
    submitted: 140,
    underReview: 95,
    interview: 45,
    accepted: 28,
  }
}

const STAGES = [
  { key: 'submitted' as const, label: 'Submitted', color: 'bg-blue-500' },
  { key: 'underReview' as const, label: 'Under Review', color: 'bg-amber-500' },
  { key: 'interview' as const, label: 'Interview', color: 'bg-purple-500' },
  { key: 'accepted' as const, label: 'Accepted', color: 'bg-green-500' },
]

export function ConversionFunnel({ data: propData, isLoading }: ConversionFunnelProps) {
  const funnelData = propData || generateSampleData()

  if (isLoading) {
    return (
      <div className="h-[200px] w-full flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading funnel...</div>
      </div>
    )
  }

  const maxValue = funnelData.submitted

  return (
    <div className="space-y-4">
      {STAGES.map((stage, index) => {
        const value = funnelData[stage.key]
        const percentage = Math.round((value / maxValue) * 100)
        const dropOff = index > 0 
          ? Math.round(((funnelData[STAGES[index - 1].key] - value) / funnelData[STAGES[index - 1].key]) * 100)
          : 0

        return (
          <div key={stage.key} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-bold">{value}</span>
                <span className="text-muted-foreground">({percentage}%)</span>
                {index > 0 && (
                  <span className="text-red-500 text-xs">
                    -{dropOff}% drop
                  </span>
                )}
              </div>
            </div>
            <div className="relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-500",
                  stage.color,
                  "opacity-80"
                )}
                style={{ width: `${percentage}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white mix-blend-difference">
                  {value} applications
                </span>
              </div>
            </div>
          </div>
        )
      })}
      
      {/* Summary */}
      <div className="pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Overall Conversion Rate</span>
          <span className="font-bold text-green-600">
            {Math.round((funnelData.accepted / funnelData.submitted) * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
