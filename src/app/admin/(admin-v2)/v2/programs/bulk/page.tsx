"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Loader2, 
  Plus, 
  Trash2, 
  ArrowLeft, 
  ClipboardPaste, 
  FileSpreadsheet, 
  CheckCircle2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

interface University {
  id: string;
  name_en: string;
  name_cn: string | null;
  city: string | null;
  province: string | null;
}

interface ProgramRow {
  id: string;
  name: string;
  code: string;
  degree_level: string;
  language: string;
  duration_years: string;
  tuition_fee_per_year: string;
  category: string;
  description: string;
  isValid: boolean;
  errors: string[];
}

const DEGREE_LEVELS = [
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'Chinese Language', label: 'Language Program' },
  { value: 'Diploma', label: 'Diploma' },
];

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Chinese', label: 'Chinese' },
  { value: 'Bilingual', label: 'Bilingual' },
];

const CATEGORIES = [
  'Engineering', 'Business', 'Medicine', 'Science', 'Arts',
  'Law', 'Education', 'Computer Science', 'Economics', 'Management',
];

function generateTempId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const emptyRow = (): ProgramRow => ({
  id: generateTempId(),
  name: '',
  code: '',
  degree_level: 'Bachelor',
  language: 'English',
  duration_years: '',
  tuition_fee_per_year: '',
  category: 'Engineering',
  description: '',
  isValid: false,
  errors: [],
});

// Column mapping for parsing
const columnMappings: Record<string, keyof ProgramRow> = {
  'name': 'name',
  'program name': 'name',
  'program': 'name',
  'code': 'code',
  'program code': 'code',
  'degree': 'degree_level',
  'degree level': 'degree_level',
  'language': 'language',
  'teaching language': 'language',
  'duration': 'duration_years',
  'years': 'duration_years',
  'tuition': 'tuition_fee_per_year',
  'fee': 'tuition_fee_per_year',
  'category': 'category',
  'description': 'description',
};

