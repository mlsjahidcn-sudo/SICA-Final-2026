"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const CURRENCIES = [
  { value: 'CNY', label: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { value: 'USD', label: 'USD', symbol: '$', name: 'US Dollar' },
  { value: 'EUR', label: 'EUR', symbol: '€', name: 'Euro' },
  { value: 'GBP', label: 'GBP', symbol: '£', name: 'British Pound' },
]

interface CurrencyInputProps {
  value: string | number
  currency: string
  onValueChange: (value: string) => void
  onCurrencyChange: (currency: string) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  hint?: string
  className?: string
  min?: number
  max?: number
  step?: number
}

export function CurrencyInput({
  value,
  currency,
  onValueChange,
  onCurrencyChange,
  label,
  placeholder = "0.00",
  disabled = false,
  required = false,
  error,
  hint,
  className,
  min = 0,
  max,
  step = 1,
}: CurrencyInputProps) {
  const selectedCurrency = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0]

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <div className="flex gap-2">
        <Select
          value={currency}
          onValueChange={onCurrencyChange}
          disabled={disabled}
        >
          <SelectTrigger className={cn("w-[100px]", error && "border-destructive")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((cur) => (
              <SelectItem key={cur.value} value={cur.value}>
                <span className="flex items-center gap-1">
                  <span className="text-muted-foreground">{cur.symbol}</span>
                  <span>{cur.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {selectedCurrency.symbol}
          </span>
          <Input
            type="number"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={cn("pl-7", error && "border-destructive")}
          />
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

// Compact inline version for tables and cards
export function CurrencyDisplay({
  value,
  currency,
  className,
}: {
  value: string | number | null | undefined
  currency: string
  className?: string
}) {
  const selectedCurrency = CURRENCIES.find(c => c.value === currency) || CURRENCIES[0]
  
  if (!value && value !== 0) {
    return <span className={cn("text-muted-foreground", className)}>Not set</span>
  }

  const formattedValue = typeof value === 'number' 
    ? value.toLocaleString() 
    : parseFloat(value).toLocaleString()

  return (
    <span className={className}>
      {selectedCurrency.symbol} {formattedValue}
    </span>
  )
}
