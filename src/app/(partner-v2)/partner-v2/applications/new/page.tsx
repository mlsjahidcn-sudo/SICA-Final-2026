/**
 * New Application - Student Selection Page
 * Route: /partner-v2/applications/new
 * Landing page for creating a new application - redirects to student-specific apply page
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  GraduationCap,
  Plus,
  Loader2,
  User,
  Search,
  X,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';

interface StudentInfo {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  nationality: string | null;
  is_active: boolean;
}

export default function NewApplicationPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentInfo | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    async function fetchStudents() {
      try {
        const token = await getValidToken();
        const res = await fetch('/api/partner/students?pageSize=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const result = await res.json();
          setStudents(result.students || []);
        }
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((student) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const searchable = [
      student.full_name,
      student.email,
      student.nationality,
    ].filter(Boolean).map(String).join(' ').toLowerCase();
    return searchable.includes(query);
  });

  const handleStudentSelect = (student: StudentInfo) => {
    setSelectedStudent(student);
    setShowConfirmDialog(true);
  };

  const proceedToApply = () => {
    if (selectedStudent) {
      router.push(`/partner-v2/students/${selectedStudent.id}/apply`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-3" />
        <span className="text-muted-foreground">Loading students...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 mb-4">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Start New Application</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Select a student to create a new university application. Each application is tied to a specific student.
        </p>
      </div>

      {/* Search */}
      {students.length > 0 && (
        <div className="relative max-w-md mx-auto w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Students List */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <User className="h-12 w-12 text-muted-foreground/40 mx-auto" />
            <h3 className="font-semibold text-foreground">No students found</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              You need to add students before creating applications. Students can be added through the Students section.
            </p>
            <Button asChild>
              <Link href="/partner-v2/students/new">
                <Plus className="h-4 w-4 mr-2" />
                Add First Student
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No students match your search.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => handleStudentSelect(student)}
              className="text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:shadow-md hover:bg-primary/5 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {student.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {student.full_name || 'Unnamed Student'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {student.email || 'No email provided'}
                  </p>
                  {student.nationality && (
                    <p className="text-[11px] text-muted-foreground/70 mt-1">
                      {student.nationality}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t">
        <p className="text-sm text-muted-foreground">Need to add a new student?</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/partner-v2/students/new">
            <Plus className="h-4 w-4 mr-2" />
            Add New Student
          </Link>
        </Button>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/partner-v2/students">
            View All Students
          </Link>
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Confirm Selection
            </DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">
                    {selectedStudent.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'ST'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {selectedStudent.full_name || 'Unnamed Student'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedStudent.email || 'No email'}
                  </p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                You're about to start a new application for this student. You'll be able to select programs and universities in the next step.
              </p>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 gap-1"
                  onClick={proceedToApply}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
