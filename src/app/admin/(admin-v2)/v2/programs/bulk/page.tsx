'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AdminSidebar } from '@/components/admin/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  city: string | null;
  province: string | null;
}

interface ProgramRow {
  id: string; // temporary ID for tracking
  name: string;
  code: string;
  degree_level: string;
  language: string;
  duration_years: string;
  tuition_fee_per_year: string;
  category: string;
  description: string;
}

const DEGREE_LEVELS = [
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Chinese Language', label: 'Language Program' },
  { value: 'Pre-University', label: 'Pre-University' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Certificate', label: 'Certificate' },
];

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Bilingual', label: 'Bilingual' },
];

const CATEGORIES = [
  { value: '', label: 'Select...' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Business', label: 'Business' },
  { value: 'Medicine', label: 'Medicine' },
  { value: 'Science', label: 'Science' },
  { value: 'Arts', label: 'Arts' },
  { value: 'Law', label: 'Law' },
  { value: 'Education', label: 'Education' },
  { value: 'Agriculture', label: 'Agriculture' },
  { value: 'Language', label: 'Language' },
];

const emptyRow: ProgramRow = {
  id: '',
  name: '',
  code: '',
  degree_level: 'Bachelor',
  language: 'English',
  duration_years: '',
  tuition_fee_per_year: '',
  category: '',
  description: '',
};

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default function BulkAddProgramsPage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programRows, setProgramRows] = useState<ProgramRow[]>([
    { ...emptyRow, id: generateTempId() },
    { ...emptyRow, id: generateTempId() },
    { ...emptyRow, id: generateTempId() },
  ]);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch('/api/admin/programs/bulk', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUniversities(data.universities || []);
      } else {
        toast.error('Failed to load universities');
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      toast.error('Failed to load universities');
    } finally {
      setIsLoading(false);
    }
  };

  const addRow = () => {
    setProgramRows([...programRows, { ...emptyRow, id: generateTempId() }]);
  };

  const addMultipleRows = (count: number) => {
    const newRows = Array.from({ length: count }, () => ({ ...emptyRow, id: generateTempId() }));
    setProgramRows([...programRows, ...newRows]);
  };

  const removeRow = (id: string) => {
    if (programRows.length > 1) {
      setProgramRows(programRows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof ProgramRow, value: string) => {
    setProgramRows(programRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  const handleSubmit = async () => {
    if (!selectedUniversity) {
      toast.error('Please select a university');
      return;
    }

    // Filter out empty rows
    const validRows = programRows.filter(row => row.name.trim() !== '');
    
    if (validRows.length === 0) {
      toast.error('Please add at least one program with a name');
      return;
    }

    setIsSubmitting(true);

    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const programs = validRows.map(row => ({
        name: row.name.trim(),
        code: row.code.trim() || undefined,
        degree_level: row.degree_level,
        language: row.language,
        duration_years: row.duration_years ? parseInt(row.duration_years) : undefined,
        tuition_fee_per_year: row.tuition_fee_per_year ? parseFloat(row.tuition_fee_per_year) : undefined,
        category: row.category || undefined,
        description: row.description.trim() || undefined,
      }));

      const response = await fetch('/api/admin/programs/bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          university_id: selectedUniversity,
          programs,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        router.push('/admin/v2/programs');
      } else {
        toast.error(data.error || 'Failed to create programs');
      }
    } catch (error) {
      console.error('Error creating programs:', error);
      toast.error('Failed to create programs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validRowsCount = programRows.filter(row => row.name.trim() !== '').length;

  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/v2">Admin</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink href="/admin/v2/programs">Programs</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbPage>Bulk Add</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </header>

        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Bulk Add Programs</h2>
              <p className="text-muted-foreground">
                Add multiple programs to a university at once
              </p>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>

          <Separator />

          {/* University Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select University</CardTitle>
              <CardDescription>
                Choose the university where these programs will be added
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading universities...
                </div>
              ) : (
                <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                  <SelectTrigger className="w-full md:w-[400px]">
                    <SelectValue placeholder="Select a university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map(uni => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.name_en} {uni.name_cn ? `(${uni.name_cn})` : ''} - {uni.city}, {uni.province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          {/* Programs Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Programs to Add</CardTitle>
                  <CardDescription>
                    Fill in the program details below. Rows without a name will be skipped.
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addMultipleRows(5)}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add 5 Rows
                  </Button>
                  <Button variant="outline" size="sm" onClick={addRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add Row
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">#</TableHead>
                      <TableHead className="w-[200px]">Name *</TableHead>
                      <TableHead className="w-[100px]">Code</TableHead>
                      <TableHead className="w-[120px]">Degree</TableHead>
                      <TableHead className="w-[100px]">Language</TableHead>
                      <TableHead className="w-[80px]">Duration</TableHead>
                      <TableHead className="w-[100px]">Tuition/Year</TableHead>
                      <TableHead className="w-[120px]">Category</TableHead>
                      <TableHead className="w-[200px]">Description</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {programRows.map((row, index) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.name}
                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                            placeholder="Program name"
                            className="min-w-[180px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.code}
                            onChange={(e) => updateRow(row.id, 'code', e.target.value)}
                            placeholder="Code"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.degree_level}
                            onValueChange={(v) => updateRow(row.id, 'degree_level', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {DEGREE_LEVELS.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.language}
                            onValueChange={(v) => updateRow(row.id, 'language', v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map(l => (
                                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.duration_years}
                            onChange={(e) => updateRow(row.id, 'duration_years', e.target.value)}
                            placeholder="Years"
                            className="w-[70px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={row.tuition_fee_per_year}
                            onChange={(e) => updateRow(row.id, 'tuition_fee_per_year', e.target.value)}
                            placeholder="USD"
                            className="w-[90px]"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={row.category}
                            onValueChange={(v) => updateRow(row.id, 'category', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="..." />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map(c => (
                                <SelectItem key={c.value || 'none'} value={c.value}>
                                  {c.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            value={row.description}
                            onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                            placeholder="Description"
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRow(row.id)}
                            disabled={programRows.length === 1}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {validRowsCount} valid program(s) ready to create
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedUniversity || validRowsCount === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create {validRowsCount} Program(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
