'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { A4DocumentPreview } from '@/components/ui/a4-document-preview';
import {
  IconArrowLeft,
  IconDeviceFloppy,
  IconLoader2,
  IconUpload,
  IconX,
  IconPhoto,
  IconFileTypePdf,
  IconFileText,
  IconSchool,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FormData {
  student_name_en: string;
  student_name_cn: string;
  university_name_en: string;
  university_name_cn: string;
  program_name_en: string;
  program_name_cn: string;
  description_en: string;
  description_cn: string;
  admission_year: string;
  intake: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  display_order: string;
}

interface SuccessCaseFormProps {
  mode: 'create' | 'edit';
}

export default function SuccessCaseForm({ mode }: SuccessCaseFormProps) {
  const router = useRouter();
  const params = useParams();
  const studentPhotoRef = useRef<HTMLInputElement>(null);
  const admissionNoticeRef = useRef<HTMLInputElement>(null);
  const jw202Ref = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [existingFiles, setExistingFiles] = useState({
    student_photo_url: null as string | null,
    admission_notice_url: null as string | null,
    jw202_url: null as string | null,
  });
  const [newFiles, setNewFiles] = useState<{
    student_photo: File | null;
    admission_notice: File | null;
    jw202: File | null;
  }>({
    student_photo: null,
    admission_notice: null,
    jw202: null,
  });

  const [formData, setFormData] = useState<FormData>({
    student_name_en: '',
    student_name_cn: '',
    university_name_en: '',
    university_name_cn: '',
    program_name_en: '',
    program_name_cn: '',
    description_en: '',
    description_cn: '',
    admission_year: '',
    intake: '',
    status: 'draft',
    is_featured: false,
    display_order: '0',
  });

  useEffect(() => {
    if (mode === 'edit' && params.id) {
      fetchCase();
    }
  }, [mode, params.id]);

  const fetchCase = async () => {
    try {
      setIsLoading(true);
      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();
      
      const response = await fetch(`/api/admin/success-cases/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch case');

      const data = await response.json();
      const caseItem = data.success_case;

      setFormData({
        student_name_en: caseItem.student_name_en || '',
        student_name_cn: caseItem.student_name_cn || '',
        university_name_en: caseItem.university_name_en || '',
        university_name_cn: caseItem.university_name_cn || '',
        program_name_en: caseItem.program_name_en || '',
        program_name_cn: caseItem.program_name_cn || '',
        description_en: caseItem.description_en || '',
        description_cn: caseItem.description_cn || '',
        admission_year: caseItem.admission_year?.toString() || '',
        intake: caseItem.intake || '',
        status: caseItem.status || 'draft',
        is_featured: caseItem.is_featured || false,
        display_order: caseItem.display_order?.toString() || '0',
      });

      setExistingFiles({
        student_photo_url: caseItem.student_photo_url,
        admission_notice_url: caseItem.admission_notice_url,
        jw202_url: caseItem.jw202_url,
      });
    } catch (error) {
      console.error('Error fetching case:', error);
      toast.error('Failed to load success case');
      router.push('/admin/v2/success-cases');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (field: keyof typeof newFiles, file: File | null) => {
    setNewFiles(prev => ({ ...prev, [field]: file }));
  };

  const validateForm = (): boolean => {
    if (!formData.student_name_en.trim()) {
      toast.error('Student name (English) is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const { getValidToken } = await import('@/lib/auth-token');
      const token = await getValidToken();

      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        formDataToSend.append(key, value.toString());
      });

      // Append new files
      if (newFiles.student_photo) {
        formDataToSend.append('student_photo', newFiles.student_photo);
      }
      if (newFiles.admission_notice) {
        formDataToSend.append('admission_notice', newFiles.admission_notice);
      }
      if (newFiles.jw202) {
        formDataToSend.append('jw202', newFiles.jw202);
      }

      const url = mode === 'create'
        ? '/api/admin/success-cases'
        : `/api/admin/success-cases/${params.id}`;

      const response = await fetch(url, {
        method: mode === 'create' ? 'POST' : 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save case');
      }

      toast.success(mode === 'create' ? 'Success case created' : 'Success case updated');
      router.push('/admin/v2/success-cases');
    } catch (error) {
      console.error('Error saving case:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save success case');
    } finally {
      setIsSaving(false);
    }
  };

  const FileUploadField = ({
    label,
    field,
    accept,
    existingUrl,
    newFile,
    inputRef,
  }: {
    label: string;
    field: keyof typeof newFiles;
    accept: string;
    existingUrl: string | null;
    newFile: File | null;
    inputRef: React.RefObject<HTMLInputElement>;
  }) => {
    const isNewFilePDF = newFile?.type === 'application/pdf';
    const isExistingPDF = existingUrl?.toLowerCase().endsWith('.pdf');

    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <div className="space-y-3">
          {/* Existing File */}
          {existingUrl && !newFile && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isExistingPDF ? (
                    <IconFileTypePdf className="h-5 w-5 text-red-500" />
                  ) : (
                    <IconPhoto className="h-5 w-5 text-blue-500" />
                  )}
                  <span className="text-sm font-medium">Current file</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  Replace
                </Button>
              </div>
              {field === 'student_photo' && !isExistingPDF && (
                <div className="relative w-32 h-32 rounded overflow-hidden">
                  <Image
                    src={existingUrl}
                    alt="Student photo"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
              )}
              {(field === 'admission_notice' || field === 'jw202') && (
                <A4DocumentPreview
                  url={existingUrl}
                  title={label}
                  maxWidth={200}
                  showActions={false}
                />
              )}
            </div>
          )}

          {/* New File Preview */}
          {newFile && (
            <div className="border rounded-lg p-4 bg-blue-50/50 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isNewFilePDF ? (
                    <IconFileTypePdf className="h-5 w-5 text-red-500" />
                  ) : (
                    <IconPhoto className="h-5 w-5 text-blue-500" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{newFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(newFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileSelect(field, null)}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </div>
              {!isNewFilePDF && field === 'student_photo' && (
                <div className="relative w-32 h-32 rounded overflow-hidden">
                  <img
                    src={URL.createObjectURL(newFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Upload Button */}
          {!existingUrl && !newFile && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "w-full border-2 border-dashed rounded-lg p-6 text-center cursor-pointer",
                "hover:border-primary hover:bg-muted/50 transition-colors"
              )}
            >
              <IconUpload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Click to upload {label.toLowerCase()}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept.includes('pdf') ? 'PDF, JPG, PNG (max 10MB)' : 'JPG, PNG (max 10MB)'}
              </p>
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 10 * 1024 * 1024) {
                  toast.error('File size must be less than 10MB');
                  return;
                }
                handleFileSelect(field, file);
              }
            }}
            className="hidden"
          />
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold">
              {mode === 'create' ? 'New Success Case' : 'Edit Success Case'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === 'create' ? 'Add a new admission success story' : 'Update success case details'}
            </p>
          </div>
        </div>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? (
            <>
              <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              Save Case
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Student Information */}
          <Card>
            <CardHeader>
              <CardTitle>Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="student_name_en">
                    Student Name (English) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="student_name_en"
                    value={formData.student_name_en}
                    onChange={(e) => handleInputChange('student_name_en', e.target.value)}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="student_name_cn">Student Name (Chinese)</Label>
                  <Input
                    id="student_name_cn"
                    value={formData.student_name_cn}
                    onChange={(e) => handleInputChange('student_name_cn', e.target.value)}
                    placeholder="张三"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* University & Program */}
          <Card>
            <CardHeader>
              <CardTitle>University & Program</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university_name_en">University Name (English)</Label>
                  <Input
                    id="university_name_en"
                    value={formData.university_name_en}
                    onChange={(e) => handleInputChange('university_name_en', e.target.value)}
                    placeholder="Tsinghua University"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university_name_cn">University Name (Chinese)</Label>
                  <Input
                    id="university_name_cn"
                    value={formData.university_name_cn}
                    onChange={(e) => handleInputChange('university_name_cn', e.target.value)}
                    placeholder="清华大学"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="program_name_en">Program Name (English)</Label>
                  <Input
                    id="program_name_en"
                    value={formData.program_name_en}
                    onChange={(e) => handleInputChange('program_name_en', e.target.value)}
                    placeholder="Computer Science"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="program_name_cn">Program Name (Chinese)</Label>
                  <Input
                    id="program_name_cn"
                    value={formData.program_name_cn}
                    onChange={(e) => handleInputChange('program_name_cn', e.target.value)}
                    placeholder="计算机科学"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description_en">Success Story (English)</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => handleInputChange('description_en', e.target.value)}
                  placeholder="Share the student's journey and achievements..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description_cn">Success Story (Chinese)</Label>
                <Textarea
                  id="description_cn"
                  value={formData.description_cn}
                  onChange={(e) => handleInputChange('description_cn', e.target.value)}
                  placeholder="分享学生的成长故事和成就..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FileUploadField
                label="Student Photo"
                field="student_photo"
                accept="image/jpeg,image/png,image/webp"
                existingUrl={existingFiles.student_photo_url}
                newFile={newFiles.student_photo}
                inputRef={studentPhotoRef}
              />
              <Separator />
              <FileUploadField
                label="Admission Notice"
                field="admission_notice"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                existingUrl={existingFiles.admission_notice_url}
                newFile={newFiles.admission_notice}
                inputRef={admissionNoticeRef}
              />
              <Separator />
              <FileUploadField
                label="JW202 Form"
                field="jw202"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                existingUrl={existingFiles.jw202_url}
                newFile={newFiles.jw202}
                inputRef={jw202Ref}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="is_featured">Featured Case</Label>
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', e.target.value)}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admission Details */}
          <Card>
            <CardHeader>
              <CardTitle>Admission Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admission_year">Admission Year</Label>
                <Input
                  id="admission_year"
                  type="number"
                  value={formData.admission_year}
                  onChange={(e) => handleInputChange('admission_year', e.target.value)}
                  placeholder="2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="intake">Intake</Label>
                <Input
                  id="intake"
                  value={formData.intake}
                  onChange={(e) => handleInputChange('intake', e.target.value)}
                  placeholder="Fall 2025"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
