'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  BookOpen,
  Search,
  Loader2,
  MapPin,
  SlidersHorizontal,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Award,
  GraduationCap,
  Languages,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  city: string;
  province: string;
  type: string;
  ranking_national: number | null;
  logo_url: string | null;
}

interface Program {
  id: string;
  name: string;
  name_fr: string | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  degree_level: string;
  language: string;
  category: string | null;
  sub_category: string | null;
  tuition_fee_per_year: number | null;
  currency: string;
  scholarship_coverage: string | null;
  scholarship_types: string[] | null;
  cover_image: string | null;
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  universities: University;
}

interface UniversityOption {
  id: string;
  name_en: string;
  name_cn: string | null;
  city: string;
  province: string;
}

const DEGREE_LEVELS = [
  { value: 'all', label: 'All Degrees' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'phd', label: 'PhD' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'language', label: 'Chinese Language' },
];

const LANGUAGES = [
  { value: 'all', label: 'All Languages' },
  { value: 'English', label: 'English' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Both', label: 'Both' },
];

// Filter Section Component - extracted outside to prevent re-creation
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

function ProgramsContent() {
  const searchParams = useSearchParams();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [universities, setUniversities] = useState<UniversityOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Initialize from URL params
  const initialDegree = searchParams.get('degree_type');
  const initialUniversity = searchParams.get('university_id');
  
  const [selectedDegrees, setSelectedDegrees] = useState<string[]>(
    initialDegree && initialDegree !== 'all' ? [initialDegree] : ['all']
  );
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['all']);
  const [selectedUniversity, setSelectedUniversity] = useState<string>(initialUniversity || 'all');
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const ITEMS_PER_PAGE = 12;

  // Debounce search query for auto-filtering
  const debouncedSearch = useDebounce(searchQuery, 400);

  // Fetch universities for dropdown
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const response = await fetch('/api/universities');
        if (response.ok) {
          const data = await response.json();
          setUniversities(data.universities || []);
        }
      } catch (error) {
        console.error('Error fetching universities:', error);
      }
    };
    fetchUniversities();
  }, []);

  const fetchPrograms = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', ITEMS_PER_PAGE.toString());
      if (debouncedSearch) params.append('search', debouncedSearch);
      
      // Filter out 'all' from selected degrees
      const degreesToFilter = selectedDegrees.filter(d => d !== 'all');
      if (degreesToFilter.length > 0) {
        params.append('degree_level', degreesToFilter.join(','));
      }
      
      // Filter out 'all' from selected languages
      const languagesToFilter = selectedLanguages.filter(l => l !== 'all');
      if (languagesToFilter.length > 0) {
        params.append('language', languagesToFilter.join(','));
      }
      
      if (selectedUniversity && selectedUniversity !== 'all') {
        params.append('university_id', selectedUniversity);
      }

      const response = await fetch(`/api/programs?${params.toString()}`);

      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || []);
        setTotalCount(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, selectedDegrees, selectedLanguages, selectedUniversity]);

  // Auto-fetch when filters change (debounced search auto-applies)
  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const toggleDegree = (degree: string) => {
    setPage(1); // Reset to first page when filter changes
    if (degree === 'all') {
      setSelectedDegrees(['all']);
    } else {
      setSelectedDegrees(prev => {
        const filtered = prev.filter(d => d !== 'all');
        if (filtered.includes(degree)) {
          return filtered.length === 1 ? ['all'] : filtered.filter(d => d !== degree);
        }
        return [...filtered, degree];
      });
    }
  };

  const toggleLanguage = (language: string) => {
    setPage(1); // Reset to first page when filter changes
    if (language === 'all') {
      setSelectedLanguages(['all']);
    } else {
      setSelectedLanguages(prev => {
        const filtered = prev.filter(l => l !== 'all');
        if (filtered.includes(language)) {
          return filtered.length === 1 ? ['all'] : filtered.filter(l => l !== language);
        }
        return [...filtered, language];
      });
    }
  };

  const clearAllFilters = () => {
    setSelectedDegrees(['all']);
    setSelectedLanguages(['all']);
    setSelectedUniversity('all');
    setSearchQuery('');
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalCount);

  const activeFiltersCount = 
    (selectedDegrees.includes('all') ? 0 : selectedDegrees.length) +
    (selectedLanguages.includes('all') ? 0 : selectedLanguages.length) +
    (selectedUniversity === 'all' ? 0 : 1) +
    (searchQuery ? 1 : 0);

  const getDegreeBadge = (level: string) => {
    const colors: Record<string, string> = {
      bachelor: 'bg-blue-50 text-blue-700 border-blue-200',
      master: 'bg-purple-50 text-purple-700 border-purple-200',
      phd: 'bg-red-50 text-red-700 border-red-200',
      language: 'bg-green-50 text-green-700 border-green-200',
      pre_university: 'bg-orange-50 text-orange-700 border-orange-200',
      diploma: 'bg-gray-50 text-gray-700 border-gray-200',
    };

    const label = DEGREE_LEVELS.find((d) => d.value === level)?.label || level;
    return (
      <Badge variant="outline" className={cn('text-xs font-medium', colors[level] || '')}>
        {label}
      </Badge>
    );
  };

  const getLanguageBadge = (language: string | null) => {
    if (!language) {
      return <span className="text-xs text-muted-foreground">Not Specified</span>;
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {language}
      </Badge>
    );
  };

  const getLanguageDisplay = (language: string | null) => {
    if (!language) {
      return <span className="text-xs text-muted-foreground">Not Specified</span>;
    }
    return (
      <Badge variant="secondary" className="text-xs">
        {language}
      </Badge>
    );
  };

  // University Logo Component
  const UniversityLogo = ({ university }: { university: University }) => (
    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border relative">
      {university.logo_url && university.logo_url.trim() !== '' ? (
        <Image
          src={university.logo_url}
          alt={university.name_en}
          fill
          className="object-contain"
          sizes="48px"
          unoptimized
        />
      ) : (
        <span className="text-base font-bold text-muted-foreground">
          {university.name_en.charAt(0)}
        </span>
      )}
    </div>
  );

  // Program List Item - Mobile optimized
  const ProgramListItem = ({ program }: { program: Program }) => (
    <div className="rounded-lg border bg-card p-3 sm:p-4 hover:shadow-md transition-shadow active:scale-[0.98] sm:active:scale-100">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
        {/* Left: University Logo & Program Info */}
        <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-md sm:rounded-lg bg-muted flex items-center justify-center shrink-0 overflow-hidden border relative">
            {program.universities.logo_url && program.universities.logo_url.trim() !== '' ? (
              <Image
                src={program.universities.logo_url}
                alt={program.universities.name_en}
                fill
                className="object-contain"
                sizes="48px"
                unoptimized
              />
            ) : (
              <span className="text-sm sm:text-base font-bold text-muted-foreground">
                {program.universities.name_en.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{program.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
              {program.universities.name_en}
            </p>
            <div className="flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
              <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
              {program.universities.city}, {program.universities.province}
            </div>
          </div>
        </div>

        {/* Middle: Badges & Info */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:flex lg:items-center gap-2 sm:gap-3 lg:gap-6 text-xs sm:text-sm">
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground lg:hidden">Degree</span>
            {getDegreeBadge(program.degree_level)}
          </div>
          
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground lg:hidden">Language</span>
            {getLanguageBadge(program.language)}
          </div>
          
          <div className="flex flex-col gap-0.5 sm:gap-1">
            <span className="text-[10px] sm:text-xs text-muted-foreground lg:hidden">Tuition</span>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-muted-foreground" />
              <span className="font-medium text-xs sm:text-sm">
                {program.tuition_fee_per_year 
                  ? `${program.currency || 'CNY'} ${program.tuition_fee_per_year.toLocaleString()}`
                  : 'Contact'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 pt-2 sm:pt-3 lg:pt-0 border-t lg:border-t-0">
          <Link href={`/programs/${program.id}`} className="flex-1 lg:flex-none">
            <Button variant="outline" size="sm" className="w-full lg:w-auto h-8 sm:h-9 text-xs sm:text-sm">
              Details
            </Button>
          </Link>
          <Link href={`/apply/${program.id}`} className="flex-1 lg:flex-none">
            <Button size="sm" className="w-full lg:w-auto h-8 sm:h-9 text-xs sm:text-sm">
              Apply
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/5 via-background to-primary/5 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-primary/10">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Program Directory</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Explore <span className="font-semibold text-foreground">{totalCount}</span> programs across China
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
                <SlidersHorizontal className="h-4 w-4" />
                <span className="font-medium">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              {filtersExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent className="px-4 pb-4 border-t bg-background">
            <div className="pt-4 space-y-5">
              {/* Search - Inlined to prevent focus loss */}
              <FilterSection title="Search" icon={Search}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search programs by name..."
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
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </FilterSection>

              {/* Degree Level */}
              <FilterSection title="Degree Level" icon={GraduationCap}>
                <div className="space-y-2">
                  {DEGREE_LEVELS.map((degree) => (
                    <label
                      key={degree.value}
                      className="flex items-center gap-3 cursor-pointer py-1 hover:text-foreground transition-colors"
                    >
                      <Checkbox
                        checked={
                          degree.value === 'all' 
                            ? selectedDegrees.includes('all')
                            : !selectedDegrees.includes('all') && selectedDegrees.includes(degree.value)
                        }
                        onCheckedChange={() => toggleDegree(degree.value)}
                      />
                      <span className="text-sm">{degree.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* Language */}
              <FilterSection title="Language" icon={Languages}>
                <div className="space-y-2">
                  {LANGUAGES.map((language) => (
                    <label
                      key={language.value}
                      className="flex items-center gap-3 cursor-pointer py-1 hover:text-foreground transition-colors"
                    >
                      <Checkbox
                        checked={
                          language.value === 'all'
                            ? selectedLanguages.includes('all')
                            : !selectedLanguages.includes('all') && selectedLanguages.includes(language.value)
                        }
                        onCheckedChange={() => toggleLanguage(language.value)}
                      />
                      <span className="text-sm">{language.label}</span>
                    </label>
                  ))}
                </div>
              </FilterSection>

              {/* University */}
              <FilterSection title="University" icon={Building2}>
                <Select value={selectedUniversity} onValueChange={(v) => { setSelectedUniversity(v); setPage(1); }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Universities" />
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
              </FilterSection>

              {/* Clear Button */}
              {activeFiltersCount > 0 && (
                <Button variant="outline" onClick={clearAllFilters} className="w-full">
                  Clear All Filters ({activeFiltersCount})
                </Button>
              )}
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
              <div className="rounded-lg border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-semibold text-lg">Filters</h2>
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {activeFiltersCount} active
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-6">
                  {/* Search - Inlined to prevent focus loss */}
                  <FilterSection title="Search" icon={Search}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder="Search programs by name..."
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
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </FilterSection>

                  {/* Degree Level */}
                  <FilterSection title="Degree Level" icon={GraduationCap}>
                    <div className="space-y-2">
                      {DEGREE_LEVELS.map((degree) => (
                        <label
                          key={degree.value}
                          className="flex items-center gap-3 cursor-pointer py-1 hover:text-foreground transition-colors"
                        >
                          <Checkbox
                            checked={
                              degree.value === 'all' 
                                ? selectedDegrees.includes('all')
                                : !selectedDegrees.includes('all') && selectedDegrees.includes(degree.value)
                            }
                            onCheckedChange={() => toggleDegree(degree.value)}
                          />
                          <span className="text-sm">{degree.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* Language */}
                  <FilterSection title="Language" icon={Languages}>
                    <div className="space-y-2">
                      {LANGUAGES.map((language) => (
                        <label
                          key={language.value}
                          className="flex items-center gap-3 cursor-pointer py-1 hover:text-foreground transition-colors"
                        >
                          <Checkbox
                            checked={
                              language.value === 'all'
                                ? selectedLanguages.includes('all')
                                : !selectedLanguages.includes('all') && selectedLanguages.includes(language.value)
                            }
                            onCheckedChange={() => toggleLanguage(language.value)}
                          />
                          <span className="text-sm">{language.label}</span>
                        </label>
                      ))}
                    </div>
                  </FilterSection>

                  {/* University */}
                  <FilterSection title="University" icon={Building2}>
                    <Select value={selectedUniversity} onValueChange={(v) => { setSelectedUniversity(v); setPage(1); }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="All Universities" />
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
                  </FilterSection>

                  {/* Clear Button */}
                  {activeFiltersCount > 0 && (
                    <Button variant="outline" onClick={clearAllFilters} className="w-full">
                      Clear All Filters ({activeFiltersCount})
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Results Header */}
            <div className="mb-4">
              <p className="text-sm text-muted-foreground">
                {isLoading ? 'Loading...' : `Showing ${startItem}-${endItem} of ${totalCount} programs`}
              </p>
            </div>

            {/* Active Filter Tags */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: {searchQuery}
                    <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {!selectedDegrees.includes('all') && selectedDegrees.map(degree => (
                  <Badge key={degree} variant="secondary" className="gap-1">
                    {DEGREE_LEVELS.find(d => d.value === degree)?.label}
                    <button onClick={() => toggleDegree(degree)} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {!selectedLanguages.includes('all') && selectedLanguages.map(lang => (
                  <Badge key={lang} variant="secondary" className="gap-1">
                    {LANGUAGES.find(l => l.value === lang)?.label}
                    <button onClick={() => toggleLanguage(lang)} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedUniversity !== 'all' && (
                  <Badge variant="secondary" className="gap-1">
                    {universities.find(u => u.id === selectedUniversity)?.name_en}
                    <button onClick={() => setSelectedUniversity('all')} className="ml-1 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-6 px-2 text-xs">
                  Clear all
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-lg border">
                <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No programs found</h3>
                <p className="text-muted-foreground">Try adjusting your filters</p>
                <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <>
                {/* Program List */}
                <div className="space-y-3">
                  {programs.map((program) => (
                    <ProgramListItem key={program.id} program={program} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={page === pageNum ? 'default' : 'outline'}
                            size="sm"
                            className="w-8 h-8 p-0"
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
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

export default function ProgramsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </div>
    }>
      <ProgramsContent />
    </Suspense>
  );
}
