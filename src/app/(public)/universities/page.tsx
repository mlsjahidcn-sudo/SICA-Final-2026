'use client';

import { Suspense, useState, useEffect, useCallback, Fragment } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
} from '@/components/ui/empty';
import {
  IconSearch,
  IconAdjustmentsHorizontal,
  IconMapPin,
  IconTrophy,
  IconCalendar,
  IconChevronDown,
  IconChevronUp,
  IconX,
  IconMap,
  IconSchool,
  IconGlobe,
  IconBuilding,
  IconBook,
  IconClock,
  IconAward,
  IconChevronRight,
} from '@tabler/icons-react';
import { useDebounce } from '@/hooks/use-debounce';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  short_name: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  province: string;
  city: string;
  tags: string[];
  category: string | null;
  ranking_national: number | null;
  ranking_international: number | null;
  student_count: number | null;
  international_student_count: number | null;
  teaching_languages: string[] | null;
  scholarship_available: boolean;
  founded_year: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  tuition_currency: string | null;
  view_count: number;
  application_deadline: string | null;
  intake_months: (string | number)[] | null;
}

const ITEMS_PER_PAGE = 12;

const PROVINCES = [
  'Beijing',
  'Shanghai',
  'Guangdong',
  'Jiangsu',
  'Zhejiang',
  'Sichuan',
  'Hubei',
  'Shaanxi',
  'Shandong',
  'Tianjin',
  'Chongqing',
  'Fujian',
  'Anhui',
  'Henan',
  'Hebei',
];

const TYPES = [
  { value: '985', label: '985 Project' },
  { value: '211', label: '211 Project' },
  { value: 'double_first_class', label: 'Double First-Class' },
  { value: 'public', label: 'Public University' },
  { value: 'private', label: 'Private University' },
];

const CATEGORIES = [
  { value: 'comprehensive', label: 'Comprehensive' },
  { value: 'medical', label: 'Medical' },
  { value: 'technical', label: 'Technical/Engineering' },
  { value: 'language', label: 'Language' },
  { value: 'business', label: 'Business' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'normal', label: 'Normal (Teacher Training)' },
];

