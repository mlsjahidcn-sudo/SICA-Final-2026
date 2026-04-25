"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  IconCheck,
  IconCircle,
  IconCircleDot,
  IconFileText,
  IconUpload,
  IconSend,
  IconEye,
  IconMessage,
  IconChecklist,
  IconTrophy
} from "@tabler/icons-react"

interface ProgressStep {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  status: 'completed' | 'current' | 'pending'
}

interface ApplicationProgressProps {
  status: string
  documentsComplete: boolean
  className?: string
}

export function ApplicationProgress({ 
  status, 
  documentsComplete,
  className 
}: ApplicationProgressProps) {
  // Define progress steps based on application status
  const steps: ProgressStep[] = React.useMemo(() => {
    const statusOrder = [
      'draft',
      'submitted', 
      'under_review',
      'document_request',
      'interview_scheduled',
      'accepted'
    ]
    
    const currentIndex = statusOrder.indexOf(status)
    
    return [
      {
        id: 'create',
        label: 'Create Application',
        description: 'Fill in personal details',
        icon: <IconFileText className="h-4 w-4" />,
        status: currentIndex >= 0 ? 'completed' : 'pending'
      },
      {
        id: 'documents',
        label: 'Upload Documents',
        description: 'Submit required documents',
        icon: <IconUpload className="h-4 w-4" />,
        status: documentsComplete ? 'completed' : 
                (currentIndex >= 0 && status === 'draft') ? 'current' : 
                currentIndex > 0 ? 'completed' : 'pending'
      },
      {
        id: 'submit',
        label: 'Submit Application',
        description: 'Final review and submit',
        icon: <IconSend className="h-4 w-4" />,
        status: status === 'draft' ? 'pending' : 
                status === 'submitted' ? 'current' : 
                currentIndex > statusOrder.indexOf('submitted') ? 'completed' : 'pending'
      },
      {
        id: 'review',
        label: 'Under Review',
        description: 'Application being reviewed',
        icon: <IconEye className="h-4 w-4" />,
        status: status === 'under_review' ? 'current' : 
                currentIndex > statusOrder.indexOf('under_review') ? 'completed' : 'pending'
      },
      {
        id: 'interview',
        label: 'Interview',
        description: 'Schedule and attend interview',
        icon: <IconMessage className="h-4 w-4" />,
        status: status === 'interview_scheduled' ? 'current' : 
                currentIndex > statusOrder.indexOf('interview_scheduled') ? 'completed' : 
                status === 'accepted' ? 'completed' : 'pending'
      },
      {
        id: 'decision',
        label: 'Final Decision',
        description: 'Receive admission decision',
        icon: <IconTrophy className="h-4 w-4" />,
        status: status === 'accepted' ? 'completed' : 'pending'
      }
    ]
  }, [status, documentsComplete])

  const currentStepIndex = steps.findIndex(s => s.status === 'current')
  const completedCount = steps.filter(s => s.status === 'completed').length
  const progressPercentage = Math.round((completedCount / steps.length) * 100)

  return (
    <div className={cn("space-y-4", className)}>
      {/* Progress Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Application Progress</h3>
          <p className="text-sm text-muted-foreground">
            {completedCount} of {steps.length} steps completed
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{progressPercentage}%</div>
          <div className="text-xs text-muted-foreground">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps - Horizontal on desktop, vertical on mobile */}
      <div className="hidden md:block">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={cn(
                "flex flex-col items-center flex-1",
                index < steps.length - 1 && "relative"
              )}
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div 
                  className={cn(
                    "absolute top-5 left-1/2 w-full h-0.5 -translate-y-1/2",
                    step.status === 'completed' ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
              
              {/* Icon */}
              <div 
                className={cn(
                  "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  step.status === 'completed' && "bg-primary border-primary text-primary-foreground",
                  step.status === 'current' && "bg-background border-primary text-primary",
                  step.status === 'pending' && "bg-background border-muted text-muted-foreground"
                )}
              >
                {step.status === 'completed' ? (
                  <IconCheck className="h-5 w-5" />
                ) : (
                  step.icon
                )}
              </div>
              
              {/* Label */}
              <div className="mt-2 text-center">
                <p className={cn(
                  "text-sm font-medium",
                  step.status === 'current' && "text-primary",
                  step.status === 'pending' && "text-muted-foreground"
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground hidden lg:block">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Steps - Vertical on mobile */}
      <div className="md:hidden space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg",
              step.status === 'current' && "bg-primary/5 border border-primary/20",
              step.status === 'completed' && "bg-green-50 dark:bg-green-950/20"
            )}
          >
            <div 
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                step.status === 'completed' && "bg-primary border-primary text-primary-foreground",
                step.status === 'current' && "bg-background border-primary text-primary",
                step.status === 'pending' && "bg-background border-muted text-muted-foreground"
              )}
            >
              {step.status === 'completed' ? (
                <IconCheck className="h-4 w-4" />
              ) : (
                step.icon
              )}
            </div>
            <div>
              <p className={cn(
                "font-medium",
                step.status === 'current' && "text-primary",
                step.status === 'pending' && "text-muted-foreground"
              )}>
                {step.label}
              </p>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Current Step Action */}
      {currentStepIndex >= 0 && steps[currentStepIndex] && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
          <p className="text-sm">
            <span className="font-medium text-primary">Current: </span>
            {steps[currentStepIndex].description}
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for dashboard/cards
export function ApplicationProgressCompact({ 
  status, 
  documentsComplete 
}: Omit<ApplicationProgressProps, 'className'>) {
  const getProgressInfo = () => {
    const stages = [
      { key: 'draft', label: 'Draft', progress: 20 },
      { key: 'submitted', label: 'Submitted', progress: 40 },
      { key: 'under_review', label: 'Under Review', progress: 60 },
      { key: 'interview_scheduled', label: 'Interview', progress: 80 },
      { key: 'accepted', label: 'Accepted', progress: 100 },
    ]
    
    const stage = stages.find(s => s.key === status)
    return stage || stages[0]
  }

  const info = getProgressInfo()
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{info.label}</span>
        <span className="text-muted-foreground">{info.progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all"
          style={{ width: `${info.progress}%` }}
        />
      </div>
    </div>
  )
}
