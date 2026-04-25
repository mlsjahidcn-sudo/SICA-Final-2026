'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

import type { StudentFormData } from '../../lib/types';
import { GENDER_OPTIONS, MARITAL_STATUS_OPTIONS, NATIONALITIES } from '../../lib/types';

interface PersonalTabProps {
  formData: StudentFormData;
  updateField: <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => void;
  errors?: Record<string, string>;
}

export function PersonalTab({ formData, updateField, errors = {} }: PersonalTabProps) {
  const hasError = (field: string) => !!errors[field];

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="full_name">Full Name *</Label>
              {hasError('full_name') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="full_name"
              placeholder="Enter full legal name as per passport"
              value={formData.full_name}
              onChange={(e) => updateField('full_name', e.target.value)}
              className={hasError('full_name') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('full_name') && (
              <p className="text-xs text-destructive">{errors.full_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="email">Email Address *</Label>
              {hasError('email') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="email"
              type="email"
              placeholder="student@example.com"
              value={formData.email}
              onChange={(e) => updateField('email', e.target.value)}
              className={hasError('email') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('email') && (
              <p className="text-xs text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="phone">Phone Number</Label>
              {hasError('phone') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.phone || ''}
              onChange={(e) => updateField('phone', e.target.value)}
              className={hasError('phone') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('phone') && (
              <p className="text-xs text-destructive">{errors.phone}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              {hasError('date_of_birth') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth || ''}
              onChange={(e) => updateField('date_of_birth', e.target.value)}
              className={hasError('date_of_birth') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('date_of_birth') && (
              <p className="text-xs text-destructive">{errors.date_of_birth}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>Gender</Label>
              {hasError('gender') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Select
              value={formData.gender || 'none'}
              onValueChange={(value) =>
                updateField('gender', value === 'none' ? undefined : (value as StudentFormData['gender']))
              }
            >
              <SelectTrigger className={hasError('gender') ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select gender</SelectItem>
                {GENDER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError('gender') && (
              <p className="text-xs text-destructive">{errors.gender}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label>Nationality</Label>
              {hasError('nationality') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Select
              value={formData.nationality || 'none'}
              onValueChange={(value) =>
                updateField('nationality', value === 'none' ? '' : value)
              }
            >
              <SelectTrigger className={hasError('nationality') ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select nationality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select nationality</SelectItem>
                {NATIONALITIES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError('nationality') && (
              <p className="text-xs text-destructive">{errors.nationality}</p>
            )}
          </div>
        </div>
      </div>

      {/* Personal Details for Chinese Applications */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Personal Details (Chinese University Requirements)</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="chinese_name">Chinese Name (中文姓名)</Label>
            <Input
              id="chinese_name"
              placeholder="If applicable, enter Chinese name"
              value={formData.chinese_name || ''}
              onChange={(e) => updateField('chinese_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Marital Status</Label>
            <Select
              value={formData.marital_status || 'none'}
              onValueChange={(value) =>
                updateField(
                  'marital_status',
                  value === 'none' ? undefined : (value as StudentFormData['marital_status'])
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Select status</SelectItem>
                {MARITAL_STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Input
              id="religion"
              placeholder="Religious affiliation (optional)"
              value={formData.religion || ''}
              onChange={(e) => updateField('religion', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wechat_id">WeChat ID</Label>
            <Input
              id="wechat_id"
              placeholder="WeChat ID for communication in China"
              value={formData.wechat_id || ''}
              onChange={(e) => updateField('wechat_id', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Address Information</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="current_address">Current Address</Label>
              {hasError('current_address') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="current_address"
              placeholder="Street address, apartment, building"
              value={formData.current_address || ''}
              onChange={(e) => updateField('current_address', e.target.value)}
              className={hasError('current_address') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('current_address') && (
              <p className="text-xs text-destructive">{errors.current_address}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="city">City</Label>
              {hasError('city') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="city"
              placeholder="City"
              value={formData.city || ''}
              onChange={(e) => updateField('city', e.target.value)}
              className={hasError('city') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('city') && (
              <p className="text-xs text-destructive">{errors.city}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1">
              <Label htmlFor="country">Country</Label>
              {hasError('country') && <AlertCircle className="h-3 w-3 text-destructive" />}
            </div>
            <Input
              id="country"
              placeholder="Country of residence"
              value={formData.country || ''}
              onChange={(e) => updateField('country', e.target.value)}
              className={hasError('country') ? 'border-destructive focus:border-destructive' : ''}
            />
            {hasError('country') && (
              <p className="text-xs text-destructive">{errors.country}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="postal_code">Postal Code / ZIP</Label>
            <Input
              id="postal_code"
              placeholder="Postal code"
              value={formData.postal_code || ''}
              onChange={(e) => updateField('postal_code', e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="permanent_address">Permanent Address (if different)</Label>
            <Input
              id="permanent_address"
              placeholder="Permanent home address"
              value={formData.permanent_address || ''}
              onChange={(e) => updateField('permanent_address', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Emergency Contact</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="emergency_contact_name">Contact Name</Label>
            <Input
              id="emergency_contact_name"
              placeholder="Full name of emergency contact"
              value={formData.emergency_contact_name || ''}
              onChange={(e) => updateField('emergency_contact_name', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
            <Input
              id="emergency_contact_phone"
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.emergency_contact_phone || ''}
              onChange={(e) => updateField('emergency_contact_phone', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emergency_contact_relationship">Relationship</Label>
            <Input
              id="emergency_contact_relationship"
              placeholder="e.g., Parent, Spouse, Sibling"
              value={formData.emergency_contact_relationship || ''}
              onChange={(e) => updateField('emergency_contact_relationship', e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
