'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppSidebar } from '@/components/dashboard-v2-sidebar';
import { SiteHeader } from '@/components/dashboard-v2-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Hash,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { getValidToken } from '@/lib/auth-token';
import { toast } from 'sonner';

interface StudentDetail {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  referred_by_partner_id: string | null;
  nationality: string | null;
  gender: string | null;
  date_of_birth: string | null;
  country: string | null;
  city: string | null;
  current_address: string | null;
  wechat_id: string | null;
  passport_number: string | null;
  highest_education: string | null;
  institution_name: string | null;
  created_at?: string;
}

function EditStudentContent() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nationality, setNationality] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [wechatId, setWechatId] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [highestEducation, setHighestEducation] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const fetchStudent = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/admin/partner-students?id=${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.student) {
          const s = data.student;
          setStudent(s);
          setFullName(s.full_name || '');
          setEmail(s.email || '');
          setPhone(s.phone || '');
          setNationality(s.nationality || '');
          setGender(s.gender || '');
          setDateOfBirth(s.date_of_birth ? s.date_of_birth.split('T')[0] : '');
          setCountry(s.country || '');
          setCity(s.city || '');
          setCurrentAddress(s.current_address || '');
          setWechatId(s.wechat_id || '');
          setPassportNumber(s.passport_number || '');
          setHighestEducation(s.highest_education || '');
          setInstitutionName(s.institution_name || '');
          setIsActive(s.is_active);
        }
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      toast.error('Failed to load student data');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    if (studentId) fetchStudent();
  }, [studentId, fetchStudent]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      toast.error('Full name is required');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      toast.error('Valid email is required');
      return;
    }

    setSaving(true);
    try {
      const token = await getValidToken();
      const res = await fetch(`/api/admin/partner-students/${studentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          nationality: nationality || null,
          gender: gender || null,
          date_of_birth: dateOfBirth || null,
          country: country.trim() || null,
          city: city.trim() || null,
          current_address: currentAddress.trim() || null,
          wechat_id: wechatId.trim() || null,
          passport_number: passportNumber.trim() || null,
          highest_education: highestEducation.trim() || null,
          institution_name: institutionName.trim() || null,
          is_active: isActive,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        toast.success('Student updated successfully');
        setHasChanges(false);
        router.push(`/admin/v2/partner-students/${studentId}`);
      } else {
        toast.error(result.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <User className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold">Student Not Found</h3>
        <Button className="mt-4" asChild>
          <Link href="/admin/v2/partner-students">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to Students
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/v2/partner-students/${studentId}`}>
              <ArrowLeft className="mr-1 h-4 w-4" />Back
            </Link>
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Edit Student</h2>
            <p className="text-muted-foreground mt-1">
              Update profile information for {student.full_name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/v2/partner-students/${studentId}`}>Cancel</Link>
          </Button>
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="mr-2 h-4 w-4" />Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Personal Information
              </CardTitle>
              <CardDescription>Basic identity and contact details</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setHasChanges(true); }}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setHasChanges(true); }}
                      placeholder="student@example.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setHasChanges(true); }}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Select value={nationality} onValueChange={(v) => { setNationality(v); setHasChanges(true); }}>
                      <SelectTrigger id="nationality"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        <SelectItem value="china">China</SelectItem>
                        <SelectItem value="nigeria">Nigeria</SelectItem>
                        <SelectItem value="pakistan">Pakistan</SelectItem>
                        <SelectItem value="india">India</SelectItem>
                        <SelectItem value="bangladesh">Bangladesh</SelectItem>
                        <SelectItem value="kenya">Kenya</SelectItem>
                        <SelectItem value="ghana">Ghana</SelectItem>
                        <SelectItem value="ethiopia">Ethiopia</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={(v) => { setGender(v); setHasChanges(true); }}>
                      <SelectTrigger id="gender"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Not specified</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Location & Documents */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-blue-500" />
                Location & Documents
              </CardTitle>
              <CardDescription>Address, identification, and education details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => { setDateOfBirth(e.target.value); setHasChanges(true); }}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="passport_number">Passport Number</Label>
                    <Input
                      id="passport_number"
                      value={passportNumber}
                      onChange={(e) => { setPassportNumber(e.target.value); setHasChanges(true); }}
                      placeholder="AB1234567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => { setCountry(e.target.value); setHasChanges(true); }}
                      placeholder="Country of residence"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => { setCity(e.target.value); setHasChanges(true); }}
                      placeholder="City"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="current_address">Current Address</Label>
                  <textarea
                    id="current_address"
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                    value={currentAddress}
                    onChange={(e) => { setCurrentAddress(e.target.value); setHasChanges(true); }}
                    placeholder="Street address..."
                    rows={2}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="wechat_id">WeChat ID</Label>
                    <Input
                      id="wechat_id"
                      value={wechatId}
                      onChange={(e) => { setWechatId(e.target.value); setHasChanges(true); }}
                      placeholder="wxid_..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="highest_education">Highest Education</Label>
                    <Input
                      id="highest_education"
                      value={highestEducation}
                      onChange={(e) => { setHighestEducation(e.target.value); setHasChanges(true); }}
                      placeholder="Bachelor&apos;s Degree"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="institution_name">Institution Name</Label>
                  <Input
                    id="institution_name"
                    value={institutionName}
                    onChange={(e) => { setInstitutionName(e.target.value); setHasChanges(true); }}
                    placeholder="University or school name"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Account Active</span>
                <button
                  onClick={() => { setIsActive(!isActive); setHasChanges(true); }}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    isActive ? 'bg-emerald-500' : 'bg-gray-300'
                  } focus:outline-none`}
                  role="switch"
                  aria-checked={isActive}
                >
                  <span
                    className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${
                      isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isActive ? 'This account can log in and access the platform.' : 'This account is suspended and cannot log in.'}
              </p>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Quick Reference</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">User ID</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{student.user_id.slice(0, 8)}...</code>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Partner Referred</span>
                <Badge variant="outline" className="text-xs">Yes</Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{student.created_at ? new Date(student.created_at).toLocaleDateString() : '-'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Import Badge locally to avoid circular dependencies
import { Badge } from '@/components/ui/badge';

export default function AdminEditStudentPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

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
          <SiteHeader title="Edit Student" />
          <EditStudentContent />
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
