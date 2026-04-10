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
import { Loader2, Plus, Trash2, Save, ArrowLeft, Clipboard, FileSpreadsheet, X, Edit2 } from 'lucide-react';
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
  id: string;
  name: string;
  degree_level: string;
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

const emptyRow: ProgramRow = {
  id: '',
  name: '',
  degree_level: 'Bachelor',
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

  // Edit single program dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProgramRow | null>(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const fetchUniversities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/universities?limit=200', {
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

  // Parse pasted data (simplified for 2 columns)
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
    
    const firstRow = rows[0];
    const headerKeywords = ['name', 'program', 'degree'];
    const hasHeader = firstRow.some(cell => 
      headerKeywords.some(keyword => cell.toLowerCase().includes(keyword))
    );

    let dataRows: string[][];

    if (hasHeader) {
      dataRows = rows.slice(1);
    } else {
      dataRows = rows;
    }

    // Parse data rows - simplified to just name and degree
    return dataRows.map(row => {
      const programRow: ProgramRow = { 
        ...emptyRow, 
        id: generateTempId() 
      };
      
      // First column is name
      if (row[0]) {
        programRow.name = row[0].trim();
      }
      
      // Second column is degree level (if present)
      if (row[1]) {
        const degreeInput = row[1].trim().toLowerCase();
        const validDegree = DEGREE_LEVELS.find(d => 
          d.value.toLowerCase() === degreeInput || 
          d.label.toLowerCase() === degreeInput
        );
        if (validDegree) {
          programRow.degree_level = validDegree.value;
        }
      }
      
      return programRow;
    }).filter(row => row.name.trim() !== '');
  };

  // Handle paste button click
  const handlePaste = async () => {
    setIsParsing(true);
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipboardText = await navigator.clipboard.readText();
        if (clipboardText) {
          setPasteText(clipboardText);
        }
      }
    } catch (error) {
      console.log('Could not read clipboard');
    } finally {
      setIsParsing(false);
    }
  };

  // Handle preview
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
      setParsedPreview([]);
      setPasteText('');
      toast.success(`Added ${parsedPreview.length} programs to the list`);
    }
  };

  // Clear paste
  const handleClearPaste = () => {
    setPasteText('');
    setParsedPreview([]);
  };

  // Add new row
  const addRow = () => {
    setProgramRows([...programRows, { ...emptyRow, id: generateTempId() }]);
  };

  // Remove row
  const removeRow = (id: string) => {
    if (programRows.length > 1) {
      setProgramRows(programRows.filter(row => row.id !== id));
    }
  };

  // Update row field
  const updateRow = (id: string, field: keyof ProgramRow, value: string) => {
    setProgramRows(programRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Open edit dialog
  const openEditDialog = (row: ProgramRow) => {
    setEditingRow({ ...row });
    setEditDialogOpen(true);
  };

  // Save edited row
  const saveEditedRow = () => {
    if (editingRow) {
      setProgramRows(programRows.map(row => 
        row.id === editingRow.id ? editingRow : row
      ));
      setEditDialogOpen(false);
      setEditingRow(null);
    }
  };

  // Submit all programs
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
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/programs/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          university_id: selectedUniversity,
          programs: validRows.map(row => ({
            name: row.name,
            degree_level: row.degree_level,
            language: 'English',
            duration_years: 4,
            tuition_fee_per_year: 0,
            category: 'General',
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Successfully created ${result.created} program(s)`);
        router.push('/admin/v2/programs');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create programs');
      }
    } catch (error) {
      console.error('Error creating programs:', error);
      toast.error('Failed to create programs');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validRowsCount = programRows.filter(row => row.name.trim() !== '').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 p-6">
                {/* Breadcrumb */}
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/admin/v2/dashboard">Dashboard</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                      <BreadcrumbLink href="/admin/v2/programs">Programs</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem>
                      <BreadcrumbPage>Bulk Add</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">Bulk Add Programs</h1>
                    <p className="text-muted-foreground">
                      Add multiple programs at once to a university
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()}>
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button variant="outline" onClick={() => setPasteDialogOpen(true)}>
                      <Clipboard className="h-4 w-4 mr-2" />
                      Paste from Excel
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* University Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle>Select University</CardTitle>
                    <CardDescription>
                      Choose the university to add programs to
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Select a university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id}>
                            {uni.name_en} {uni.name_cn ? `(${uni.name_cn})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                {/* Programs Table */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Programs</CardTitle>
                        <CardDescription>
                          Enter program name and degree level. Other fields can be edited later.
                        </CardDescription>
                      </div>
                      <Button onClick={addRow} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Row
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead className="min-w-[300px]">Program Name *</TableHead>
                            <TableHead className="w-[180px]">Degree Level</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
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
                                  placeholder="Enter program name"
                                  className="min-w-[280px]"
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
                                    {DEGREE_LEVELS.map((degree) => (
                                      <SelectItem key={degree.value} value={degree.value}>
                                        {degree.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openEditDialog(row)}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeRow(row.id)}
                                    disabled={programRows.length === 1}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
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
                      {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      <Save className="h-4 w-4 mr-2" />
                      Create {validRowsCount} Program(s)
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>

        {/* Paste from Excel Dialog */}
        <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5" />
                Paste Program Data
              </DialogTitle>
              <DialogDescription>
                Paste program names and degree levels. Format: Name, Degree Level (one per line or tab/comma separated)
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
                      placeholder={`Paste your data here (multiple formats supported):

Example formats:

1. Tab or comma separated:
Computer Science	Bachelor
Business Administration	Master
Data Science	PhD

2. Markdown table:
| Name | Degree |
| Computer Science | Bachelor |
| Business Administration | Master |

3. Just names (one per line - defaults to Bachelor):
Computer Science
Business Administration
Data Science`}
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
                          <TableHead className="w-[50px]">#</TableHead>
                          <TableHead>Program Name</TableHead>
                          <TableHead>Degree Level</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedPreview.map((row, index) => (
                          <TableRow key={row.id || index}>
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-medium">{row.name || '-'}</TableCell>
                            <TableCell>{row.degree_level || '-'}</TableCell>
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

        {/* Edit Single Program Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Program</DialogTitle>
              <DialogDescription>
                Edit program details
              </DialogDescription>
            </DialogHeader>
            
            {editingRow && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Program Name</Label>
                  <Input
                    id="edit-name"
                    value={editingRow.name}
                    onChange={(e) => setEditingRow({ ...editingRow, name: e.target.value })}
                    placeholder="Enter program name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-degree">Degree Level</Label>
                  <Select
                    value={editingRow.degree_level}
                    onValueChange={(v) => setEditingRow({ ...editingRow, degree_level: v })}
                  >
                    <SelectTrigger id="edit-degree">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_LEVELS.map((degree) => (
                        <SelectItem key={degree.value} value={degree.value}>
                          {degree.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveEditedRow}>
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </TooltipProvider>
  );
}
