'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  IconArrowLeft,
  IconSchool,
  IconSearch,
  IconLoader2,
  IconCheck,
  IconChevronDown,
  IconX,
  IconUser,
  IconFileText,
  IconDeviceFloppy,
  IconBuilding,
  IconMapPin,
  IconSend,
} from '@tabler/icons-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Program {
  id: string;
  name: string;
  name_en?: string;
  degree_level: string;
  universities: {
    id: string;
    name_en?: string;
    name_cn?: string | null;
    city: string;
    logo_url?: string | null;
  };
}

interface Application {
  id: string;
  status: string;
  notes: string;
  priority: number;
  program_id: string;
  student_id: string;
  profile_snapshot: Record<string, string> | null;
  programs: {
    id: string;
    name: string;
    degree_level: string;
    universities: {
      id: string;
      name_en?: string;
      city: string;
      logo_url?: string | null;
    };
  };
  students: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    nationality: string;
    users?: { full_name: string; email: string } | { full_name: string; email: string }[];
  };
}

const PRIORITY_OPTIONS = [
  { value: '0', label: 'Normal' },
  { value: '1', label: 'Low' },
  { value: '2', label: 'High' },
  { value: '3', label: 'Urgent' },
];

export default function EditApplicationPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const appId = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Editable fields
  const [selectedProgramId, setSelectedProgramId] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('0');
  const [personalStatement, setPersonalStatement] = useState('');
  const [studyPlan, setStudyPlan] = useState('');

  // Program search
  const [programs, setPrograms] = useState<Program[]>([]);
  const [programSearch, setProgramSearch] = useState('');
  const [programPopoverOpen, setProgramPopoverOpen] = useState(false);
  const [isLoadingPrograms, setIsLoadingPrograms] = useState(false);
  const [degreeFilter, setDegreeFilter] = useState('all');

  // Fetch application data
  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const res = await fetch(`/api/applications/${appId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const app = data.application;
        setApplication(app);
        // Pre-populate form
        setSelectedProgramId(app.program_id || '');
        setNotes(app.notes || '');
        setPriority(String(app.priority ?? 0));
        if (app.profile_snapshot) {
          setPersonalStatement(app.profile_snapshot.personal_statement || '');
          setStudyPlan(app.profile_snapshot.study_plan || '');
        }
      } else {
        toast.error('Application not found');
        router.push('/partner-v2/applications');
      }
    } catch {
      toast.error('Failed to load application');
    } finally {
      setIsLoading(false);
    }
  }, [appId, router]);

  // Fetch programs
  useEffect(() => {
    const fetchPrograms = async () => {
      setIsLoadingPrograms(true);
      try {
        const { getValidToken } = await import('@/lib/auth-token');
        const token = await getValidToken();
        const res = await fetch('/api/programs?limit=500', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const normalized = (data.programs || []).map((p: Program) => {
            const uni = Array.isArray(p.universities) ? p.universities[0] : p.universities;
            return { ...p, universities: uni };
          });
          setPrograms(normalized);
        }
      } catch {
        // Non-critical
      } finally {
        setIsLoadingPrograms(false);
      }
    };
    fetchPrograms();
  }, []);

  useEffect(() => {
    if (user?.role === 'partner') {
      fetchApplication();
    }
  }, [user, fetchApplication]);

  const handleSave = async () => {
    if (!application) return;
    setIsSaving(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const body: Record<string, unknown> = {
        notes,
        priority: parseInt(priority, 10),
        personal_statement: personalStatement,
        study_plan: studyPlan,
      };

      if (selectedProgramId && selectedProgramId !== application.program_id) {
        body.program_id = selectedProgramId;
      }

      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success('Application saved');
        router.push(`/partner-v2/applications/${application.id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to save');
      }
    } catch {
      toast.error('Failed to save application');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!application) return;
    setIsSubmitting(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        toast.success('Application submitted');
        router.push('/partner-v2/applications');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to submit');
      }
    } catch {
      toast.error('Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStudentName = () => {
    if (!application) return '';
    const u = Array.isArray(application.students.users) ? application.students.users[0] : application.students.users;
    return u?.full_name || `${application.students.first_name || ''} ${application.students.last_name || ''}`.trim() || 'Unknown Student';
  };

  const getSelectedProgram = () => {
    if (!selectedProgramId) return null;
    return programs.find(p => p.id === selectedProgramId);
  };

  const filteredPrograms = programs.filter(p => {
    const matchSearch = !programSearch ||
      p.name.toLowerCase().includes(programSearch.toLowerCase()) ||
      p.universities?.name_en?.toLowerCase().includes(programSearch.toLowerCase());
    const matchDegree = degreeFilter === 'all' || p.degree_level === degreeFilter;
    return matchSearch && matchDegree;
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!application) return null;

  const isDraft = application.status === 'draft';
  const isEditable = !['accepted', 'rejected', 'withdrawn'].includes(application.status);

  return (
    <div className="flex flex-col gap-6 px-4 py-4 md:py-6 lg:px-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/partner-v2/applications/${appId}`}>
            <IconArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Edit Application</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {getStudentName()} &middot; <span className="capitalize">{application.status.replace('_', ' ')}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving || !isEditable}>
            {isSaving ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconDeviceFloppy className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
          {isEditable && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconSend className="h-4 w-4 mr-2" />}
              Submit
            </Button>
          )}
        </div>
      </div>

      {/* Student Info (read-only) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconUser className="h-4 w-4" />
            Student
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <IconUser className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{getStudentName()}</p>
              <p className="text-sm text-muted-foreground">{application.students.email}</p>
              {application.students.nationality && (
                <Badge variant="secondary" className="mt-1">{application.students.nationality}</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Program Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconSchool className="h-4 w-4" />
            Program & University
          </CardTitle>
          <CardDescription>Select the program the student is applying to</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current/Selected Program Display */}
          {selectedProgramId && (
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              {(() => {
                const prog = getSelectedProgram();
                const uni = prog?.universities;
                return (
                  <>
                    {uni?.logo_url ? (
                      <Avatar className="h-10 w-10 rounded-lg border">
                        <AvatarImage src={uni.logo_url} alt="" className="object-contain p-1" />
                        <AvatarFallback className="rounded-lg"><IconBuilding className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border">
                        <IconBuilding className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{prog?.name || 'Unknown Program'}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <IconMapPin className="h-3 w-3" />
                        {uni?.name_en || 'Unknown University'} &middot; {uni?.city}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">{prog?.degree_level}</Badge>
                    {isDraft && (
                      <Button variant="ghost" size="icon-sm" onClick={() => setSelectedProgramId('')}>
                        <IconX className="h-4 w-4" />
                      </Button>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {isEditable && (
            <>
              {/* Degree Filter */}
              <div className="flex gap-2">
                <Select value={degreeFilter} onValueChange={setDegreeFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Degree" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Degrees</SelectItem>
                    <SelectItem value="bachelor">Bachelor</SelectItem>
                    <SelectItem value="master">Master</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                    <SelectItem value="language">Language</SelectItem>
                  </SelectContent>
                </Select>

                {/* Program Combobox */}
                <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start">
                      <IconSearch className="h-4 w-4 mr-2 text-muted-foreground" />
                      Search programs...
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search by program or university name..."
                        value={programSearch}
                        onValueChange={setProgramSearch}
                      />
                      <CommandList>
                        <CommandEmpty>{isLoadingPrograms ? 'Loading...' : 'No programs found'}</CommandEmpty>
                        <CommandGroup>
                          {filteredPrograms.slice(0, 50).map((prog) => (
                            <CommandItem
                              key={prog.id}
                              value={`${prog.name} ${prog.universities?.name_en || ''}`}
                              onSelect={() => {
                                setSelectedProgramId(prog.id);
                                setProgramPopoverOpen(false);
                                setProgramSearch('');
                              }}
                            >
                              <div className="flex items-center gap-2 w-full">
                                {prog.universities?.logo_url ? (
                                  <Avatar className="h-7 w-7 rounded border">
                                    <AvatarImage src={prog.universities.logo_url} alt="" className="object-contain p-0.5" />
                                    <AvatarFallback className="rounded text-[8px]"><IconBuilding className="h-3 w-3" /></AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center">
                                    <IconBuilding className="h-3.5 w-3.5 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">{prog.name}</p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {prog.universities?.name_en} &middot; {prog.universities?.city}
                                  </p>
                                </div>
                                <Badge variant="secondary" className="shrink-0 text-[10px]">{prog.degree_level}</Badge>
                                {selectedProgramId === prog.id && <IconCheck className="h-4 w-4 text-primary shrink-0" />}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Personal Statement & Study Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <IconFileText className="h-4 w-4" />
            Personal Statement & Study Plan
          </CardTitle>
          <CardDescription>Help the student stand out with a strong application</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Personal Statement</Label>
            <Textarea
              value={personalStatement}
              onChange={(e) => setPersonalStatement(e.target.value)}
              placeholder="Write a compelling personal statement highlighting the student's goals, achievements, and motivation for studying in China..."
              rows={6}
              disabled={!isEditable}
            />
            <p className="text-xs text-muted-foreground">{personalStatement.length} characters</p>
          </div>
          <Separator />
          <div className="space-y-2">
            <Label>Study Plan</Label>
            <Textarea
              value={studyPlan}
              onChange={(e) => setStudyPlan(e.target.value)}
              placeholder="Outline the student's planned course of study, research interests, and academic objectives..."
              rows={6}
              disabled={!isEditable}
            />
            <p className="text-xs text-muted-foreground">{studyPlan.length} characters</p>
          </div>
        </CardContent>
      </Card>

      {/* Notes & Priority */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes & Priority</CardTitle>
          <CardDescription>Internal tracking for your team</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority} disabled={!isEditable}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        'h-2 w-2 rounded-full',
                        opt.value === '3' ? 'bg-red-500' :
                        opt.value === '2' ? 'bg-amber-500' :
                        opt.value === '1' ? 'bg-muted-foreground' :
                        'bg-primary'
                      )} />
                      {opt.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Internal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this application (visible only to your team)..."
              rows={4}
              disabled={!isEditable}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex items-center justify-between pb-6">
        <Button variant="ghost" asChild>
          <Link href={`/partner-v2/applications/${appId}`}>Cancel</Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving || !isEditable}>
            {isSaving ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconDeviceFloppy className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
          {isDraft && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? <IconLoader2 className="h-4 w-4 mr-2 animate-spin" /> : <IconSend className="h-4 w-4 mr-2" />}
              Submit Application
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
