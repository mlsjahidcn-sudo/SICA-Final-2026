"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { IconPlus, IconX } from "@tabler/icons-react"

const LANGUAGE_TESTS = [
  { value: 'HSK', label: 'HSK', levels: ['1', '2', '3', '4', '5', '6'], category: 'chinese' },
  { value: 'HSKK', label: 'HSKK', levels: ['初级', '中级', '高级'], category: 'chinese' },
  { value: 'IELTS', label: 'IELTS', levels: null, category: 'english' },
  { value: 'TOEFL', label: 'TOEFL', levels: null, category: 'english' },
  { value: 'TOEIC', label: 'TOEIC', levels: null, category: 'english' },
  { value: 'Duolingo', label: 'Duolingo', levels: null, category: 'english' },
  { value: 'JLPT', label: 'JLPT', levels: ['N5', 'N4', 'N3', 'N2', 'N1'], category: 'japanese' },
  { value: 'TOPIK', label: 'TOPIK', levels: ['1', '2', '3', '4', '5', '6'], category: 'korean' },
  { value: 'DELF', label: 'DELF', levels: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], category: 'french' },
  { value: 'TestDaF', label: 'TestDaF', levels: null, category: 'german' },
]

interface LanguageRequirement {
  test: string
  level?: string
  score?: string
}

interface LanguageRequirementInputProps {
  value: LanguageRequirement[]
  onChange: (value: LanguageRequirement[]) => void
  label?: string
  hint?: string
  className?: string
}

export function LanguageRequirementInput({
  value,
  onChange,
  label,
  hint,
  className,
}: LanguageRequirementInputProps) {
  const [newRequirement, setNewRequirement] = React.useState<LanguageRequirement>({
    test: '',
    level: '',
    score: '',
  })

  const selectedTest = LANGUAGE_TESTS.find(t => t.value === newRequirement.test)

  const addRequirement = () => {
    if (!newRequirement.test) return
    
    const requirement: LanguageRequirement = {
      test: newRequirement.test,
    }
    
    if (selectedTest?.levels && newRequirement.level) {
      requirement.level = newRequirement.level
    } else if (newRequirement.score) {
      requirement.score = newRequirement.score
    }
    
    // Check for duplicates
    const isDuplicate = value.some(
      r => r.test === requirement.test && 
           r.level === requirement.level && 
           r.score === requirement.score
    )
    
    if (!isDuplicate) {
      onChange([...value, requirement])
    }
    
    setNewRequirement({ test: '', level: '', score: '' })
  }

  const removeRequirement = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addRequirement()
    }
  }

  const getDisplayText = (req: LanguageRequirement) => {
    const test = LANGUAGE_TESTS.find(t => t.value === req.test)
    if (test?.levels && req.level) {
      return `${test.label} ${req.level}`
    }
    if (req.score) {
      return `${test?.label || req.test} ${req.score}`
    }
    return test?.label || req.test
  }

  return (
    <div className={cn("space-y-3", className)}>
      {label && <Label>{label}</Label>}
      
      {/* Existing requirements */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((req, index) => (
            <Badge 
              key={`${req.test}-${req.level}-${req.score}`} 
              variant="secondary"
              className="px-3 py-1"
            >
              {getDisplayText(req)}
              <button
                type="button"
                onClick={() => removeRequirement(index)}
                className="ml-2 hover:text-destructive transition-colors"
              >
                <IconX className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add new requirement */}
      <div className="flex flex-wrap gap-2 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Test Type</Label>
          <Select
            value={newRequirement.test}
            onValueChange={(v) => setNewRequirement(prev => ({ 
              ...prev, 
              test: v, 
              level: '', 
              score: '' 
            }))}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select test" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGE_TESTS.map((test) => (
                <SelectItem key={test.value} value={test.value}>
                  {test.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedTest?.levels ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Level</Label>
            <Select
              value={newRequirement.level}
              onValueChange={(v) => setNewRequirement(prev => ({ ...prev, level: v }))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                {selectedTest.levels.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : newRequirement.test ? (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Score</Label>
            <Input
              value={newRequirement.score}
              onChange={(e) => setNewRequirement(prev => ({ ...prev, score: e.target.value }))}
              placeholder="e.g., 6.5"
              className="w-[100px]"
              onKeyDown={handleKeyDown}
            />
          </div>
        ) : null}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRequirement}
          disabled={!newRequirement.test}
        >
          <IconPlus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}

// Simple text input for free-form language requirements
interface LanguageTextInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  placeholder?: string
  hint?: string
  className?: string
}

export function LanguageTextInput({
  value,
  onChange,
  label,
  placeholder = "e.g., HSK 4 or IELTS 6.0",
  hint,
  className,
}: LanguageTextInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
