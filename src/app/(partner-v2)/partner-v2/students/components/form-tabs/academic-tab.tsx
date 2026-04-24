'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Plus, Trash2, GraduationCap, Briefcase, Languages } from 'lucide-react';

import { DEGREE_LEVELS } from '../../lib/types';
import type { StudentFormData, EducationHistoryEntry, WorkExperienceEntry } from '../../lib/types';
import { emptyEducationEntry, emptyWorkExperienceEntry } from '../../lib/student-utils';

interface AcademicTabProps {
  formData: StudentFormData;
  updateField: <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => void;
}

export function AcademicTab({ formData, updateField }: AcademicTabProps) {
  const educationHistory = formData.education_history || [];
  const workExperience = formData.work_experience || [];

  // Education History helpers
  const addEducation = () => {
    updateField('education_history', [...educationHistory, { ...emptyEducationEntry }]);
  };

  const removeEducation = (index: number) => {
    updateField(
      'education_history',
      educationHistory.filter((_, i) => i !== index)
    );
  };

  const updateEducationField = (index: number, field: keyof EducationHistoryEntry, value: string) => {
    const updated = educationHistory.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    updateField('education_history', updated);
  };

  // Work Experience helpers
  const addWorkExperience = () => {
    updateField('work_experience', [...workExperience, { ...emptyWorkExperienceEntry }]);
  };

  const removeWorkExperience = (index: number) => {
    updateField(
      'work_experience',
      workExperience.filter((_, i) => i !== index)
    );
  };

  const updateWorkExperienceField = (index: number, field: keyof WorkExperienceEntry, value: string) => {
    const updated = workExperience.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    updateField('work_experience', updated);
  };

  return (
    <div className="space-y-8">
      {/* Legacy Quick Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Current / Highest Education
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="highest_education">Highest Education Level</Label>
            <Select
              value={formData.highest_education || 'none'}
              onValueChange={(value) =>
                updateField('highest_education', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {DEGREE_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="institution_name">Institution Name</Label>
            <Input
              id="institution_name"
              placeholder="Current or most recent institution"
              value={formData.institution_name || ''}
              onChange={(e) => updateField('institution_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field_of_study_legacy">Field of Study</Label>
            <Input
              id="field_of_study_legacy"
              placeholder="Major / Field of study"
              value={formData.field_of_study_legacy || ''}
              onChange={(e) => updateField('field_of_study_legacy', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="graduation_date">Graduation Date</Label>
            <Input
              id="graduation_date"
              type="date"
              value={formData.graduation_date || ''}
              onChange={(e) => updateField('graduation_date', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gpa_legacy">GPA / Score</Label>
            <Input
              id="gpa_legacy"
              placeholder="e.g., 3.8/4.0"
              value={formData.gpa_legacy || ''}
              onChange={(e) => updateField('gpa_legacy', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Education History - Dynamic Array */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Complete Education History
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addEducation}>
            <Plus className="mr-1 h-4 w-4" /> Add Entry
          </Button>
        </div>

        {educationHistory.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-dashed">
            No education history entries yet. Click &quot;Add Entry&quot; to begin.
          </p>
        )}

        <div className="space-y-4">
          {educationHistory.map((entry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Education #{index + 1}
                  {entry.institution ? ` - ${entry.institution}` : ''}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeEducation(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label>Institution *</Label>
                  <Input
                    placeholder="University / School name"
                    value={entry.institution}
                    onChange={(e) => updateEducationField(index, 'institution', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Degree *</Label>
                  <Input
                    placeholder="e.g., Bachelor of Science"
                    value={entry.degree}
                    onChange={(e) => updateEducationField(index, 'degree', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Field of Study *</Label>
                  <Input
                    placeholder="Major subject"
                    value={entry.field_of_study}
                    onChange={(e) => updateEducationField(index, 'field_of_study', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={entry.start_date}
                    onChange={(e) => updateEducationField(index, 'start_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={entry.end_date || ''}
                    onChange={(e) => updateEducationField(index, 'end_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>GPA</Label>
                  <Input
                    placeholder="GPA if available"
                    value={entry.gpa || ''}
                    onChange={(e) => updateEducationField(index, 'gpa', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    placeholder="City"
                    value={entry.city || ''}
                    onChange={(e) => updateEducationField(index, 'city', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    placeholder="Country"
                    value={entry.country || ''}
                    onChange={(e) => updateEducationField(index, 'country', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Work Experience - Dynamic Array */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work Experience
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={addWorkExperience}>
            <Plus className="mr-1 h-4 w-4" /> Add Entry
          </Button>
        </div>

        {workExperience.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-dashed">
            No work experience entries yet. Click &quot;Add Entry&quot; to add work history.
          </p>
        )}

        <div className="space-y-4">
          {workExperience.map((entry, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">
                  Work Experience #{index + 1}
                  {entry.company ? ` - ${entry.company}` : ''}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeWorkExperience(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Company/Organization *</Label>
                  <Input
                    placeholder="Company name"
                    value={entry.company}
                    onChange={(e) => updateWorkExperienceField(index, 'company', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Position/Role *</Label>
                  <Input
                    placeholder="Job title"
                    value={entry.position}
                    onChange={(e) => updateWorkExperienceField(index, 'position', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={entry.start_date}
                    onChange={(e) => updateWorkExperienceField(index, 'start_date', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={entry.end_date || ''}
                    onChange={(e) => updateWorkExperienceField(index, 'end_date', e.target.value)}
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <Label>Description</Label>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Brief description of responsibilities and achievements"
                    value={entry.description || ''}
                    onChange={(e) => updateWorkExperienceField(index, 'description', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Language Proficiency */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Language Proficiency Scores
        </h3>
        <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Most Chinese universities require proof of Chinese language proficiency (HSK)
            or English proficiency (IELTS/TOEFL). Upload official test score documents in the Documents section.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="hsk_level">HSK Level</Label>
            <Select
              value={formData.hsk_level?.toString() || 'none'}
              onValueChange={(value) => {
                const numVal = value === 'none' ? undefined : parseInt(value);
                updateField('hsk_level', numVal as StudentFormData['hsk_level']);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="HSK Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">N/A</SelectItem>
                {[1, 2, 3, 4, 5, 6].map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    HSK {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hsk_score">HSK Score</Label>
            <Input
              id="hsk_score"
              type="number"
              placeholder="Total HSK score"
              value={formData.hsk_score || ''}
              onChange={(e) =>
                updateField(
                  'hsk_score',
                  e.target.value ? parseInt(e.target.value) || undefined : undefined
                )
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ielts_score">IELTS Score</Label>
            <Input
              id="ielts_score"
              placeholder="e.g., 7.0"
              value={formData.ielts_score || ''}
              onChange={(e) => updateField('ielts_score', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="toefl_score">TOEFL Score</Label>
            <Input
              id="toefl_score"
              type="number"
              placeholder="e.g., 100"
              value={formData.toefl_score || ''}
              onChange={(e) =>
                updateField(
                  'toefl_score',
                  e.target.value ? parseInt(e.target.value) || undefined : undefined
                )
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
