'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, ArrowLeft, Plus, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { getValidToken } from '@/lib/auth-token';

interface StudentOption {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  nationality: string | null;
}

interface ProgramOption {
  id: string;
  name: string;
  degree_level: string | null;
  university_id: string | null;
  university_name: string | null;
  tuition_fee_per_year: number | null;
  currency: string | null;
  duration_years: number | null;
}

function NewApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [universities, setUniversities] = useState<{ id: string; name_en: string }[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingPrograms, setLoadingPrograms] = useState(true);
  const [studentSearch, setStudentSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [degreeFilter, setDegreeFilter] = useState('');

  const [formData, setFormData] = useState({
    student_id: preselectedStudentId || '',
    program_ids: [] as string[],
    intake_semester: '',
    intake_year: '',
    priority: '0',
    notes: '',
  });

  const fetchStudents = useCallback(async (search: string = '') => {
    try {
      const token = await getValidToken();
      const params = new URLSearchParams({ limit: '50' });
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/individual-students?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const studentList = data.students || [];
        setStudents(
          studentList.map((s: any) => ({
            id: s.id,
            user_id: s.user_id,
            full_name: s.full_name,
            email: s.email,
            nationality: s.nationality,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const fetchPrograms = useCallback(async () => {
    try {
      const token = await getValidToken();
      const params = new URLSearchParams({ limit: '100' });

      const response = await fetch(`/api/programs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const programList = data.programs || [];

        // Fetch universities for program display
        const uniIds = [...new Set(programList.map((p: any) => p.university_id).filter(Boolean))];
        if (uniIds.length > 0) {
          const uniResponse = await fetch(`/api/universities?limit=100`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (uniResponse.ok) {
            const uniData = await uniResponse.json();
            setUniversities((uniData.universities || []).map((u: any) => ({ id: u.id, name_en: u.name_en })));
          }
        }

        setPrograms(
          programList.map((p: any) => ({
            id: p.id,
            name: p.name,
            degree_level: p.degree_level,
            university_id: p.university_id,
            university_name: null,
            tuition_fee_per_year: p.tuition_fee_per_year,
            currency: p.currency,
            duration_years: p.duration_years,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
    } finally {
      setLoadingPrograms(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchPrograms();
  }, [fetchStudents, fetchPrograms]);

  // Debounced student search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(studentSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [studentSearch, fetchStudents]);

  const universityMap = new Map(universities.map((u) => [u.id, u.name_en]));

  const filteredPrograms = programs.filter((p) => {
    if (universityFilter && p.university_id !== universityFilter) return false;
    if (degreeFilter && p.degree_level?.toLowerCase() !== degreeFilter.toLowerCase()) return false;
    if (programSearch) {
      const searchLower = programSearch.toLowerCase();
      const uniName = p.university_id ? universityMap.get(p.university_id) || '' : '';
      return (
        p.name.toLowerCase().includes(searchLower) ||
        uniName.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const selectedPrograms = programs.filter((p) => formData.program_ids.includes(p.id));

  const toggleProgram = (programId: string) => {
    setFormData((prev) => ({
      ...prev,
      program_ids: prev.program_ids.includes(programId)
        ? prev.program_ids.filter((id) => id !== programId)
        : [...prev.program_ids, programId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.student_id) {
      toast.error('Please select a student');
      return;
    }

    if (formData.program_ids.length === 0) {
      toast.error('Please select at least one program');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = await getValidToken();

      const response = await fetch('/api/admin/individual-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: formData.student_id,
          program_ids: formData.program_ids,
          intake_semester: formData.intake_semester || null,
          intake_year: formData.intake_year || null,
          priority: parseInt(formData.priority) || 0,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Application(s) created successfully');
        router.push('/admin/v2/individual-applications');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create application');
      }
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error('Failed to create application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === formData.student_id);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/admin/v2/individual-applications">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Individual Application</h1>
          <p className="text-muted-foreground">
            Create an application for a self-registered student
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Student</CardTitle>
            <CardDescription>Select the individual student for this application</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="pl-9"
                />
              </div>
            </div>
            {loadingStudents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto border rounded-md">
                {students.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No individual students found
                  </div>
                ) : (
                  students.map((student) => (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, student_id: student.id }))
                      }
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-accent transition-colors ${
                        formData.student_id === student.id
                          ? 'bg-accent border-l-4 border-l-primary'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{student.full_name}</div>
                          <div className="text-sm text-muted-foreground">{student.email}</div>
                        </div>
                        {student.nationality && (
                          <Badge variant="outline">{student.nationality}</Badge>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
            {selectedStudent && (
              <div className="rounded-md border bg-muted/50 p-3">
                <div className="text-sm font-medium">Selected: {selectedStudent.full_name}</div>
                <div className="text-sm text-muted-foreground">{selectedStudent.email}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Program Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Programs</CardTitle>
            <CardDescription>
              Select one or more programs to apply for
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search Programs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={programSearch}
                    onChange={(e) => setProgramSearch(e.target.value)}
                    placeholder="Search by name or university..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>University</Label>
                <Select value={universityFilter} onValueChange={(v) => setUniversityFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Universities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Universities</SelectItem>
                    {universities.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Degree Level</Label>
                <Select value={degreeFilter} onValueChange={(v) => setDegreeFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Bachelor">Bachelor</SelectItem>
                    <SelectItem value="Master">Master</SelectItem>
                    <SelectItem value="PhD">PhD</SelectItem>
                    <SelectItem value="Language">Language</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Program List */}
            {loadingPrograms ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto border rounded-md">
                {filteredPrograms.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No programs found matching your filters
                  </div>
                ) : (
                  filteredPrograms.map((program) => (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => toggleProgram(program.id)}
                      className={`w-full text-left px-4 py-3 border-b last:border-b-0 hover:bg-accent transition-colors ${
                        formData.program_ids.includes(program.id)
                          ? 'bg-accent border-l-4 border-l-primary'
                          : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{program.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {program.university_id
                              ? universityMap.get(program.university_id) || 'Unknown University'
                              : 'Unknown University'}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {program.degree_level && (
                            <Badge variant="outline">{program.degree_level}</Badge>
                          )}
                          {program.tuition_fee_per_year && (
                            <span className="text-xs text-muted-foreground">
                              {program.currency || 'CNY'} {program.tuition_fee_per_year.toLocaleString()}/yr
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* Selected Programs */}
            {selectedPrograms.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Programs ({selectedPrograms.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedPrograms.map((program) => (
                    <Badge key={program.id} variant="secondary" className="gap-1 pr-1">
                      {program.name}
                      {program.degree_level && ` (${program.degree_level})`}
                      <button
                        type="button"
                        onClick={() => toggleProgram(program.id)}
                        className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Application Details */}
        <Card>
          <CardHeader>
            <CardTitle>Application Details</CardTitle>
            <CardDescription>Intake and additional information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="intake_semester">Intake Semester</Label>
                <Select
                  value={formData.intake_semester}
                  onValueChange={(value) =>
                    setFormData({ ...formData, intake_semester: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Fall">Fall</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake_year">Intake Year</Label>
                <Input
                  id="intake_year"
                  type="number"
                  min="2024"
                  max="2035"
                  value={formData.intake_year}
                  onChange={(e) =>
                    setFormData({ ...formData, intake_year: e.target.value })
                  }
                  placeholder="e.g., 2026"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Normal</SelectItem>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this application..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Card className="border-t-4 border-t-primary">
          <CardContent className="pt-6">
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/v2/individual-applications">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.student_id || formData.program_ids.length === 0}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Plus className="mr-2 h-4 w-4" />
                Create Application{formData.program_ids.length > 1 ? 's' : ''}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

export default function NewApplicationPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader title="New Individual Application" />
          <Suspense
            fallback={
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            }
          >
            <NewApplicationContent />
          </Suspense>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
