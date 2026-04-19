'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StudentForm } from '../components/student-form';

export default function NewStudentPage() {
  return (
    <div className="p-6 w-full">
      {/* Breadcrumb / Back navigation */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-2 -ml-2 text-muted-foreground hover:text-foreground">
          <Link href="/partner-v2/students">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </Link>
        </Button>
      </div>

      {/* Student Form in Create Mode */}
      <StudentForm mode="create" />
    </div>
  );
}
