'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

import type { StudentFormData } from '../../lib/types';
import { NATIONALITIES } from '../../lib/types';

interface PassportTabProps {
  formData: StudentFormData;
  updateField: <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => void;
  errors?: Record<string, string>;
}

export function PassportTab({ formData, updateField, errors = {} }: PassportTabProps) {
  const hasError = (field: string) => !!errors[field];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Passport Information:</strong> Chinese universities require a valid passport
          for international student applications. Ensure the passport has at least 6 months
          of validity beyond the intended study period.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="text-lg font-semibold">Passport Details</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="passport_number">Passport Number</Label>
                {hasError('passport_number') && <AlertCircle className="h-3 w-3 text-destructive" />}
              </div>
              <Input
                id="passport_number"
                placeholder="Enter passport number"
                value={formData.passport_number || ''}
                onChange={(e) => updateField('passport_number', e.target.value)}
                className={hasError('passport_number') ? 'border-destructive focus:border-destructive' : ''}
              />
              {hasError('passport_number') && (
                <p className="text-xs text-destructive">{errors.passport_number}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="passport_expiry_date">Passport Expiry Date</Label>
                {hasError('passport_expiry_date') && <AlertCircle className="h-3 w-3 text-destructive" />}
              </div>
              <Input
                id="passport_expiry_date"
                type="date"
                value={formData.passport_expiry_date || ''}
                onChange={(e) => updateField('passport_expiry_date', e.target.value)}
                className={hasError('passport_expiry_date') ? 'border-destructive focus:border-destructive' : ''}
              />
              {hasError('passport_expiry_date') && (
                <p className="text-xs text-destructive">{errors.passport_expiry_date}</p>
              )}
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="passport_issuing_country">Issuing Country / Authority</Label>
              <select
                id="passport_issuing_country"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.passport_issuing_country || ''}
                onChange={(e) => updateField('passport_issuing_country', e.target.value)}
              >
                <option value="">Select issuing country</option>
                {NATIONALITIES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visa Status Note */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-base font-medium text-muted-foreground">Visa Information Notes</h3>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>X1 Visa: For study in China longer than 180 days (requires JW201/JW202 form)</li>
            <li>X2 Visa: For study in China shorter than 180 days</li>
            <li>After arrival in China, X1 visa holders must apply for a residence permit within 30 days</li>
            <li>The admission letter and JW201/JW202 form will be provided after acceptance by a university</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
