'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentForm } from '../../components/student-form';
import type { StudentFormData } from '../../lib/types';
import { studentDetailToFormData } from '../../lib/student-utils';
import { getValidToken } from '@/lib/auth-token';

function EditStudentContent() {
  const params = useParams();
  const studentId = params.id as string;

  const [initialData, setInitialData] = useState<Partial<StudentFormData> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudentData() {
      try {
        const token = await getValidToken();
        const response = await fetch(`/api/partner/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          const result = await response.json();
          setError(result.error || 'Failed to load student data');
          return;
        }

        const result = await response.json();
        const formData = studentDetailToFormData(result.data);
        setInitialData(formData);
      } catch (err) {
        console.error('Error fetching student for edit:', err);
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) fetchStudentData();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading student data...</span>
      </div>
    );
  }

  if (error || !initialData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <p className="text-destructive mb-4">{error || 'Student not found'}</p>
        <Button asChild>
          <Link href="/partner-v2/students">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Students
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      {/* Back navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href={`/partner-v2/students/${studentId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Student Details
          </Link>
        </Button>
      </div>

      {/* Edit Form with pre-populated data */}
      <StudentForm mode="edit" initialData={initialData} studentId={studentId} />
    </div>
  );
}

export default function EditStudentPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <EditStudentContent />
    </Suspense>
  );
}
