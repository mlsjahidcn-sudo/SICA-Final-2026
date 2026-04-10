'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, ArrowLeft, Clipboard, FileSpreadsheet, X } from 'lucide-react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

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
  { value: 'General', label: 'General' },
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
  category: 'General',
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
  
  // Paste functionality state
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedPreview, setParsedPreview] = useState<ProgramRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Column mapping for parsing
  const columnMappings: Record<string, keyof ProgramRow> = {
    'name': 'name',
    'program name': 'name',
    'program': 'name',
    'name_en': 'name',
    'code': 'code',
    'program code': 'code',
    'degree': 'degree_level',
    'degree level': 'degree_level',
    'degree_level': 'degree_level',
    'language': 'language',
    'teaching language': 'language',
    'duration': 'duration_years',
    'duration_years': 'duration_years',
    'years': 'duration_years',
    'tuition': 'tuition_fee_per_year',
    'tuition_fee_per_year': 'tuition_fee_per_year',
    'fee': 'tuition_fee_per_year',
    'category': 'category',
    'description': 'description',
  };

  // Parse pasted TSV/CSV/Markdown table data
  const parsePastedData = (text: string): ProgramRow[] => {
    let lines = text.trim().split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return [];

    const firstLine = lines[0];
    
    // Detect format: Markdown table, TSV, or CSV
    const pipeCount = (firstLine.match(/\|/g) || []).length;
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    
    let delimiter = '\t';
    let isMarkdownTable = false;
    
    if (pipeCount >= 2) {
      // Markdown table format (| col1 | col2 |)
      isMarkdownTable = true;
      delimiter = '|';
    } else if (tabCount >= commaCount && tabCount > 0) {
      delimiter = '\t';
    } else if (commaCount > 0) {
      delimiter = ',';
    }

    // Parse rows
    let rows: string[][] = [];
    
    if (isMarkdownTable) {
      // Parse Markdown table format
      rows = lines
        .map(line => {
          // Remove leading and trailing pipes, then split
          const cleaned = line.replace(/^\|?\s*/, '').replace(/\s*\|?$/, '');
          return cleaned.split('|').map(cell => cell.trim());
        })
        .filter(row => {
          // Filter out separator rows (like | :--- | :--- |)
          return !row.every(cell => cell.match(/^:?-+:?$/));
        });
    } else {
      rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()));
    }
    
    if (rows.length === 0) return [];
    const firstRow = rows[0];
    const headerKeywords = ['name', 'program', 'code', 'degree', 'language', 'duration', 'tuition', 'category', 'description'];
    const hasHeader = firstRow.some(cell => 
      headerKeywords.some(keyword => cell.toLowerCase().includes(keyword))
    );

    let headerRow: string[] = [];
    let dataRows: string[][] = [];

    if (hasHeader) {
      headerRow = firstRow.map(h => h.toLowerCase());
      dataRows = rows.slice(1);
    } else {
      // No header, use default order
      headerRow = ['name', 'code', 'degree_level', 'language', 'duration_years', 'tuition_fee_per_year', 'category', 'description'].slice(0, firstRow.length);
      dataRows = rows;
    }

    // Map columns to ProgramRow fields
    const mappedColumns = headerRow.map(h => {
      const normalizedHeader = h.toLowerCase().replace(/[_\s]+/g, ' ').trim();
      for (const [key, field] of Object.entries(columnMappings)) {
        if (normalizedHeader.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedHeader)) {
          return field;
        }
      }
      return null;
    });

    // Parse data rows
    return dataRows.map(row => {
      const programRow: ProgramRow = { 
        ...emptyRow, 
        id: generateTempId() 
      };
      
      row.forEach((cell, index) => {
        const field = mappedColumns[index];
        if (field && cell) {
          // Validate and convert values
          if (field === 'degree_level') {
            const validDegrees = DEGREE_LEVELS.map(d => d.value.toLowerCase());
            if (validDegrees.includes(cell.toLowerCase())) {
              programRow[field] = cell.charAt(0).toUpperCase() + cell.slice(1).toLowerCase();
            }
          } else if (field === 'language') {
            const validLangs = LANGUAGES.map(l => l.value.toLowerCase());
            if (validLangs.includes(cell.toLowerCase())) {
              programRow[field] = cell.charAt(0).toUpperCase() + cell.slice(1).toLowerCase();
            }
          } else if (field === 'category') {
            const validCats = CATEGORIES.map(c => c.value.toLowerCase());
            if (validCats.includes(cell.toLowerCase())) {
              programRow[field] = cell.charAt(0).toUpperCase() + cell.slice(1).toLowerCase();
            }
          } else {
            (programRow as unknown as Record<string, string>)[field] = cell;
          }
        }
      });
      
      return programRow;
    }).filter(row => row.name.trim() !== ''); // Filter out rows without name
  };

  // Handle paste button click
  const handlePaste = async () => {
    setIsParsing(true);
    try {
      // Try to read from clipboard first
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          setPasteText(clipboardText);
        }
      }
    } catch {
      // Clipboard access denied, user will paste manually
    }
    setIsParsing(false);
    setPasteDialogOpen(true);
  };

  // Preview parsed data
  const handlePreview = () => {
    if (!pasteText.trim()) {
      toast.error('Please paste some data first');
      return;
    }
    
    const parsed = parsePastedData(pasteText);
    if (parsed.length === 0) {
      toast.error('Could not parse any valid program data. Please check the format.');
      return;
    }
    
    setParsedPreview(parsed);
    toast.success(`Parsed ${parsed.length} program(s) from pasted data`);
  };

  // Apply parsed data to table
  const handleApplyParsed = () => {
    if (parsedPreview.length > 0) {
      setProgramRows(parsedPreview);
      setPasteDialogOpen(false);
      setPasteText('');
      setParsedPreview([]);
      toast.success(`Added ${parsedPreview.length} program(s) to the table`);
    }
  };

  // Clear paste data
  const handleClearPaste = () => {
    setPasteText('');
    setParsedPreview([]);
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
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />

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
                  <Button variant="outline" size="sm" onClick={handlePaste}>
                    <Clipboard className="mr-1 h-4 w-4" />
                    Paste from Excel
                  </Button>
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

          {/* Paste from Excel Dialog */}
          <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Paste Table Data
                </DialogTitle>
                <DialogDescription>
                  Supports Markdown tables, Excel, Google Sheets, or any tab/comma-separated format. 
                  First row should be headers (Name, Degree Level, Language, Duration, Tuition, Category).
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="paste" className="flex-1 overflow-hidden flex flex-col">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="paste">Paste Data</TabsTrigger>
                  <TabsTrigger value="preview">Preview ({parsedPreview.length} rows)</TabsTrigger>
                </TabsList>
                
                <TabsContent value="paste" className="flex-1 overflow-hidden mt-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Textarea
                        ref={textareaRef}
                        placeholder={`Paste your table data here (supports multiple formats)...

Markdown Table Format:
| Name | Degree Level | Language | Duration | Tuition | Category |
| International Economic and Trade | Bachelor | English | 4 | 10000 | Business |
| Business Administration | Bachelor | English | 4 | 10000 | Business |

Excel/Sheets Format (Tab-separated):
Name	Degree Level	Language	Duration	Tuition	Category
Computer Science	Bachelor	English	4	15000	Engineering
Business Administration	Master	English	2	18000	Business`}
                        value={pasteText}
                        onChange={(e) => setPasteText(e.target.value)}
                        className="min-h-[300px] font-mono text-sm"
                      />
                      {pasteText && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearPaste}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button onClick={handlePreview} disabled={!pasteText.trim()}>
                        Preview Parsed Data
                      </Button>
                      <Button variant="outline" onClick={handleClearPaste} disabled={!pasteText.trim()}>
                        Clear
                      </Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview" className="flex-1 overflow-auto mt-4">
                  {parsedPreview.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Name</TableHead>
                            <TableHead>Degree</TableHead>
                            <TableHead>Language</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Tuition</TableHead>
                            <TableHead>Category</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {parsedPreview.map((row, index) => (
                            <TableRow key={row.id || index}>
                              <TableCell className="font-medium">{row.name || '-'}</TableCell>
                              <TableCell>{row.degree_level || '-'}</TableCell>
                              <TableCell>{row.language || '-'}</TableCell>
                              <TableCell>{row.duration_years ? `${row.duration_years} years` : '-'}</TableCell>
                              <TableCell>{row.tuition_fee_per_year ? `$${row.tuition_fee_per_year}` : '-'}</TableCell>
                              <TableCell>{row.category || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <FileSpreadsheet className="h-12 w-12 mb-4 opacity-50" />
                      <p>No data preview yet</p>
                      <p className="text-sm">Paste data in the "Paste Data" tab and click "Preview Parsed Data"</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleApplyParsed} disabled={parsedPreview.length === 0}>
                  Apply to Table ({parsedPreview.length} programs)
                </Button>
              </div>
            </DialogContent>
          </Dialog>

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
    </TooltipProvider>
  );
}
