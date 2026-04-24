"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  IconSearch,
  IconFilter,
  IconX,
  IconSchool,
  IconBook,
  IconLanguage,
  IconStar,
} from "@tabler/icons-react"

interface University {
  id: string
  name_en: string
  name_cn?: string | null
}

interface ProgramFilters {
  search: string
  degree: string
  language: string
  category: string
  university: string
  scholarship: boolean
}

interface ProgramFilterBarProps {
  filters: ProgramFilters
  onFilterChange: (key: keyof ProgramFilters, value: string | boolean) => void
  universities?: University[]
  showUniversityFilter?: boolean
  showScholarshipFilter?: boolean
  className?: string
}

const DEGREE_OPTIONS = [
  { value: "all", label: "All Degrees" },
  { value: "Bachelor", label: "Bachelor" },
  { value: "Master", label: "Master" },
  { value: "PhD", label: "PhD" },
  { value: "Chinese Language", label: "Chinese Language" },
  { value: "Diploma", label: "Diploma" },
]

const LANGUAGE_OPTIONS = [
  { value: "all", label: "All Languages" },
  { value: "English", label: "English" },
  { value: "Chinese", label: "Chinese" },
  { value: "Bilingual", label: "Bilingual" },
]

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "Engineering", label: "Engineering" },
  { value: "Business", label: "Business" },
  { value: "Medicine", label: "Medicine" },
  { value: "Science", label: "Science" },
  { value: "Arts", label: "Arts" },
  { value: "Law", label: "Law" },
  { value: "Education", label: "Education" },
  { value: "Computer Science", label: "Computer Science" },
]

export function ProgramFilterBar({
  filters,
  onFilterChange,
  universities = [],
  showUniversityFilter = true,
  showScholarshipFilter = true,
  className,
}: ProgramFilterBarProps) {
  const hasActiveFilters = 
    filters.search || 
    filters.degree !== "all" || 
    filters.language !== "all" || 
    filters.category !== "all" ||
    (showUniversityFilter && filters.university !== "all") ||
    (showScholarshipFilter && filters.scholarship)

  const clearAllFilters = () => {
    onFilterChange("search", "")
    onFilterChange("degree", "all")
    onFilterChange("language", "all")
    onFilterChange("category", "all")
    if (showUniversityFilter) onFilterChange("university", "all")
    if (showScholarshipFilter) onFilterChange("scholarship", false)
  }

  return (
    <div className={cn("flex flex-col sm:flex-row gap-3", className)}>
      {/* Search Input */}
      <div className="relative flex-1">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search programs..."
          value={filters.search}
          onChange={(e) => onFilterChange("search", e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Degree Filter */}
        <Select
          value={filters.degree}
          onValueChange={(value) => onFilterChange("degree", value)}
        >
          <SelectTrigger className="w-[130px]">
            <IconBook className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Degree" />
          </SelectTrigger>
          <SelectContent>
            {DEGREE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Language Filter */}
        <Select
          value={filters.language}
          onValueChange={(value) => onFilterChange("language", value)}
        >
          <SelectTrigger className="w-[130px]">
            <IconLanguage className="mr-2 h-4 w-4 text-muted-foreground" />
            <SelectValue placeholder="Language" />
          </SelectTrigger>
          <SelectContent>
            {LANGUAGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* More Filters Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className={cn(hasActiveFilters && "bg-primary text-primary-foreground")}>
              <IconFilter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72" align="end">
            <div className="space-y-4">
              <h4 className="font-medium text-sm">More Filters</h4>
              
              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Category</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => onFilterChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* University */}
              {showUniversityFilter && universities.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">University</label>
                  <Select
                    value={filters.university}
                    onValueChange={(value) => onFilterChange("university", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Universities</SelectItem>
                      {universities.map((uni) => (
                        <SelectItem key={uni.id} value={uni.id}>
                          {uni.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Scholarship Toggle */}
              {showScholarshipFilter && (
                <div className="flex items-center justify-between">
                  <label className="text-sm flex items-center gap-2">
                    <IconStar className="h-4 w-4 text-yellow-500" />
                    Scholarship Only
                  </label>
                  <Button
                    variant={filters.scholarship ? "default" : "outline"}
                    size="sm"
                    onClick={() => onFilterChange("scholarship", !filters.scholarship)}
                  >
                    {filters.scholarship ? "On" : "Off"}
                  </Button>
                </div>
              )}

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <IconX className="mr-2 h-4 w-4" />
                  Clear All Filters
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Clear button when filters active */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <IconX className="mr-1 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

// Active filters display
interface ActiveFiltersProps {
  filters: ProgramFilters
  onRemove: (key: keyof ProgramFilters) => void
  universities?: University[]
  showUniversityFilter?: boolean
  showScholarshipFilter?: boolean
  className?: string
}

export function ActiveFilters({
  filters,
  onRemove,
  universities = [],
  showUniversityFilter = true,
  showScholarshipFilter = true,
  className,
}: ActiveFiltersProps) {
  const activeFilters: { key: keyof ProgramFilters; label: string; value: string }[] = []

  if (filters.search) {
    activeFilters.push({ key: "search", label: "Search", value: filters.search })
  }
  if (filters.degree !== "all") {
    activeFilters.push({ key: "degree", label: "Degree", value: filters.degree })
  }
  if (filters.language !== "all") {
    activeFilters.push({ key: "language", label: "Language", value: filters.language })
  }
  if (filters.category !== "all") {
    activeFilters.push({ key: "category", label: "Category", value: filters.category })
  }
  if (showUniversityFilter && filters.university !== "all") {
    const uni = universities.find(u => u.id === filters.university)
    activeFilters.push({ key: "university", label: "University", value: uni?.name_en || filters.university })
  }
  if (showScholarshipFilter && filters.scholarship) {
    activeFilters.push({ key: "scholarship", label: "Scholarship", value: "Yes" })
  }

  if (activeFilters.length === 0) return null

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {activeFilters.map(({ key, label, value }) => (
        <Badge
          key={key}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="text-muted-foreground">{label}:</span>
          <span>{value}</span>
          <button
            onClick={() => onRemove(key)}
            className="ml-1 h-4 w-4 rounded-full hover:bg-muted-foreground/20 flex items-center justify-center"
          >
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