export default function BulkAddProgramsPage() {
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [programRows, setProgramRows] = useState<ProgramRow[]>([emptyRow(), emptyRow(), emptyRow()]);
  
  // Paste functionality
  const [pasteText, setPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ProgramRow[]>([]);
  const [pasteSheetOpen, setPasteSheetOpen] = useState(false);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch('/api/admin/programs/bulk', {
        headers: { 'Authorization': `Bearer ${token}` },
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

  // Parse pasted data (TSV/CSV/Markdown)
  const parsePastedData = (text: string): ProgramRow[] => {
    let lines = text.trim().split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    
    // Detect format
    const pipeCount = (firstLine.match(/\|/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    let delimiter = '\t';
    let isMarkdown = false;
    
    if (pipeCount >= 2) {
      isMarkdown = true;
      delimiter = '|';
    } else if (commaCount > tabCount) {
      delimiter = ',';
    }

    // Parse rows
    let rows: string[][] = [];
    
    if (isMarkdown) {
      rows = lines
        .map(line => {
          const cleaned = line.replace(/^\|?\s*/, '').replace(/\s*\|?$/, '');
          return cleaned.split('|').map(cell => cell.trim());
        })
        .filter(row => !row.every(cell => cell.match(/^:?-+:?$/)));
    } else {
      rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
    }
    
    if (rows.length === 0) return [];

    // Detect header
    const headerKeywords = ['name', 'program', 'degree', 'language', 'tuition'];
    const firstRow = rows[0];
    const hasHeader = firstRow.some(cell => 
      headerKeywords.some(keyword => cell.toLowerCase().includes(keyword))
    );

    let headerRow: string[] = [];
    let dataRows: string[][] = [];

    if (hasHeader) {
      headerRow = firstRow.map(h => h.toLowerCase());
      dataRows = rows.slice(1);
    } else {
      headerRow = ['name', 'degree_level', 'language', 'duration_years', 'tuition_fee_per_year', 'category'].slice(0, firstRow.length);
      dataRows = rows;
    }

    // Map columns
    const mappedColumns = headerRow.map(h => {
      const normalized = h.toLowerCase().replace(/[_\s]+/g, ' ').trim();
      for (const [key, field] of Object.entries(columnMappings)) {
        if (normalized.includes(key.toLowerCase()) || key.toLowerCase().includes(normalized)) {
          return field;
        }
      }
      return null;
    });

    // Parse data
    return dataRows.map(row => {
      const programRow = emptyRow();
      const errors: string[] = [];
      
      row.forEach((cell, index) => {
        const field = mappedColumns[index];
        if (field && cell) {
          (programRow as any)[field] = cell;
        }
      });

      // Validate
      if (!programRow.name.trim()) {
        errors.push('Name required');
      }
      programRow.isValid = errors.length === 0;
      programRow.errors = errors;
      
      return programRow;
    }).filter(row => row.name.trim() !== '');
  };

  const handlePreview = () => {
    if (!pasteText.trim()) {
      toast.error('Please paste some data first');
      return;
    }
    
    const parsed = parsePastedData(pasteText);
    if (parsed.length === 0) {
      toast.error('Could not parse any valid data');
      return;
    }
    
    setParsedPreview(parsed);
    toast.success(`Found ${parsed.length} program(s)`);
  };

  const handleApplyParsed = () => {
    if (parsedPreview.length > 0) {
      setProgramRows(parsedPreview);
      setPasteSheetOpen(false);
      setPasteText('');
      setParsedPreview([]);
      toast.success(`Added ${parsedPreview.length} program(s)`);
    }
  };

  const addRow = () => {
    setProgramRows([...programRows, emptyRow()]);
  };

  const removeRow = (id: string) => {
    if (programRows.length > 1) {
      setProgramRows(programRows.filter(row => row.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof ProgramRow, value: string) => {
    setProgramRows(programRows.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        // Re-validate
        const errors: string[] = [];
        if (!updated.name.trim()) errors.push('Name required');
        updated.isValid = errors.length === 0;
        updated.errors = errors;
        return updated;
      }
      return row;
    }));
  };

  const handleSubmit = async () => {
    if (!selectedUniversity) {
      toast.error('Please select a university');
      return;
    }

    const validRows = programRows.filter(row => row.name.trim() !== '');
    
    if (validRows.length === 0) {
      toast.error('Please add at least one program');
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

  const validCount = programRows.filter(row => row.name.trim() !== '').length;

  return (
    <TooltipProvider>
      <SidebarProvider
        style={{
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties}
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-col gap-4 p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Bulk Add Programs</h1>
                <p className="text-muted-foreground text-sm">
                  Add multiple programs at once
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
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select University</CardTitle>
                <CardDescription>
                  Choose the university for these programs
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
                          {uni.name_en} {uni.name_cn ? `(${uni.name_cn})` : ''} - {uni.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Add Programs */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Programs</CardTitle>
                    <CardDescription>
                      {validCount} program(s) ready to add
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Sheet open={pasteSheetOpen} onOpenChange={setPasteSheetOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ClipboardPaste className="mr-2 h-4 w-4" />
                          Paste Data
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[500px] sm:w-[600px]">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Paste from Excel/Markdown
                          </SheetTitle>
                          <SheetDescription>
                            Paste table data directly from Excel, Google Sheets, or Markdown tables
                          </SheetDescription>
                        </SheetHeader>
                        <div className="mt-6 space-y-4">
                          <Textarea
                            placeholder="Paste your table data here...&#10;&#10;Supported formats:&#10;• Tab-separated (from Excel/Sheets)&#10;• Comma-separated (CSV)&#10;• Markdown tables (| Name | Degree | ... |)"
                            value={pasteText}
                            onChange={(e) => setPasteText(e.target.value)}
                            className="min-h-[200px] font-mono text-sm"
                          />
                          <Button onClick={handlePreview} className="w-full">
                            Preview Data
                          </Button>
                          
                          {parsedPreview.length > 0 && (
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">
                                  {parsedPreview.length} program(s) found
                                </span>
                                <Badge variant="secondary">
                                  {parsedPreview.filter(p => p.isValid).length} valid
                                </Badge>
                              </div>
                              <ScrollArea className="h-[200px] rounded border p-2">
                                {parsedPreview.map((row, idx) => (
                                  <div key={row.id} className="flex items-center gap-2 py-1 text-sm border-b last:border-0">
                                    {row.isValid ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                                    )}
                                    <span className="truncate">{row.name}</span>
                                    <Badge variant="outline" className="text-xs ml-auto">
                                      {row.degree_level}
                                    </Badge>
                                  </div>
                                ))}
                              </ScrollArea>
                              <Button onClick={handleApplyParsed} className="w-full">
                                Add to List
                              </Button>
                            </div>
                          )}
                        </div>
                      </SheetContent>
                    </Sheet>
                    <Button variant="outline" size="sm" onClick={addRow}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Row
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {programRows.map((row, index) => (
                    <div 
                      key={row.id} 
                      className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="col-span-12 md:col-span-3">
                        <Input
                          placeholder="Program name *"
                          value={row.name}
                          onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                          className={!row.name && row.errors.length > 0 ? 'border-red-300' : ''}
                        />
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Select value={row.degree_level} onValueChange={(v) => updateRow(row.id, 'degree_level', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEGREE_LEVELS.map(d => (
                              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-6 md:col-span-2">
                        <Select value={row.language} onValueChange={(v) => updateRow(row.id, 'language', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {LANGUAGES.map(l => (
                              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <Input
                          placeholder="Years"
                          value={row.duration_years}
                          onChange={(e) => updateRow(row.id, 'duration_years', e.target.value)}
                          type="number"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2">
                        <Input
                          placeholder="Tuition"
                          value={row.tuition_fee_per_year}
                          onChange={(e) => updateRow(row.id, 'tuition_fee_per_year', e.target.value)}
                          type="number"
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1">
                        <Select value={row.category} onValueChange={(v) => updateRow(row.id, 'category', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-12 md:col-span-1 flex justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRow(row.id)}
                          disabled={programRows.length === 1}
                          className="h-9 w-9 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!selectedUniversity || validCount === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Create {validCount} Program{validCount !== 1 ? 's' : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
