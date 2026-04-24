'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Settings, DollarSign } from 'lucide-react';
import type { StudentFormData } from '../../lib/types';
import { STUDY_MODE_OPTIONS, FUNDING_SOURCE_OPTIONS } from '../../lib/types';

interface PreferencesTabProps {
  formData: StudentFormData;
  updateField: <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => void;
}

export function PreferencesTab({ formData, updateField }: PreferencesTabProps) {
  return (
    <div className="space-y-8">
      {/* Study Preferences */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Study Preferences
        </h3>

        <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Study Mode:</strong> Chinese universities offer different study modes.
            Full-time on-campus study is the most common for international students
            and is required for most scholarship programs.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-2">
            <Label>Preferred Study Mode</Label>
            <Select
              value={formData.study_mode || 'none'}
              onValueChange={(value) =>
                updateField(
                  'study_mode',
                  value === 'none' ? undefined : (value as StudentFormData['study_mode'])
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select study mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {STUDY_MODE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Funding Source</Label>
            <Select
              value={formData.funding_source || 'none'}
              onValueChange={(value) =>
                updateField(
                  'funding_source',
                  value === 'none' ? undefined : (value as StudentFormData['funding_source'])
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select funding source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                {FUNDING_SOURCE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Financial Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Financial Information & Scholarships
        </h3>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="scholarship_notes">Scholarship Application Notes</Label>
            <textarea
              id="scholarship_notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any specific scholarships being applied for? CSC, university-specific, government-sponsored, etc."
              value={
                typeof formData.scholarship_application === 'object' && formData.scholarship_application
                  ? JSON.stringify(formData.scholarship_application, null, 2)
                  : ''
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateField('scholarship_application', parsed);
                } catch {
                  // Keep raw text until valid JSON
                  updateField('scholarship_application', { notes: e.target.value });
                }
              }}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3 space-y-2">
            <Label htmlFor="financial_guarantee_notes">Financial Guarantor Information</Label>
            <textarea
              id="financial_guarantee_notes"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Information about financial guarantor/sponsor if applicable. Name, relationship, annual income proof status, etc."
              value={
                typeof formData.financial_guarantee === 'object' && formData.financial_guarantee
                  ? JSON.stringify(formData.financial_guarantee, null, 2)
                  : ''
              }
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  updateField('financial_guarantee', parsed);
                } catch {
                  updateField('financial_guarantee', { notes: e.target.value });
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="space-y-4 p-5 bg-muted rounded-lg border">
        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
          Important Notes for Partners
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
          <li>
            <strong>CSC Scholarship:</strong> The Chinese Government Scholarship (CSC) requires applications
            to be submitted between January and April each year through Chinese embassies or designated universities.
          </li>
          <li>
            <strong>Financial Guarantee:</strong> Most universities require a bank statement or financial
            guarantee letter showing sufficient funds for at least one year of tuition and living expenses.
          </li>
          <li>
            <strong>Documents:</strong> After saving this student profile, you can upload financial documents,
            bank statements, and sponsorship letters in the Documents section.
          </li>
          <li>
            <strong>Applications:</strong> Once student information is complete, you can create university
            applications linking to this student profile.
          </li>
        </ul>
      </div>
    </div>
  );
}
