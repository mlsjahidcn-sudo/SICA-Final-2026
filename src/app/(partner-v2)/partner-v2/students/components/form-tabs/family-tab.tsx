'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { Plus, Trash2, Users } from 'lucide-react';

import { FAMILY_RELATIONSHIPS } from '../../lib/types';
import type { StudentFormData, FamilyMemberEntry } from '../../lib/types';
import { emptyFamilyMemberEntry } from '../../lib/student-utils';

interface FamilyTabProps {
  formData: StudentFormData;
  updateField: <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => void;
}

export function FamilyTab({ formData, updateField }: FamilyTabProps) {
  const familyMembers = formData.family_members || [];

  const addMember = () => {
    updateField('family_members', [...familyMembers, { ...emptyFamilyMemberEntry }]);
  };

  const removeMember = (index: number) => {
    updateField(
      'family_members',
      familyMembers.filter((_, i) => i !== index)
    );
  };

  const updateMemberField = (index: number, field: keyof FamilyMemberEntry, value: string) => {
    const updated = familyMembers.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    );
    updateField('family_members', updated);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
        <p className="text-sm text-purple-800 dark:text-purple-200">
          <strong>Family Information:</strong> Chinese universities may request information
          about immediate family members for visa and scholarship applications.
          Include parents/guardians at minimum.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Family Members ({familyMembers.length})
        </h3>
        <Button type="button" variant="outline" size="sm" onClick={addMember}>
          <Plus className="mr-1 h-4 w-4" /> Add Family Member
        </Button>
      </div>

      {familyMembers.length === 0 && (
        <p className="text-sm text-muted-foreground py-8 text-center border rounded-dashed">
          No family members added yet. Click &quot;Add Family Member&quot; to begin.
        </p>
      )}

      <div className="space-y-4">
        {familyMembers.map((member, index) => (
          <div key={index} className="p-5 border rounded-lg space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Family Member #{index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeMember(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Remove
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  placeholder="Full legal name"
                  value={member.name}
                  onChange={(e) => updateMemberField(index, 'name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Relationship *</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={member.relationship}
                  onChange={(e) => updateMemberField(index, 'relationship', e.target.value)}
                >
                  <option value="">Select relationship</option>
                  {FAMILY_RELATIONSHIPS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Occupation</Label>
                <Input
                  placeholder="Current occupation"
                  value={member.occupation || ''}
                  onChange={(e) => updateMemberField(index, 'occupation', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+xx xxx xxxx"
                  value={member.phone || ''}
                  onChange={(e) => updateMemberField(index, 'phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="Email address (optional)"
                  value={member.email || ''}
                  onChange={(e) => updateMemberField(index, 'email', e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3 space-y-2">
                <Label>Address</Label>
                <Input
                  placeholder="Residential address"
                  value={member.address || ''}
                  onChange={(e) => updateMemberField(index, 'address', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