// Filter Section Component
const FilterSection = ({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
      <Icon className="h-4 w-4 text-muted-foreground" />
      {title}
    </div>
    {children}
  </div>
);

// University Card Component
function UniversityCard({ university }: { university: University }) {
  // Calculate days until deadline
  const getDeadlineInfo = (deadline: string | null): { date: Date; daysLeft: number } | null => {
    if (!deadline) return null;
    try {
      const deadlineDate = new Date(deadline);
      const now = new Date();
      const daysLeft = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { date: deadlineDate, daysLeft };
    } catch {
      return null;
    }
  };

  const deadlineInfo = getDeadlineInfo(university.application_deadline);
  
  // Format intake months
  const formatIntake = (months: (string | number)[] | null): string | null => {
    if (!months || months.length === 0) return null;
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.slice(0, 3).map(m => {
      const num = typeof m === 'string' ? parseInt(m, 10) : m;
      return monthNames[num - 1] || String(m);
    }).join('/');
  };

  return (
    <Link href={`/universities/${university.id}`} className="group block">
      <div className="h-full transition-all duration-200 hover:shadow-lg hover:ring-2 hover:ring-primary/20 overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10 active:scale-[0.98] sm:active:scale-100">
        {/* Cover Image */}
        <div className="relative">
          <AspectRatio ratio={16/9}>
            {university.cover_image_url && university.cover_image_url.trim() !== '' ? (
              <Image
                src={university.cover_image_url}
                alt={university.name_en}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1200px) 50vw, 33vw"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 via-muted to-muted/50 flex items-center justify-center">
                <IconBuilding className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground/50" />
              </div>
            )}
          </AspectRatio>

          {/* Top Badges */}
          <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none">
            {university.ranking_national && (
              <Badge variant="secondary" className="gap-0.5 sm:gap-1 text-[10px] sm:text-xs shadow-sm backdrop-blur-sm bg-background/80">
                <IconTrophy className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-500" />
                #{university.ranking_national}
              </Badge>
            )}
            {university.scholarship_available ? (
              <Badge className="bg-amber-500/90 text-white gap-0.5 sm:gap-1 text-[10px] sm:text-xs border-0 shadow-sm">
                <IconAward className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Scholarship
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] sm:text-xs shadow-sm backdrop-blur-sm bg-background/80 text-muted-foreground hidden sm:flex">
                No Scholarship
              </Badge>
            )}
          </div>
        </div>

        {/* Header: Logo + Name */}
        <div className="px-2.5 sm:px-3 pt-2.5 sm:pt-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md sm:rounded-lg border bg-background flex items-center justify-center shrink-0 overflow-hidden relative">
              {university.logo_url && university.logo_url.trim() !== '' ? (
                <Image 
                  src={university.logo_url} 
                  alt="" 
                  fill 
                  className="object-contain" 
                  sizes="40px"
                  unoptimized
                />
              ) : (
                <IconBuilding className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs sm:text-sm font-semibold group-hover:text-primary transition-colors line-clamp-1">
                {university.name_en}
              </h3>
              {university.name_cn && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{university.name_cn}</p>
              )}
              <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                <IconMapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                {university.city}, {university.province}
              </div>
            </div>
          </div>
        </div>

        {/* Meta Info: Deadline, Intake */}
        <div className="px-2.5 sm:px-3 py-1.5 sm:py-2">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
            {/* Deadline */}
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                <IconCalendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Deadline
              </span>
              {deadlineInfo ? (
                <span className={cn(
                  "font-medium",
                  deadlineInfo.daysLeft <= 0 ? "text-muted-foreground" :
                  deadlineInfo.daysLeft <= 30 ? "text-red-600" : 
                  deadlineInfo.daysLeft <= 60 ? "text-amber-600" : "text-foreground"
                )}>
                  {deadlineInfo.daysLeft <= 0 ? "Closed" : `${deadlineInfo.daysLeft}d left`}
                </span>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>

            {/* Intake */}
            <div className="flex flex-col gap-0.5">
              <span className="text-muted-foreground flex items-center gap-0.5 sm:gap-1">
                <IconClock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                Intake
              </span>
              <span className="font-medium truncate">
                {formatIntake(university.intake_months) || '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Tuition + View */}
        <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-t flex justify-between items-center">
          <div className="text-xs sm:text-sm">
            {university.tuition_min ? (
              <span className="font-semibold">
                {university.tuition_currency || '¥'}{university.tuition_min.toLocaleString()}
                <span className="text-[10px] sm:text-xs text-muted-foreground font-normal">/yr</span>
              </span>
            ) : (
              <span className="text-[10px] sm:text-xs text-muted-foreground">Tuition on request</span>
            )}
          </div>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] sm:text-xs font-medium text-muted-foreground group-hover:border-primary group-hover:text-primary transition-colors">
            View
            <IconChevronRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

// University Card Skeleton
function UniversityCardSkeleton() {
  return (
    <div className="h-full overflow-hidden rounded-lg bg-card ring-1 ring-foreground/10">
      {/* Cover skeleton */}
      <div className="relative">
        <AspectRatio ratio={16/9}>
          <Skeleton className="w-full h-full" />
        </AspectRatio>
      </div>

      {/* Header skeleton */}
      <div className="px-3 pt-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>

      {/* Meta skeleton */}
      <div className="px-3 py-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="px-3 py-2 border-t flex justify-between items-center">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
    </div>
  );
}

// Filter Content Component
function FilterContent({
  searchQuery,
  setSearchQuery,
  selectedProvince,
  setSelectedProvince,
  selectedType,
  setSelectedType,
  selectedCategory,
  setSelectedCategory,
  scholarshipOnly,
  setScholarshipOnly,
  englishOnly,
  setEnglishOnly,
  activeFiltersCount,
  clearFilters,
  setPage,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedProvince: string;
  setSelectedProvince: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  scholarshipOnly: boolean;
  setScholarshipOnly: (v: boolean) => void;
  englishOnly: boolean;
  setEnglishOnly: (v: boolean) => void;
  activeFiltersCount: number;
  clearFilters: () => void;
  setPage: (v: number) => void;
}) {
  return (
    <div className="space-y-5">
      {/* Search */}
      <FilterSection title="Search" icon={IconSearch}>
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search universities..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <IconX className="h-4 w-4" />
            </button>
          )}
        </div>
      </FilterSection>

      {/* Province */}
      <FilterSection title="Province" icon={IconMap}>
        <Select value={selectedProvince} onValueChange={(v) => { setSelectedProvince(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All provinces" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All provinces</SelectItem>
            {PROVINCES.map((province) => (
              <SelectItem key={province} value={province}>
                {province}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Type */}
      <FilterSection title="University Type" icon={IconSchool}>
        <Select value={selectedType} onValueChange={(v) => { setSelectedType(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category" icon={IconBook}>
        <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Toggles */}
      <FilterSection title="Options" icon={IconGlobe}>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer py-1">
            <Checkbox
              checked={scholarshipOnly}
              onCheckedChange={(checked) => {
                setScholarshipOnly(checked as boolean);
                setPage(1);
              }}
            />
            <span className="text-sm">Scholarship Available</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer py-1">
            <Checkbox
              checked={englishOnly}
              onCheckedChange={(checked) => {
                setEnglishOnly(checked as boolean);
                setPage(1);
              }}
            />
            <span className="text-sm">English-Taught Programs</span>
          </label>
        </div>
      </FilterSection>

      {/* Clear Button */}
      {activeFiltersCount > 0 && (
        <Button variant="outline" onClick={clearFilters} className="w-full">
          Clear All Filters ({activeFiltersCount})
        </Button>
      )}
    </div>
  );
}

// Active Filter Tags Component
function ActiveFilterTags({
  searchQuery,
  setSearchQuery,
  selectedProvince,
  setSelectedProvince,
  selectedType,
  setSelectedType,
  selectedCategory,
  setSelectedCategory,
  scholarshipOnly,
  setScholarshipOnly,
  englishOnly,
  setEnglishOnly,
  clearFilters,
}: {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedProvince: string;
  setSelectedProvince: (v: string) => void;
  selectedType: string;
  setSelectedType: (v: string) => void;
  selectedCategory: string;
  setSelectedCategory: (v: string) => void;
  scholarshipOnly: boolean;
  setScholarshipOnly: (v: boolean) => void;
  englishOnly: boolean;
  setEnglishOnly: (v: boolean) => void;
  clearFilters: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {searchQuery && (
        <Badge variant="secondary" className="gap-1">
          Search: {searchQuery}
          <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-foreground">
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {selectedProvince !== 'all' && (
        <Badge variant="secondary" className="gap-1">
          {selectedProvince}
          <button onClick={() => setSelectedProvince('all')} className="ml-1 hover:text-foreground">
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {selectedType !== 'all' && (
        <Badge variant="secondary" className="gap-1">
          {TYPES.find(t => t.value === selectedType)?.label}
          <button onClick={() => setSelectedType('all')} className="ml-1 hover:text-foreground">
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {selectedCategory !== 'all' && (
        <Badge variant="secondary" className="gap-1">
          {CATEGORIES.find(c => c.value === selectedCategory)?.label}
          <button onClick={() => setSelectedCategory('all')} className="ml-1 hover:text-foreground">
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {scholarshipOnly && (
        <Badge variant="secondary" className="gap-1">
          Scholarship
          <button onClick={() => setScholarshipOnly(false)} className="ml-1 hover:text-foreground">
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      )}
      {englishOnly && (
        <Badge variant="secondary" className="gap-1">
          English Programs
          <button onClick={() => setEnglishOnly(false)} className="ml-1 hover:text-foreground">
            <IconX className="h-3 w-3" />
          </button>
        </Badge>
      )}
      <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
        Clear all
      </Button>
    </div>
  );
}

function UniversitiesContent() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [scholarshipOnly, setScholarshipOnly] = useState(false);
  const [englishOnly, setEnglishOnly] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 400);

  const activeFiltersCount =
    (selectedProvince !== 'all' ? 1 : 0) +
    (selectedType !== 'all' ? 1 : 0) +
    (selectedCategory !== 'all' ? 1 : 0) +
    (scholarshipOnly ? 1 : 0) +
    (englishOnly ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const fetchUniversities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedProvince !== 'all') params.append('province', selectedProvince);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (scholarshipOnly) params.append('scholarship', 'true');
      if (englishOnly) params.append('english', 'true');
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());

      const response = await fetch(`/api/universities?${params.toString()}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      setUniversities(data.universities || []);
      setTotalCount(data.total || 0);
    } catch (error) {
      console.error('Error fetching universities:', error);
      setUniversities([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedProvince, selectedType, selectedCategory, scholarshipOnly, englishOnly, page]);

  useEffect(() => {
    fetchUniversities();
  }, [fetchUniversities]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedProvince('all');
    setSelectedType('all');
    setSelectedCategory('all');
    setScholarshipOnly(false);
    setEnglishOnly(false);
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalCount);

  // Generate pagination numbers
  const getPaginationNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const showPages = 5;

    if (totalPages <= showPages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let startPage = Math.max(2, page - 1);
      let endPage = Math.min(totalPages - 1, page + 1);

      if (page <= 2) endPage = Math.min(totalPages - 1, showPages - 1);
      if (page >= totalPages - 1) startPage = Math.max(2, totalPages - showPages + 2);

      if (startPage > 2) pages.push('ellipsis');
      for (let i = startPage; i <= endPage; i++) pages.push(i);
      if (endPage < totalPages - 1) pages.push('ellipsis');

      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10">
              <IconBuilding className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">University Directory</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Explore <span className="font-semibold text-foreground">{totalCount}</span> universities across China
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Collapsible Filters */}
      <div className="lg:hidden sticky top-16 z-20 bg-background border-b">
        <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
          <CollapsibleTrigger asChild>
            <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                <IconAdjustmentsHorizontal className="h-4 w-4" />
                <span className="font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              {filtersExpanded ? (
                <IconChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <IconChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 border-t bg-background">
            <div className="pt-4">
              <FilterContent
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedProvince={selectedProvince}
                setSelectedProvince={setSelectedProvince}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                scholarshipOnly={scholarshipOnly}
                setScholarshipOnly={setScholarshipOnly}
                englishOnly={englishOnly}
                setEnglishOnly={setEnglishOnly}
                activeFiltersCount={activeFiltersCount}
                clearFilters={clearFilters}
                setPage={setPage}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20">
              <Card className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Filters</CardTitle>
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary">{activeFiltersCount} active</Badge>
                    )}
                  </div>
                </CardHeader>
                <Separator />
                <ScrollArea className="h-[calc(100vh-220px)]">
                  <CardContent className="pt-4">
                    <FilterContent
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      selectedProvince={selectedProvince}
                      setSelectedProvince={setSelectedProvince}
                      selectedType={selectedType}
                      setSelectedType={setSelectedType}
                      selectedCategory={selectedCategory}
                      setSelectedCategory={setSelectedCategory}
                      scholarshipOnly={scholarshipOnly}
                      setScholarshipOnly={setScholarshipOnly}
                      englishOnly={englishOnly}
                      setEnglishOnly={setEnglishOnly}
                      activeFiltersCount={activeFiltersCount}
                      clearFilters={clearFilters}
                      setPage={setPage}
                    />
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {loading ? 'Loading...' : `Showing ${startItem}-${endItem} of ${totalCount} universities`}
              </p>
            </div>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <ActiveFilterTags
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                selectedProvince={selectedProvince}
                setSelectedProvince={setSelectedProvince}
                selectedType={selectedType}
                setSelectedType={setSelectedType}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                scholarshipOnly={scholarshipOnly}
                setScholarshipOnly={setScholarshipOnly}
                englishOnly={englishOnly}
                setEnglishOnly={setEnglishOnly}
                clearFilters={clearFilters}
              />
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <UniversityCardSkeleton key={i} />
                ))}
              </div>
            ) : universities.length === 0 ? (
              <Empty className="border-2 border-dashed rounded-xl p-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconBuilding className="h-5 w-5" />
                  </EmptyMedia>
                  <EmptyTitle>No universities found</EmptyTitle>
                  <EmptyDescription>
                    We couldn&apos;t find any universities matching your criteria.
                    Try adjusting your filters or search terms.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button variant="outline" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </EmptyContent>
              </Empty>
            ) : (
              <>
                {/* University Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {universities.map((university) => (
                    <UniversityCard key={university.id} university={university} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 sm:mt-8">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      Showing <span className="font-medium">{startItem}</span> to{' '}
                      <span className="font-medium">{endItem}</span> of{' '}
                      <span className="font-medium">{totalCount}</span> universities
                    </p>

                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            className={page === 1 ? "pointer-events-none opacity-50 h-8 sm:h-10" : "cursor-pointer h-8 sm:h-10"}
                          />
                        </PaginationItem>

                        {getPaginationNumbers().map((p, i) => (
                          <Fragment key={i}>
                            {p === 'ellipsis' ? (
                              <PaginationItem className="hidden sm:block">
                                <PaginationEllipsis />
                              </PaginationItem>
                            ) : (
                              <PaginationItem>
                                <PaginationLink
                                  isActive={p === page}
                                  onClick={() => setPage(p)}
                                  className="cursor-pointer h-8 w-8 sm:h-10 sm:w-10 text-xs sm:text-sm"
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            )}
                          </Fragment>
                        ))}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            className={page === totalPages ? "pointer-events-none opacity-50 h-8 sm:h-10" : "cursor-pointer h-8 sm:h-10"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function UniversitiesLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  );
}

export default function UniversitiesPage() {
  return (
    <Suspense fallback={<UniversitiesLoading />}>
      <UniversitiesContent />
    </Suspense>
  );
}
