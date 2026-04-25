/**
 * Apply Page - Entry point for creating new application(s) for a student
 * Route: /partner-v2/students/[id]/apply
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import { ApplicationWizard } from '../../components/application-wizard/index';

export default function ApplyPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<{
    id: string;
    user_id: string;
    full_name: string;
  } | null>(null);

  // Show success message if redirected back after creation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const appCreated = urlParams.get('app_created');
    if (appCreated) {
      window.history.replaceState({}, '', `/partner-v2/students/${studentId}/apply`);
    }
  }, [studentId]);

  useEffect(() => {
    async function fetchStudent() {
      try {
        const token = await getValidToken();
        const response = await fetch(`/api/partner/students/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const result = await response.json();
          setStudentInfo({
            id: result.data.id,
            user_id: result.data.user_id || result.data.id,
            full_name: result.data.full_name || result.data.email || 'Unknown Student',
          });
        } else if (response.status === 404) {
          setError('Student not found');
        } else if (response.status === 403) {
          setError('You do not have permission to access this student');
        } else {
          setError('Failed to load student information');
        }
      } catch (err) {
        console.error('Error fetching student:', err);
        setError('An error occurred while loading student data');
      } finally {
        setLoading(false);
      }
    }

    if (studentId) fetchStudent();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading student information...</p>
        </div>
      </div>
    );
  }

  if (error || !studentInfo) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Unable to Proceed</h2>
            <p className="text-sm text-muted-foreground">{error || 'Student information could not be loaded'}</p>
            <Button asChild>
              <Link href={`/partner-v2/students/${studentId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Student Profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ApplicationWizard
      studentId={studentInfo.id}
      studentName={studentInfo.full_name}
      userId={studentInfo.user_id}
    />
  );
}
