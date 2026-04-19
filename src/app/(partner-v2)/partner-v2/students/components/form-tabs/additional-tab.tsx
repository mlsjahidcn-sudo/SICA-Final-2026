'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

import { Plus, Trash2, Trophy, FlaskConical, FileText, Star } from 'lucide-react';

import type {
  StudentFormData,
  ExtracurricularActivityEntry,
  AwardEntry,
  PublicationEntry,
  ResearchExperienceEntry,
} from '../../lib/types';
import {
  emptyExtracurricularActivity,
  emptyAward,
  emptyPublication,
  emptyResearchExperience,
} from '../../lib/student-utils';

interface AdditionalTabProps {
  formData: StudentFormData;
  updateField: <K extends keyof StudentFormData>(field: K, value: StudentFormData[K]) => void;
}

export function AdditionalTab({ formData, updateField }: AdditionalTabProps) {
  const activities = formData.extracurricular_activities || [];
  const awards = formData.awards || [];
  const publications = formData.publications || [];
  const researchExperience = formData.research_experience || [];

  return (
    <div className="space-y-8">
      {/* Extracurricular Activities */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5" />
            Extracurricular Activities
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateField('extracurricular_activities', [...activities, { ...emptyExtracurricularActivity }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add Activity
          </Button>
        </div>

        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-dashed">
            No extracurricular activities added.
          </p>
        ) : (
          <div className="space-y-3">
            {activities.map((entry, index) => (
              <ActivityCard
                key={index}
                index={index}
                entry={entry}
                title={`Activity #${index + 1}`}
                onRemove={() =>
                  updateField(
                    'extracurricular_activities',
                    activities.filter((_, i) => i !== index)
                  )
                }
                onUpdate={(field, value) => {
                  const updated = activities.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item
                  );
                  updateField('extracurricular_activities', updated);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Awards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Awards & Honors
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => updateField('awards', [...awards, { ...emptyAward }])}
          >
            <Plus className="mr-1 h-4 w-4" /> Add Award
          </Button>
        </div>

        {awards.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-dashed">
            No awards or honors added.
          </p>
        ) : (
          <div className="space-y-3">
            {awards.map((entry, index) => (
              <AwardCard
                key={index}
                index={index}
                entry={entry}
                title={`Award #${index + 1}`}
                onRemove={() =>
                  updateField('awards', awards.filter((_, i) => i !== index))
                }
                onUpdate={(field, value) => {
                  const updated = awards.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item
                  );
                  updateField('awards', updated);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Publications */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Publications
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateField('publications', [...publications, { ...emptyPublication }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add Publication
          </Button>
        </div>

        {publications.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-dashed">
            No publications added.
          </p>
        ) : (
          <div className="space-y-3">
            {publications.map((entry, index) => (
              <PublicationCard
                key={index}
                index={index}
                entry={entry}
                title={`Publication #${index + 1}`}
                onRemove={() =>
                  updateField(
                    'publications',
                    publications.filter((_, i) => i !== index)
                  )
                }
                onUpdate={(field, value) => {
                  const updated = publications.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item
                  );
                  updateField('publications', updated);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Research Experience */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Research Experience
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              updateField('research_experience', [...researchExperience, { ...emptyResearchExperience }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add Entry
          </Button>
        </div>

        {researchExperience.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-dashed">
            No research experience added.
          </p>
        ) : (
          <div className="space-y-3">
            {researchExperience.map((entry, index) => (
              <ResearchCard
                key={index}
                index={index}
                entry={entry}
                title={`Research #${index + 1}`}
                onRemove={() =>
                  updateField(
                    'research_experience',
                    researchExperience.filter((_, i) => i !== index)
                  )
                }
                onUpdate={(field, value) => {
                  const updated = researchExperience.map((item, i) =>
                    i === index ? { ...item, [field]: value } : item
                  );
                  updateField('research_experience', updated);
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== Sub-components for each array type ====================

interface ArrayEntryCardProps<T> {
  index: number;
  entry: T;
  title: string;
  onRemove: () => void;
  onUpdate: (field: keyof T & string, value: string) => void;
}

function ActivityCard({ index, entry, title, onRemove, onUpdate }: ArrayEntryCardProps<ExtracurricularActivityEntry>) {
  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Activity *</Label>
          <Input placeholder="Name of activity" value={entry.activity} onChange={(e) => onUpdate('activity', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Input placeholder="Your role" value={entry.role || ''} onChange={(e) => onUpdate('role', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Organization</Label>
          <Input placeholder="Organization name" value={entry.organization || ''} onChange={(e) => onUpdate('organization', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" value={entry.start_date} onChange={(e) => onUpdate('start_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={entry.end_date || ''} onChange={(e) => onUpdate('end_date', e.target.value)} />
        </div>
      </div>
      <textarea
        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Description (optional)"
        value={entry.description || ''}
        onChange={(e) => onUpdate('description', e.target.value)}
      />
    </div>
  );
}

function AwardCard({ index, entry, title, onRemove, onUpdate }: ArrayEntryCardProps<AwardEntry>) {
  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Award Title *</Label>
          <Input placeholder="Name of award" value={entry.title} onChange={(e) => onUpdate('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Issuing Organization</Label>
          <Input placeholder="Who issued this" value={entry.issuing_organization || ''} onChange={(e) => onUpdate('issuing_organization', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={entry.date || ''} onChange={(e) => onUpdate('date', e.target.value)} />
        </div>
      </div>
      <textarea
        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Description (optional)"
        value={entry.description || ''}
        onChange={(e) => onUpdate('description', e.target.value)}
      />
    </div>
  );
}

function PublicationCard({ index, entry, title, onRemove, onUpdate }: ArrayEntryCardProps<PublicationEntry>) {
  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Title *</Label>
          <Input placeholder="Publication title" value={entry.title} onChange={(e) => onUpdate('title', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Publisher / Journal</Label>
          <Input placeholder="Publisher name" value={entry.publisher || ''} onChange={(e) => onUpdate('publisher', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Publication Date</Label>
          <Input type="date" value={entry.publication_date || ''} onChange={(e) => onUpdate('publication_date', e.target.value)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
          <Label className="text-xs">URL</Label>
          <Input placeholder="Link to publication" value={entry.url || ''} onChange={(e) => onUpdate('url', e.target.value)} />
        </div>
      </div>
      <textarea
        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Abstract / Description (optional)"
        value={entry.description || ''}
        onChange={(e) => onUpdate('description', e.target.value)}
      />
    </div>
  );
}

function ResearchCard({ index, entry, title, onRemove, onUpdate }: ArrayEntryCardProps<ResearchExperienceEntry>) {
  return (
    <div className="p-4 border rounded-lg space-y-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">{title}</span>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Research Topic *</Label>
          <Input placeholder="Topic of research" value={entry.topic} onChange={(e) => onUpdate('topic', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Institution</Label>
          <Input placeholder="Where conducted" value={entry.institution || ''} onChange={(e) => onUpdate('institution', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Supervisor</Label>
          <Input placeholder="Supervisor name" value={entry.supervisor || ''} onChange={(e) => onUpdate('supervisor', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Start Date</Label>
          <Input type="date" value={entry.start_date} onChange={(e) => onUpdate('start_date', e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">End Date</Label>
          <Input type="date" value={entry.end_date || ''} onChange={(e) => onUpdate('end_date', e.target.value)} />
        </div>
      </div>
      <textarea
        className="w-full min-h-[60px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        placeholder="Research description and findings"
        value={entry.description || ''}
        onChange={(e) => onUpdate('description', e.target.value)}
      />
    </div>
  );
}
