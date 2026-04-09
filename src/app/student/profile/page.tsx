'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import {
  User,
  Phone,
  Calendar,
  MapPin,
  AlertCircle,
  Loader2,
  Save,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Globe,
  FileText,
  Users,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface StudentProfile {
  id: string;
  user_id: string;
  passport_number: string | null;
  passport_expiry_date: string | null;
  nationality: string | null;
  date_of_birth: string | null;
  gender: string | null;
  current_address: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  highest_education: string | null;
  institution_name: string | null;
  field_of_study: string | null;
  graduation_date: string | null;
  gpa: number | null;
  hsk_level: number | null;
  hsk_score: number | null;
  ielts_score: number | null;
  toefl_score: number | null;
}

interface ProfileData {
  user: UserProfile;
  studentProfile: StudentProfile | null;
  profileCompletion: number;
}

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const EDUCATION_LEVELS = [
  { value: 'high_school', label: 'High School' },
  { value: 'associate', label: 'Associate Degree' },
  { value: 'bachelor', label: 'Bachelor\'s Degree' },
  { value: 'master', label: 'Master\'s Degree' },
  { value: 'doctorate', label: 'Doctorate' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'relative', label: 'Relative' },
  { value: 'friend', label: 'Friend' },
  { value: 'other', label: 'Other' },
];

const HSK_LEVELS = [
  { value: '1', label: 'HSK 1' },
  { value: '2', label: 'HSK 2' },
  { value: '3', label: 'HSK 3' },
  { value: '4', label: 'HSK 4' },
  { value: '5', label: 'HSK 5' },
  { value: '6', label: 'HSK 6' },
];

