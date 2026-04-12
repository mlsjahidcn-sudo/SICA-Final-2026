'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle2, Send } from 'lucide-react';

interface LeadCaptureFormProps {
  degreeLevel?: string;
  majorInterest?: string;
  programIds?: string[];
  universityIds?: string[];
  sessionId?: string;
  onSubmit: (lead: LeadFormData) => void;
  onCancel: () => void;
}

export interface LeadFormData {
  name: string;
  email: string;
  whatsapp_number: string;
  nationality: string;
  degree_level: string;
  major_interest: string;
  preferred_language: string;
  budget_range: string;
  preferred_programs?: string[];
  preferred_universities?: string[];
  chat_session_id?: string;
  source: string;
}

const COUNTRY_CODES = [
  { code: '+1', label: '+1 (US/CA)' },
  { code: '+44', label: '+44 (UK)' },
  { code: '+86', label: '+86 (China)' },
  { code: '+91', label: '+91 (India)' },
  { code: '+880', label: '+880 (BD)' },
  { code: '+234', label: '+234 (Nigeria)' },
  { code: '+20', label: '+20 (Egypt)' },
  { code: '+212', label: '+212 (Morocco)' },
  { code: '+254', label: '+254 (Kenya)' },
  { code: '+27', label: '+27 (South Africa)' },
  { code: '+7', label: '+7 (Russia)' },
  { code: '+82', label: '+82 (Korea)' },
  { code: '+81', label: '+81 (Japan)' },
  { code: '+62', label: '+62 (Indonesia)' },
  { code: '+60', label: '+60 (Malaysia)' },
  { code: '+66', label: '+66 (Thailand)' },
  { code: '+84', label: '+84 (Vietnam)' },
  { code: '+63', label: '+63 (Philippines)' },
  { code: '+92', label: '+92 (Pakistan)' },
  { code: '+977', label: '+977 (Nepal)' },
  { code: '+856', label: '+856 (Laos)' },
  { code: '+95', label: '+95 (Myanmar)' },
  { code: '+93', label: '+93 (Afghanistan)' },
  { code: '+98', label: '+98 (Iran)' },
  { code: '+964', label: '+964 (Iraq)' },
  { code: '+966', label: '+966 (Saudi)' },
  { code: '+971', label: '+971 (UAE)' },
  { code: '+90', label: '+90 (Turkey)' },
  { code: '+55', label: '+55 (Brazil)' },
  { code: '+52', label: '+52 (Mexico)' },
  { code: '+54', label: '+54 (Argentina)' },
  { code: '+56', label: '+56 (Chile)' },
  { code: '+51', label: '+51 (Peru)' },
  { code: '+57', label: '+57 (Colombia)' },
  { code: '+33', label: '+33 (France)' },
  { code: '+49', label: '+49 (Germany)' },
  { code: '+39', label: '+39 (Italy)' },
  { code: '+34', label: '+34 (Spain)' },
  { code: '+31', label: '+31 (Netherlands)' },
  { code: '+41', label: '+41 (Switzerland)' },
  { code: '+46', label: '+46 (Sweden)' },
  { code: '+48', label: '+48 (Poland)' },
  { code: '+380', label: '+380 (Ukraine)' },
  { code: '+61', label: '+61 (Australia)' },
  { code: '+64', label: '+64 (NZ)' },
];

