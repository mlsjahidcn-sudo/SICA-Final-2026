'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { UserPlus, Loader2 } from 'lucide-react';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';

interface PartnerOption {
  id: string;
  full_name: string;
  email: string;
  company_name?: string;
}

interface AdminStudentCreateDialogProps {
  trigger?: React.ReactNode;
  onCreateComplete: () => void;
}

export function AdminStudentCreateDialog({ trigger, onCreateComplete }: AdminStudentCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState<PartnerOption[]>([]);
  
  // Form fields
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');

  // Fetch partners when dialog opens
  useEffect(() => {
    if (open) fetchPartners();
  }, [open]);

  const fetchPartners = async () => {
    try {
      const token = await getValidToken();
      const response = await fetch('/api/admin/partners?limit=100&status=approved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setPartners(data.partners || []);
      }
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast.error('Failed to load partners');
    }
  };

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setPartnerId('');
    setPhone('');
    setNationality('');
    setGender('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (!fullName.trim()) {
      toast.error('Please enter the student\'s full name');
      return;
    }
    if (!partnerId) {
      toast.error('Please select a partner');
      return;
    }

    setLoading(true);
    try {
      const token = await getValidToken();
      const response = await fetch('/api/admin/partner-students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          full_name: fullName.trim(),
          partner_id: partnerId,
          phone: phone.trim() || null,
          nationality: nationality || null,
          gender: gender || null,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(`Student "${fullName}" created successfully`);
        setOpen(false);
        onCreateComplete();
      } else {
        toast.error(result.error || 'Failed to create student');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      toast.error('Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      Add Student
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Create New Student
          </DialogTitle>
          <DialogDescription>
            Add a new student profile and assign them to a partner organization.
            The student will receive an email with login credentials.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-5 py-4">
          {/* Partner Selection - Critical Field */}
          <div className="grid gap-2 rounded-lg bg-blue-50 dark:bg-blue-950/30 p-3 border border-blue-200 dark:border-blue-800">
            <Label htmlFor="partner_id" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
              Assign to Partner *
            </Label>
            <Select value={partnerId} onValueChange={setPartnerId}>
              <SelectTrigger id="partner_id">
                <SelectValue placeholder="Select a partner..." />
              </SelectTrigger>
              <SelectContent>
                {partners.map((partner) => (
                  <SelectItem key={partner.id} value={partner.id}>
                    <span className="flex items-center gap-2">
                      <span>{partner.company_name || partner.full_name}</span>
                      <span className="text-muted-foreground text-xs">({partner.email})</span>
                    </span>
                  </SelectItem>
                ))}
                {partners.length === 0 && (
                  <SelectItem value="_loading" disabled>Loading...</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Required Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="student@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 8900"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Select value={nationality} onValueChange={setNationality}>
                <SelectTrigger id="nationality">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="china">China</SelectItem>
                  <SelectItem value="nigeria">Nigeria</SelectItem>
                  <SelectItem value="pakistan">Pakistan</SelectItem>
                  <SelectItem value="india">India</SelectItem>
                  <SelectItem value="bangladesh">Bangladesh</SelectItem>
                  <SelectItem value="kenya">Kenya</SelectItem>
                  <SelectItem value="ghana">Ghana</SelectItem>
                  <SelectItem value="ethiopia">Ethiopia</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            * Required fields. Additional details can be added after creation by editing the student profile.
          </p>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !partnerId || !fullName.trim() || !email.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create Student
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