export default function StudentProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [passportNumber, setPassportNumber] = useState('');
  const [passportExpiry, setPassportExpiry] = useState('');
  const [nationality, setNationality] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('');
  const [highestEducation, setHighestEducation] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [graduationDate, setGraduationDate] = useState('');
  const [gpa, setGpa] = useState('');
  const [hskLevel, setHskLevel] = useState('');
  const [hskScore, setHskScore] = useState('');
  const [ieltsScore, setIeltsScore] = useState('');
  const [toeflScore, setToeflScore] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'student') {
      router.push('/unauthorized');
    }
  }, [user, authLoading, router]);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/student/profile', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        
        // Populate form fields
        setFullName(data.user?.full_name || '');
        setPhone(data.user?.phone || '');
        
        if (data.studentProfile) {
          setPassportNumber(data.studentProfile.passport_number || '');
          setPassportExpiry(data.studentProfile.passport_expiry_date?.split('T')[0] || '');
          setNationality(data.studentProfile.nationality || '');
          setDateOfBirth(data.studentProfile.date_of_birth?.split('T')[0] || '');
          setGender(data.studentProfile.gender || '');
          setCurrentAddress(data.studentProfile.current_address || '');
          setEmergencyContactName(data.studentProfile.emergency_contact_name || '');
          setEmergencyContactPhone(data.studentProfile.emergency_contact_phone || '');
          setEmergencyContactRelationship(data.studentProfile.emergency_contact_relationship || '');
          setHighestEducation(data.studentProfile.highest_education || '');
          setInstitutionName(data.studentProfile.institution_name || '');
          setFieldOfStudy(data.studentProfile.field_of_study || '');
          setGraduationDate(data.studentProfile.graduation_date?.split('T')[0] || '');
          setGpa(data.studentProfile.gpa?.toString() || '');
          setHskLevel(data.studentProfile.hsk_level?.toString() || '');
          setHskScore(data.studentProfile.hsk_score?.toString() || '');
          setIeltsScore(data.studentProfile.ielts_score?.toString() || '');
          setToeflScore(data.studentProfile.toefl_score?.toString() || '');
        }
      } else {
        toast.error('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('sica_auth_token');
      
      const response = await fetch('/api/student/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          phone: phone || null,
          passport_number: passportNumber || null,
          passport_expiry_date: passportExpiry || null,
          nationality: nationality || null,
          date_of_birth: dateOfBirth || null,
          gender: gender || null,
          current_address: currentAddress || null,
          emergency_contact_name: emergencyContactName || null,
          emergency_contact_phone: emergencyContactPhone || null,
          emergency_contact_relationship: emergencyContactRelationship || null,
          highest_education: highestEducation || null,
          institution_name: institutionName || null,
          field_of_study: fieldOfStudy || null,
          graduation_date: graduationDate || null,
          gpa: gpa ? parseFloat(gpa) : null,
          hsk_level: hskLevel ? parseInt(hskLevel) : null,
          hsk_score: hskScore ? parseInt(hskScore) : null,
          ielts_score: ieltsScore ? parseFloat(ieltsScore) : null,
          toefl_score: toeflScore ? parseInt(toeflScore) : null,
        }),
      });
      
      if (response.ok) {
        toast.success('Profile updated successfully');
        setIsEditing(false);
        fetchProfile();
      } else {
        toast.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getCompletionColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-red-600';
  };

  const getCompletionMessage = (percentage: number) => {
    if (percentage >= 80) return 'Your profile is mostly complete!';
    if (percentage >= 50) return 'Keep going! Add more details to improve your profile.';
    return 'Complete your profile to improve your application chances.';
  };

  if (authLoading || !user || user.role !== 'student' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button variant="ghost" asChild className="mb-2 -ml-4">
              <Link href="/student/applications">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Applications
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">My Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your personal information and documents
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Profile Completion Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-xl font-semibold">{fullName || 'Student'}</h2>
                    <p className="text-muted-foreground">{profileData?.user?.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getCompletionColor(profileData?.profileCompletion || 0)}`}>
                      {profileData?.profileCompletion || 0}%
                    </p>
                    <p className="text-sm text-muted-foreground">Complete</p>
                  </div>
                </div>
                <Progress value={profileData?.profileCompletion || 0} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  {getCompletionMessage(profileData?.profileCompletion || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="personal" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="passport">
              <FileText className="h-4 w-4 mr-2" />
              Passport
            </TabsTrigger>
            <TabsTrigger value="education">
              <GraduationCap className="h-4 w-4 mr-2" />
              Education
            </TabsTrigger>
            <TabsTrigger value="language">
              <Globe className="h-4 w-4 mr-2" />
              Language
            </TabsTrigger>
          </TabsList>

          {/* Personal Information */}
          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Your basic contact and personal details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={profileData?.user?.email || ''}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={!isEditing}
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nationality">Nationality</Label>
                    <Input
                      id="nationality"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., United States"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <Select value={gender} onValueChange={setGender} disabled={!isEditing}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        {GENDER_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Current Address</Label>
                  <Input
                    id="address"
                    value={currentAddress}
                    onChange={(e) => setCurrentAddress(e.target.value)}
                    disabled={!isEditing}
                    placeholder="Your current residential address"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
                <CardDescription>
                  Someone we can contact in case of emergency
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      value={emergencyContactName}
                      onChange={(e) => setEmergencyContactName(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Phone Number</Label>
                    <Input
                      id="emergencyPhone"
                      value={emergencyContactPhone}
                      onChange={(e) => setEmergencyContactPhone(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyRelation">Relationship</Label>
                    <Select 
                      value={emergencyContactRelationship} 
                      onValueChange={setEmergencyContactRelationship} 
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        {RELATIONSHIP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Passport Information */}
          <TabsContent value="passport">
            <Card>
              <CardHeader>
                <CardTitle>Passport Information</CardTitle>
                <CardDescription>
                  Your passport details for application processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="passportNumber">Passport Number</Label>
                    <Input
                      id="passportNumber"
                      value={passportNumber}
                      onChange={(e) => setPassportNumber(e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., AB1234567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passportExpiry">Expiry Date</Label>
                    <Input
                      id="passportExpiry"
                      type="date"
                      value={passportExpiry}
                      onChange={(e) => setPassportExpiry(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                
                {passportExpiry && new Date(passportExpiry) < new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000) && (
                  <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
                    <AlertCircle className="h-5 w-5" />
                    <p className="text-sm">
                      Your passport will expire within 6 months. Please renew it before applying.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Education Background */}
          <TabsContent value="education">
            <Card>
              <CardHeader>
                <CardTitle>Education Background</CardTitle>
                <CardDescription>
                  Your academic qualifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="education">Highest Education Level</Label>
                    <Select 
                      value={highestEducation} 
                      onValueChange={setHighestEducation} 
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {EDUCATION_LEVELS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="institution">Institution Name</Label>
                    <Input
                      id="institution"
                      value={institutionName}
                      onChange={(e) => setInstitutionName(e.target.value)}
                      disabled={!isEditing}
                      placeholder="Your school/university name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fieldOfStudy">Field of Study</Label>
                    <Input
                      id="fieldOfStudy"
                      value={fieldOfStudy}
                      onChange={(e) => setFieldOfStudy(e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gradDate">Graduation Date</Label>
                    <Input
                      id="gradDate"
                      type="date"
                      value={graduationDate}
                      onChange={(e) => setGraduationDate(e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gpa">GPA (if applicable)</Label>
                    <Input
                      id="gpa"
                      type="number"
                      step="0.01"
                      min="0"
                      max="4"
                      value={gpa}
                      onChange={(e) => setGpa(e.target.value)}
                      disabled={!isEditing}
                      placeholder="e.g., 3.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Language Scores */}
          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>Language Proficiency</CardTitle>
                <CardDescription>
                  Your language test scores (optional but recommended)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Chinese Proficiency */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <span className="text-lg">🇨🇳</span> Chinese Proficiency (HSK)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hskLevel">HSK Level</Label>
                      <Select value={hskLevel} onValueChange={setHskLevel} disabled={!isEditing}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          {HSK_LEVELS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hskScore">HSK Score</Label>
                      <Input
                        id="hskScore"
                        type="number"
                        value={hskScore}
                        onChange={(e) => setHskScore(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g., 180"
                      />
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                {/* English Proficiency */}
                <div>
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <span className="text-lg">🇬🇧</span> English Proficiency
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ielts">IELTS Score</Label>
                      <Input
                        id="ielts"
                        type="number"
                        step="0.5"
                        min="0"
                        max="9"
                        value={ieltsScore}
                        onChange={(e) => setIeltsScore(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g., 6.5"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="toefl">TOEFL Score</Label>
                      <Input
                        id="toefl"
                        type="number"
                        min="0"
                        max="120"
                        value={toeflScore}
                        onChange={(e) => setToeflScore(e.target.value)}
                        disabled={!isEditing}
                        placeholder="e.g., 90"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Need Help?</h3>
                <p className="text-sm text-muted-foreground">
                  Contact us if you have questions about your profile
                </p>
              </div>
              <Button variant="outline" asChild>
                <a href="mailto:info@studyinchina.academy">
                  Contact Support
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