export function LeadCaptureForm({
  degreeLevel,
  majorInterest,
  programIds,
  universityIds,
  sessionId,
  onSubmit,
  onCancel,
}: LeadCaptureFormProps) {
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    degree_level: degreeLevel || '',
    major_interest: majorInterest || '',
  });
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) newErrors.name = 'Name is required';
    if (!formData.email?.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!phoneLocal.trim()) newErrors.whatsapp_number = 'WhatsApp number is required';
    else if (!/^[\d\s-]{5,12}$/.test(phoneLocal.replace(/\s/g, ''))) newErrors.whatsapp_number = 'Invalid number format';
    if (!formData.degree_level) newErrors.degree_level = 'Degree level is required';
    if (!formData.major_interest?.trim()) newErrors.major_interest = 'Major/field of interest is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const fullWhatsapp = `${countryCode}${phoneLocal.replace(/\s/g, '')}`;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          whatsapp_number: fullWhatsapp,
          preferred_programs: programIds,
          preferred_universities: universityIds,
          chat_session_id: sessionId,
          source: 'chat',
        }),
      });

      if (res.ok) {
        setIsSuccess(true);
        onSubmit({
          name: formData.name || '',
          email: formData.email || '',
          whatsapp_number: fullWhatsapp,
          nationality: formData.nationality || '',
          degree_level: formData.degree_level || '',
          major_interest: formData.major_interest || '',
          preferred_language: formData.preferred_language || '',
          budget_range: formData.budget_range || '',
          preferred_programs: programIds,
          preferred_universities: universityIds,
          chat_session_id: sessionId,
          source: 'chat',
        });
      } else {
        const data = await res.json();
        setErrors({ form: data.error || 'Failed to submit. Please try again.' });
      }
    } catch {
      setErrors({ form: 'Network error. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="rounded-xl border bg-card p-4 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto" />
        <p className="font-medium text-sm">Thank you, {formData.name}!</p>
        <p className="text-xs text-muted-foreground">
          Our team will reach out via WhatsApp with personalized program recommendations.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="text-center">
        <p className="font-medium text-sm">Get Personalized Guidance</p>
        <p className="text-xs text-muted-foreground">
          We&apos;ll contact you via WhatsApp with the best program matches.
        </p>
      </div>

      {errors.form && (
        <p className="text-xs text-destructive text-center">{errors.form}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {/* Name */}
        <div className="space-y-1">
          <Label className="text-xs">Name *</Label>
          <Input
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="h-8 text-sm"
          />
          {errors.name && <p className="text-[10px] text-destructive">{errors.name}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-xs">Email *</Label>
          <Input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="h-8 text-sm"
          />
          {errors.email && <p className="text-[10px] text-destructive">{errors.email}</p>}
        </div>

        {/* WhatsApp */}
        <div className="space-y-1">
          <Label className="text-xs">WhatsApp Number *</Label>
          <div className="flex gap-1.5">
            <Select value={countryCode} onValueChange={setCountryCode}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code} className="text-xs">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={phoneLocal}
              onChange={(e) => setPhoneLocal(e.target.value)}
              placeholder="Phone number"
              className="h-8 text-sm flex-1"
            />
          </div>
          {errors.whatsapp_number && <p className="text-[10px] text-destructive">{errors.whatsapp_number}</p>}
        </div>

        {/* Degree Level */}
        <div className="space-y-1">
          <Label className="text-xs">Degree Level *</Label>
          <Select
            value={formData.degree_level || ''}
            onValueChange={(v) => setFormData({ ...formData, degree_level: v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select degree" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bachelor">Bachelor&apos;s</SelectItem>
              <SelectItem value="master">Master&apos;s</SelectItem>
              <SelectItem value="phd">PhD</SelectItem>
              <SelectItem value="non-degree">Non-degree / Language</SelectItem>
            </SelectContent>
          </Select>
          {errors.degree_level && <p className="text-[10px] text-destructive">{errors.degree_level}</p>}
        </div>

        {/* Major */}
        <div className="space-y-1">
          <Label className="text-xs">Major / Field of Interest *</Label>
          <Input
            value={formData.major_interest || ''}
            onChange={(e) => setFormData({ ...formData, major_interest: e.target.value })}
            placeholder="e.g. Computer Science, Business, Medicine"
            className="h-8 text-sm"
          />
          {errors.major_interest && <p className="text-[10px] text-destructive">{errors.major_interest}</p>}
        </div>

        {/* Nationality (optional) */}
        <div className="space-y-1">
          <Label className="text-xs">Nationality</Label>
          <Input
            value={formData.nationality || ''}
            onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
            placeholder="Your country"
            className="h-8 text-sm"
          />
        </div>

        {/* Preferred Language */}
        <div className="space-y-1">
          <Label className="text-xs">Preferred Language of Instruction</Label>
          <Select
            value={formData.preferred_language || ''}
            onValueChange={(v) => setFormData({ ...formData, preferred_language: v })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="chinese">Chinese</SelectItem>
              <SelectItem value="either">Either is fine</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" size="sm" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
            ) : (
              <Send className="h-3.5 w-3.5 mr-1" />
            )}
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
}
