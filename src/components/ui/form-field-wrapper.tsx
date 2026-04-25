"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { IconAlertCircle } from "@tabler/icons-react"

interface FormFieldWrapperProps {
  label?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
  labelClassName?: string
}

export function FormFieldWrapper({
  label,
  required = false,
  error,
  hint,
  children,
  className,
  labelClassName,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(error && "text-destructive", labelClassName)}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      {children}
      {error && (
        <div className="flex items-center gap-1.5 text-sm text-destructive">
          <IconAlertCircle className="h-3.5 w-3.5" />
          <span>{error}</span>
        </div>
      )}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

// Description text component for form sections
export function FormDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)}>
      {children}
    </p>
  )
}

// Section wrapper for grouping form fields
interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultOpen?: boolean
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && <h3 className="text-sm font-medium">{title}</h3>}
          {description && <FormDescription>{description}</FormDescription>}
        </div>
      )}
      {children}
    </div>
  )
}
