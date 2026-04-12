"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { IconLoader2 } from "@tabler/icons-react"

export interface Step {
  id: number
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  status?: "pending" | "current" | "completed" | "error"
}

export interface ProgressStepsProps {
  /**
   * Array of steps to display
   */
  steps: Step[]
  /**
   * Current active step (1-indexed)
   */
  currentStep: number
  /**
   * Callback when a step is clicked
   */
  onStepClick?: (stepId: number) => void
  /**
   * Allow clicking on completed steps to go back
   * @default true
   */
  allowStepBack?: boolean
  /**
   * Layout variant
   * @default "horizontal"
   */
  variant?: "horizontal" | "vertical"
  /**
   * Size of the step indicators
   * @default "md"
   */
  size?: "sm" | "md" | "lg"
  /**
   * Show progress bar between steps
   * @default true
   */
  showProgress?: boolean
  /**
   * Additional class name
   */
  className?: string
}

const stepSizes = {
  sm: {
    circle: "h-8 w-8",
    icon: "h-4 w-4",
    text: "text-xs",
    description: "text-[10px]",
  },
  md: {
    circle: "h-10 w-10",
    icon: "h-5 w-5",
    text: "text-sm",
    description: "text-xs",
  },
  lg: {
    circle: "h-12 w-12",
    icon: "h-6 w-6",
    text: "text-base",
    description: "text-sm",
  },
}

function ProgressSteps({
  steps,
  currentStep,
  onStepClick,
  allowStepBack = true,
  variant = "horizontal",
  size = "md",
  showProgress = true,
  className,
}: ProgressStepsProps) {
  // Calculate progress percentage
  const progress = ((currentStep - 1) / (steps.length - 1)) * 100

  const getStepStatus = (step: Step): "pending" | "current" | "completed" | "error" => {
    if (step.status) return step.status
    if (step.id < currentStep) return "completed"
    if (step.id === currentStep) return "current"
    return "pending"
  }

  const handleStepClick = (step: Step) => {
    const status = getStepStatus(step)
    if (onStepClick && (status === "completed" && allowStepBack)) {
      onStepClick(step.id)
    }
  }

  const sizeConfig = stepSizes[size]

  if (variant === "vertical") {
    return (
      <div className={cn("flex flex-col", className)}>
        {steps.map((step, index) => {
          const status = getStepStatus(step)
          const Icon = step.icon

          return (
            <div key={step.id} className="flex">
              {/* Left side - Circle and connector */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={status !== "completed" || !allowStepBack}
                  className={cn(
                    "relative flex items-center justify-center rounded-full border-2 transition-all duration-200",
                    sizeConfig.circle,
                    status === "completed" && "border-primary bg-primary text-primary-foreground",
                    status === "current" && "border-primary bg-background text-primary ring-2 ring-primary ring-offset-2",
                    status === "pending" && "border-muted-foreground/25 bg-background text-muted-foreground",
                    status === "error" && "border-destructive bg-destructive text-destructive-foreground",
                    status === "completed" && allowStepBack && "cursor-pointer hover:opacity-80"
                  )}
                >
                  {status === "completed" ? (
                    <Check className={sizeConfig.icon} />
                  ) : status === "current" ? (
                    <IconLoader2 className={cn(sizeConfig.icon, "animate-spin")} />
                  ) : Icon ? (
                    <Icon className={sizeConfig.icon} />
                  ) : (
                    <span className={sizeConfig.text}>{step.id}</span>
                  )}
                </button>

                {/* Connector line */}
                {index < steps.length - 1 && showProgress && (
                  <div
                    className={cn(
                      "w-0.5 flex-1 my-2 min-h-8",
                      status === "completed" ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>

              {/* Right side - Content */}
              <div className="ml-4 pb-8">
                <p
                  className={cn(
                    "font-medium",
                    sizeConfig.text,
                    status === "current" && "text-foreground",
                    status === "completed" && "text-foreground",
                    status === "pending" && "text-muted-foreground",
                    status === "error" && "text-destructive"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className={cn("mt-0.5 text-muted-foreground", sizeConfig.description)}>
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Horizontal variant
  return (
    <div className={cn("w-full", className)}>
      {/* Progress bar */}
      {showProgress && (
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Step {currentStep} of {steps.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }}>
        {steps.map((step) => {
          const status = getStepStatus(step)
          const Icon = step.icon

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              disabled={status !== "completed" || !allowStepBack}
              className={cn(
                "flex flex-col items-center gap-2 rounded-lg p-3 transition-all duration-200",
                status === "current" && "bg-primary/10",
                status === "completed" && allowStepBack && "hover:bg-muted/80 cursor-pointer",
                status === "pending" && "opacity-50"
              )}
            >
              {/* Circle */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2 transition-all duration-200",
                  sizeConfig.circle,
                  status === "completed" && "border-primary bg-primary text-primary-foreground",
                  status === "current" && "border-primary bg-background text-primary",
                  status === "pending" && "border-border bg-background",
                  status === "error" && "border-destructive bg-destructive text-destructive-foreground"
                )}
              >
                {status === "completed" ? (
                  <Check className={sizeConfig.icon} />
                ) : status === "current" ? (
                  <IconLoader2 className={cn(sizeConfig.icon, "animate-spin")} />
                ) : Icon ? (
                  <Icon className={sizeConfig.icon} />
                ) : (
                  <span className={sizeConfig.text}>{step.id}</span>
                )}
              </div>

              {/* Text */}
              <div className="text-center">
                <p
                  className={cn(
                    "font-medium",
                    sizeConfig.text,
                    status === "current" && "text-foreground",
                    status === "completed" && "text-foreground",
                    status === "pending" && "text-muted-foreground",
                    status === "error" && "text-destructive"
                  )}
                >
                  {step.title}
                </p>
                {step.description && (
                  <p className={cn("hidden text-muted-foreground sm:block mt-0.5", sizeConfig.description)}>
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Dot Steps - Minimal variant for simple flows
export interface DotStepsProps {
  steps: number
  currentStep: number
  onStepClick?: (step: number) => void
  allowStepBack?: boolean
  className?: string
}

function DotSteps({
  steps,
  currentStep,
  onStepClick,
  allowStepBack = true,
  className,
}: DotStepsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {Array.from({ length: steps }, (_, i) => i + 1).map((step) => {
        const isActive = step === currentStep
        const isCompleted = step < currentStep

        return (
          <button
            key={step}
            onClick={() => onStepClick?.(step)}
            disabled={!isCompleted || !allowStepBack}
            className={cn(
              "transition-all duration-200",
              isActive && "h-2.5 w-2.5 rounded-full bg-primary",
              isCompleted && "h-2 w-2 rounded-full bg-primary cursor-pointer hover:opacity-80",
              !isActive && !isCompleted && "h-2 w-2 rounded-full bg-muted"
            )}
            aria-label={`Step ${step}`}
          />
        )
      })}
    </div>
  )
}

export { ProgressSteps, DotSteps }
