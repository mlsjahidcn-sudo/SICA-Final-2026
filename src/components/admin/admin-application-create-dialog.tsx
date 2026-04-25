'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Loader2,
  Search,
  GraduationCap,
  Building2,
  Calendar,
  Star,
  X,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';

interface StudentOption {
  id: string;
  full_name: string;
  email: string;
  referred_by_partner?: string;
}

interface ProgramOption {
  id: string;
  name: string;
  degree_level: string;
  university_name: string | null;
}

interface PartnerOption {
  id: string;
  full_name: string;
  company_name?: string;
}

interface AdminApplicationCreateDialogProps {
  trigger?: React.ReactNode;
  onCreateComplete: () => void;
}

export function AdminApplicationCreateDialog({ trigger, onCreateComplete }: AdminApplicationCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'student' | 'programs' | 'details'>('student');
  
  // Data
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  
  // Selection
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  
  // Details
  const [intakeYear, setIntakeYear] = useState('');
  const [intakeSemester, setIntakeSemester] = useState('');
  const [priority, setPriority] = useState('0');
  const [notes, setNotes] = useState('');

  // Search
  const [studentSearch, setStudentSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');

  // Fetch data on open
  useEffect(() => {
    if (open) {
      fetchStudents();
      fetchPrograms();
      fetchPartners();
      resetForm();
    }
  }, [open]);

  const fetchStudents = async () => {
    try {
      const token = await getValidToken();
      const res = await fetch('/api/admin/partner-students?limit=200', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(
          data.students.map((s: Record<string, unknown>) => ({
            id: s.id as string,
            full_name: s.full_name as string,
            email: s.email as string,
          }))
        );
      }
    } catch (e) {
      console.error('Error fetching students:', e);
    }
  };

  const fetchPrograms = async () => {
    try {
      const token = await getValidToken();
      const res = await fetch('/api/admin/programs?limit=100', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPrograms(data.programs || []);
      } else {
        // Fallback - use a simpler query
        const res2 = await fetch('/api/programs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res2.ok) {
          const data = await res2.json();
          setPrograms(Array.isArray(data) ? data : data.programs || []);
        }
      }
    } catch (e) {
      console.error('Error fetching programs:', e);
    }
  };

  const fetchPartners = async () => {
    try {
      const token = await getValidToken();
      const res = await fetch('/api/admin/partners?limit=100&status=approved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPartners(data.partners || []);
      }
    } catch (e) {
      console.error('Error fetching partners:', e);
    }
  };

  const resetForm = () => {
    setStep('student');
    setSelectedStudentId('');
    setSelectedProgramIds([]);
    setSelectedPartnerId('');
    setIntakeYear('');
    setIntakeSemester('');
    setPriority('0');
    setNotes('');
    setStudentSearch('');
    setProgramSearch('');
  };

  const filteredStudents = students.filter(
    (s) =>
      !studentSearch ||
      s.full_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase())
  );

  const filteredPrograms = programs.filter(
    (p) =>
      !programSearch ||
      p.name?.toLowerCase().includes(programSearch.toLowerCase()) ||
      p.university_name?.toLowerCase().includes(programSearch.toLowerCase())
  );

  const toggleProgramSelection = (programId: string) => {
    setSelectedProgramIds((prev) =>
      prev.includes(programId) ? prev.filter((id) => id !== programId) : [...prev, programId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const response = await fetch('/api/admin/partner-applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: selectedStudentId,
          program_ids: selectedProgramIds,
          partner_id: selectedPartnerId || undefined,
          intake_semester: intakeSemester || undefined,
          intake_year: intakeYear || undefined,
          priority: parseInt(priority) || 0,
          notes: notes.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message || 'Application(s) created successfully');
        setOpen(false);
        onCreateComplete();
      } else {
        toast.error(result.error || 'Failed to create application');
      }
    } catch (error) {
      console.error('Error creating application:', error);
      toast.error('Failed to create application');
    } finally {
      setLoading(false);
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <FileText className="mr-2 h-4 w-4" />
            Add Application
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Create New Application
          </DialogTitle>
          <DialogDescription>
            Add a new application for a partner-referred student. Select the student, choose programs, and configure details.
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-4">
          {(['student', 'programs', 'details'] as const).map((s, idx) => (
            <button
              key={s}
              onClick={() => {
                if ((s === 'programs' && selectedStudentId) || (s === 'details' && selectedProgramIds.length > 0)) {
                  setStep(s);
                }
              }}
              disabled={
                (s === 'programs' && !selectedStudentId) ||
                (s === 'details' && selectedProgramIds.length === 0)
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : (s === 'student' && selectedStudentId) ||
                    (s === 'programs' && selectedProgramIds.length > 0) ||
                    (s === 'details')
                  ? 'bg-muted text-foreground hover:bg-muted/80 cursor-pointer'
                  : 'text-muted-foreground cursor-not-allowed'
              }`}
            >
              <span className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                (s === 'student' && selectedStudentId) ||
                (s === 'programs' && selectedProgramIds.length > 0)
                  ? 'bg-emerald-500 text-white'
                  : 'border border-current'
              }`}>
                {(s === 'student' && selectedStudentId) ||
                 (s === 'programs' && selectedProgramIds.length > 0)
                  ? '\u2713'
                  : idx + 1}
              </span>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Step 1: Select Student */}
        {step === 'student' && (
          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[280px] overflow-y-auto space-y-1 border rounded-lg divide-y">
              {filteredStudents.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentId(s.id)}
                  className={`w-full px-3 py-2.5 text-left hover:bg-muted transition-colors flex items-center justify-between ${
                    selectedStudentId === s.id ? 'bg-blue-50 dark:bg-blue-950/30' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium text-sm">{s.full_name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>
                  {selectedStudentId === s.id && (
                    <Badge variant="default" className="shrink-0 text-xs">Selected</Badge>
                  )}
                </button>
              ))}
              {filteredStudents.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No students found</div>
              )}
            </div>
            {selectedStudentId && (
              <Button className="w-full" onClick={() => setStep('programs')}>
                Continue to Select Programs &rarr;
              </Button>
            )}
          </div>
        )}

        {/* Step 2: Select Programs */}
        {step === 'programs' && (
          <div className="space-y-4 py-2">
            {/* Selected Student Summary */}
            {selectedStudent && (
              <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                  {selectedStudent.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{selectedStudent.full_name}</p>
                  <p className="text-xs text-muted-foreground">{selectedStudent.email}</p>
                </div>
                <Button size="sm" variant="ghost" className="shrink-0 h-7" onClick={() => setStep('student')}>
                  Change
                </Button>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs or universities..."
                value={programSearch}
                onChange={(e) => setProgramSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-[240px] overflow-y-auto space-y-1.5 border rounded-lg p-2">
              {filteredPrograms.map((p) => (
                <button
                  key={p.id}
                  onClick={() => toggleProgramSelection(p.id)}
                  className={`w-full p-3 rounded-md border transition-all text-left ${
                    selectedProgramIds.includes(p.id)
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-sm leading-tight">{p.name || 'Unnamed Program'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground truncate">{p.university_name || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                      <Badge variant="outline" className="text-[10px] font-normal">
                        {p.degree_level || 'N/A'}
                      </Badge>
                      {selectedProgramIds.includes(p.id) && (
                        <Badge className="bg-emerald-500 text-white text-[10px]">\u2713</Badge>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              {filteredPrograms.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">No programs found</div>
              )}
            </div>

            {selectedProgramIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground self-center">Selected:</span>
                {selectedProgramIds.map((pid) => {
                  const prog = programs.find((p) => p.id === pid);
                  return (
                    <Badge
                      key={pid}
                      variant="secondary"
                      className="cursor-pointer gap-1"
                      onClick={() => toggleProgramSelection(pid)}
                    >
                      {prog?.name || pid}
                      <X className="h-3 w-3" />
                    </Badge>
                  );
                })}
              </div>
            )}

            {selectedProgramIds.length > 0 && (
              <Button className="w-full" onClick={() => setStep('details')}>
                Continue to Details &rarr;
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Additional Details */}
        {step === 'details' && (
          <form className="space-y-4 py-2" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
            {/* Selected Items Summary */}
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{selectedStudent?.full_name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">{selectedProgramIds.length} program(s)</Badge>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedProgramIds.map((pid) => {
                  const prog = programs.find((p) => p.id === pid);
                  return (
                    <Badge key={pid} variant="outline" className="text-[10px]">
                      {prog?.name || pid}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {/* Optional Partner Override */}
            <div className="grid gap-2">
              <Label>Override Partner Assignment</Label>
              <Select value={selectedPartnerId} onValueChange={setSelectedPartnerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Use student's default partner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use student's default partner</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.company_name || p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Intake Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="intake_year">Intake Year</Label>
                <Input
                  id="intake_year"
                  placeholder="2026"
                  value={intakeYear}
                  onChange={(e) => setIntakeYear(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="intake_semester">Semester</Label>
                <Select value={intakeSemester} onValueChange={setIntakeSemester}>
                  <SelectTrigger id="intake_semester">
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fall">Fall</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                    <SelectItem value="summer">Summer</SelectItem>
                    <SelectItem value="winter">Winter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="grid gap-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Normal (0)</SelectItem>
                  <SelectItem value="1">Medium (1)</SelectItem>
                  <SelectItem value="2">High (2)</SelectItem>
                  <SelectItem value="3">Urgent (3)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <textarea
                id="notes"
                className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                placeholder="Optional internal notes about this application..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" onClick={() => setStep('programs')} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading || !selectedStudentId || selectedProgramIds.length === 0}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Create Application{selectedProgramIds.length > 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Simple User icon for the dialog
function UserIcon({ className }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
