"use client"

import { ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface FormSectionProps {
  title: string
  description?: string
  children: ReactNode
}

/**
 * Reusable form section with consistent styling
 * Used to organize form fields into logical groups
 */
export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface FormGridProps {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

/**
 * Responsive grid layout for form fields
 * Automatically adjusts columns based on screen size
 */
export function FormGrid({ children, columns = 2, className = "" }: FormGridProps) {
  const gridCols = {
    1: "sm:grid-cols-1",
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-3",
    4: "sm:grid-cols-4",
  }

  return (
    <div className={`grid gap-4 ${gridCols[columns]} ${className}`}>
      {children}
    </div>
  )
}

interface FormFieldProps {
  label: string
  value?: string | null
  children?: ReactNode
}

/**
 * Form field with label and value display
 * Used for read-only form fields or to wrap input components
 */
export function FormField({ label, value, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      {children || <div className="font-medium">{value || 'N/A'}</div>}
    </div>
  )
}

interface FormActionsProps {
  children: ReactNode
  className?: string
}

/**
 * Form action buttons container
 * Provides consistent spacing and alignment for form actions
 */
export function FormActions({ children, className = "" }: FormActionsProps) {
  return (
    <div className={`flex items-center gap-3 pt-6 ${className}`}>
      {children}
    </div>
  )
}

interface FormDividerProps {
  className?: string
}

/**
 * Form section divider
 * Used to separate different sections of a form
 */
export function FormDivider({ className = "" }: FormDividerProps) {
  return <Separator className={`my-6 ${className}`} />
}
