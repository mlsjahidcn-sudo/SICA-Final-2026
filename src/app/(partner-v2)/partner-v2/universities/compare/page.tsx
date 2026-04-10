'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  IconX,
  IconPlus,
  IconTrophy,
  IconUsers,
  IconCash,
  IconMapPin,
  IconSchool,
  IconSearch,
  IconArrowsDiff,
  IconStar,
} from '@tabler/icons-react';
import { Loader2 } from 'lucide-react';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  short_name: string | null;
  city: string;
  province: string;
  tags: string[];
  category: string | null;
  logo_url: string | null;
  ranking_national: number | null;
  ranking_international: number | null;
  student_count: number | null;
  international_student_count: number | null;
  faculty_count: number | null;
  teaching_languages: string[] | null;
  scholarship_available: boolean;
  scholarship_percentage: number | null;
  founded_year: number | null;
  tuition_min: number | null;
  tuition_max: number | null;
  tuition_currency: string | null;
  description: string | null;
}

export default function UniversityComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);

  // Search dialog state
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<University[]>([]);
  const [searching, setSearching] = useState(false);

  // Load initial IDs from URL params
  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      setSelectedIds(ids.split(',').filter(Boolean));
    }
  }, [searchParams]);

  // Fetch selected universities
  const fetchSelected = useCallback(async () => {
    if (selectedIds.length === 0) {
      setUniversities([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const res = await fetch(`/api/universities?limit=200`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const all = data.universities || data || [];
        const selected = all.filter((u: University) => selectedIds.includes(u.id));
        // Maintain order from selectedIds
        const ordered = selectedIds
          .map(id => selected.find((u: University) => u.id === id))
          .filter(Boolean) as University[];
        setUniversities(ordered);
      }
    } catch (err) {
      console.error('Failed to fetch universities:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedIds]);

  useEffect(() => {
    fetchSelected();
  }, [fetchSelected]);

  // Search universities for adding
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      const res = await fetch(`/api/universities?search=${encodeURIComponent(searchQuery)}&limit=10`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.universities || data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const addUniversity = (uni: University) => {
    if (selectedIds.length >= 4) return;
    if (selectedIds.includes(uni.id)) return;
    const newIds = [...selectedIds, uni.id];
    setSelectedIds(newIds);
    router.replace(`/partner-v2/universities/compare?ids=${newIds.join(',')}`);
    setShowSearchDialog(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeUniversity = (id: string) => {
    const newIds = selectedIds.filter(i => i !== id);
    setSelectedIds(newIds);
    if (newIds.length > 0) {
      router.replace(`/partner-v2/universities/compare?ids=${newIds.join(',')}`);
    } else {
      router.replace('/partner-v2/universities/compare');
    }
  };

  const formatNumber = (n: number | null) => (n != null ? n.toLocaleString() : '—');
  const formatCurrency = (min: number | null, max: number | null, currency: string | null) => {
    if (min == null && max == null) return '—';
    const cur = currency || 'CNY';
    const symbol = cur === 'USD' ? '$' : '¥';
    if (min != null && max != null && min !== max) {
      return `${symbol}${min.toLocaleString()} - ${symbol}${max.toLocaleString()}`;
    }
    return `${symbol}${(min || max)!.toLocaleString()}`;
  };

  // Comparison rows definition
  const comparisonRows = [
    { label: 'Location', render: (u: University) => `${u.city}, ${u.province}`, icon: <IconMapPin className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Category', render: (u: University) => u.category ? u.category.charAt(0).toUpperCase() + u.category.slice(1) : '—', icon: <IconSchool className="h-4 w-4 text-muted-foreground" /> },
    { label: 'National Ranking', render: (u: University) => u.ranking_national ? `#${u.ranking_national}` : '—', icon: <IconTrophy className="h-4 w-4 text-muted-foreground" />, highlight: 'lowest' },
    { label: 'International Ranking', render: (u: University) => u.ranking_international ? `#${u.ranking_international}` : '—', icon: <IconTrophy className="h-4 w-4 text-muted-foreground" />, highlight: 'lowest' },
    { label: 'Founded', render: (u: University) => u.founded_year?.toString() || '—', icon: <IconSchool className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Total Students', render: (u: University) => formatNumber(u.student_count), icon: <IconUsers className="h-4 w-4 text-muted-foreground" />, highlight: 'highest' },
    { label: 'Intl. Students', render: (u: University) => formatNumber(u.international_student_count), icon: <IconUsers className="h-4 w-4 text-muted-foreground" />, highlight: 'highest' },
    { label: 'Faculty', render: (u: University) => formatNumber(u.faculty_count), icon: <IconUsers className="h-4 w-4 text-muted-foreground" />, highlight: 'highest' },
    { label: 'Tuition', render: (u: University) => formatCurrency(u.tuition_min, u.tuition_max, u.tuition_currency), icon: <IconCash className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Scholarship', render: (u: University) => u.scholarship_available ? (u.scholarship_percentage ? `${u.scholarship_percentage}%` : 'Available') : 'Not Available', icon: <IconStar className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Languages', render: (u: University) => u.teaching_languages?.join(', ') || '—', icon: <IconSchool className="h-4 w-4 text-muted-foreground" /> },
    { label: 'Tags', render: (u: University) => u.tags?.length ? u.tags.join(', ') : '—', icon: <IconSchool className="h-4 w-4 text-muted-foreground" /> },
  ];

  // Helper to determine best value for highlighting
  const getBestIndex = (row: typeof comparisonRows[0]): number | null => {
    if (!row.highlight || universities.length < 2) return null;
    const values = universities.map(u => row.render(u));
    const numericValues = values.map(v => {
      const match = v.match(/[\d,]+/);
      return match ? parseInt(match[0].replace(/,/g, ''), 10) : null;
    });
    const validIndices = numericValues
      .map((v, i) => (v !== null ? i : -1))
      .filter(i => i >= 0);
    if (validIndices.length === 0) return null;

    if (row.highlight === 'lowest') {
      return validIndices.reduce((best, i) =>
        (numericValues[i] ?? Infinity) < (numericValues[best] ?? Infinity) ? i : best
      );
    }
    return validIndices.reduce((best, i) =>
      (numericValues[i] ?? 0) > (numericValues[best] ?? 0) ? i : best
    );
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <IconArrowsDiff className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Compare Universities</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Side-by-side comparison of up to 4 universities
          </p>
        </div>
        <Button
          onClick={() => setShowSearchDialog(true)}
          disabled={selectedIds.length >= 4}
        >
          <IconPlus className="h-4 w-4 mr-2" />
          Add University ({selectedIds.length}/4)
        </Button>
      </div>

      {/* Empty State */}
      {!loading && universities.length === 0 && (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <IconArrowsDiff className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No universities selected</p>
              <p className="text-muted-foreground/70 text-sm mt-1">
                Add universities to start comparing
              </p>
              <Button className="mt-4" onClick={() => setShowSearchDialog(true)}>
                <IconPlus className="h-4 w-4 mr-2" /> Add University
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Comparison Table */}
      {!loading && universities.length > 0 && (
        <>
          {/* University Header Cards */}
          <div className={`grid gap-4 ${universities.length === 1 ? 'grid-cols-1' : universities.length === 2 ? 'grid-cols-2' : universities.length === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
            {universities.map((uni) => (
              <Card key={uni.id} className="relative">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => removeUniversity(uni.id)}
                >
                  <IconX className="h-4 w-4" />
                </Button>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    {uni.logo_url && (
                      <Image
                        src={uni.logo_url}
                        alt={uni.name_en}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded object-contain"
                      />
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-sm truncate">{uni.name_en}</CardTitle>
                      {uni.name_cn && (
                        <CardDescription className="text-xs truncate">{uni.name_cn}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                    <IconMapPin className="h-3 w-3" />
                    {uni.city}, {uni.province}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {uni.tags?.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Comparison Rows */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px] sticky left-0 bg-card z-10">Attribute</TableHead>
                    {universities.map((uni) => (
                      <TableHead key={uni.id} className="text-center min-w-[160px]">
                        {uni.short_name || uni.name_en}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {comparisonRows.map((row) => {
                    const bestIdx = getBestIndex(row);
                    return (
                      <TableRow key={row.label}>
                        <TableCell className="font-medium sticky left-0 bg-card z-10">
                          <div className="flex items-center gap-2">
                            {row.icon}
                            {row.label}
                          </div>
                        </TableCell>
                        {universities.map((uni, idx) => (
                          <TableCell
                            key={uni.id}
                            className={`text-center ${bestIdx === idx ? 'bg-primary/5 font-medium' : ''}`}
                          >
                            {row.render(uni)}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Action */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => router.push('/partner-v2/universities')}>
              Back to Universities
            </Button>
          </div>
        </>
      )}

      {/* Search Dialog */}
      <Dialog open={showSearchDialog} onOpenChange={setShowSearchDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add University to Compare</DialogTitle>
            <DialogDescription>Search for a university to add (max 4)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSearch className="h-4 w-4" />}
              </Button>
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {searchResults.length === 0 && searchQuery && !searching && (
                <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
              )}
              {searchResults.map((uni) => {
                const alreadyAdded = selectedIds.includes(uni.id);
                return (
                  <Card
                    key={uni.id}
                    className={`cursor-pointer transition-colors ${alreadyAdded ? 'opacity-50' : 'hover:bg-muted/50'}`}
                    onClick={() => !alreadyAdded && addUniversity(uni)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{uni.name_en}</p>
                          <p className="text-xs text-muted-foreground">
                            {uni.city}, {uni.province}
                            {uni.ranking_national ? ` • #${uni.ranking_national} National` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {alreadyAdded ? (
                            <Badge variant="secondary" className="text-xs">Added</Badge>
                          ) : (
                            <IconPlus className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
