'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  IconUser,
  IconBuilding,
  IconMapPin,
  IconLink,
  IconMail,
  IconPhone,
  IconCamera,
  IconRefresh,
  IconCheck,
  IconLoader2,
  IconShield,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

interface PartnerProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  company_name: string | null;
  position: string | null;
  address: string | null;
  website: string | null;
}

const DEFAULT_PROFILE: PartnerProfile = {
  id: '',
  full_name: '',
  email: '',
  phone: '',
  avatar_url: '',
  company_name: '',
  position: '',
  address: '',
  website: '',
};

export default function ProfilePage() {
  const { refreshUser, user: authUser } = useAuth();
  const isPartnerAdmin = !(authUser as unknown as Record<string, unknown>)?.partner_role || (authUser as unknown as Record<string, unknown>)?.partner_role === 'partner_admin';
  const [profile, setProfile] = useState<PartnerProfile>(DEFAULT_PROFILE);
  const [originalProfile, setOriginalProfile] = useState<PartnerProfile>(DEFAULT_PROFILE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      // Add cache-busting query param
      const response = await fetch(`/api/partner/profile?t=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store',
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile || DEFAULT_PROFILE);
        setOriginalProfile(data.profile || DEFAULT_PROFILE);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error fetching profile:', errorData);
        toast.error(errorData.details || errorData.error || 'Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (field: keyof PartnerProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      
      const response = await fetch('/api/partner/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
        cache: 'no-store',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        if (data.warning) {
          toast.warning(data.warning);
        } else {
          toast.success('Profile saved successfully');
        }
        // Use the updated profile from the server response if available
        if (data.profile) {
          setProfile(data.profile);
          setOriginalProfile(data.profile);
        } else {
          setOriginalProfile(profile);
        }
        setHasChanges(false);
        // Refresh auth context to update sidebar
        await refreshUser();
        // Force a refresh from the server after a short delay
        setTimeout(() => fetchProfile(), 500);
      } else {
        const errorMsg = data.details || data.error || 'Failed to save profile';
        toast.error(errorMsg);
        console.error('[Profile] Save error:', data);
      }
    } catch (error) {
      console.error('[Profile] Save error:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setProfile(originalProfile);
    setHasChanges(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const { getValidToken } = await import('@/lib/auth-token'); const token = await getValidToken();
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/partner/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(prev => ({ ...prev, avatar_url: data.url }));
        setHasChanges(true);
        toast.success('Avatar uploaded successfully');
        // Refresh auth context to update sidebar
        await refreshUser();
      } else {
        toast.error('Failed to upload avatar');
      }
    } catch {
      toast.error('Failed to upload avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'P';
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold">Profile</h1>
          <p className="text-muted-foreground text-sm">
            {isPartnerAdmin ? 'Manage your personal and organization information' : 'Manage your personal information'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchProfile()}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {hasChanges && (
            <>
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <IconCheck className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-4 lg:px-6 pb-6 space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Upload a photo to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  variant="secondary"
                  size="icon-sm"
                  className="absolute -bottom-1 -right-1 rounded-full"
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <IconLoader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <IconCamera className="h-4 w-4" />
                  )}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Upload a new avatar</p>
                <p className="text-xs text-muted-foreground">
                  JPG, GIF or PNG. Max size 5MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconUser className="h-5 w-5" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Your personal contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <IconPhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Organization Information — Admin only */}
        {isPartnerAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconBuilding className="h-5 w-5" />
              Organization Information
            </CardTitle>
            <CardDescription>
              Details about your company or organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                    <div className="h-10 w-full bg-muted animate-pulse rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <div className="relative">
                    <IconBuilding className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="company_name"
                      value={profile.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                      placeholder="Enter company name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={profile.position || ''}
                    onChange={(e) => handleChange('position', e.target.value)}
                    placeholder="Enter your position"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <IconMapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={profile.address || ''}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="Enter company address"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <IconLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={profile.website || ''}
                      onChange={(e) => handleChange('website', e.target.value)}
                      placeholder="https://example.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Account Status
            </CardTitle>
            <CardDescription>
              Your account information and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="default">{isPartnerAdmin ? 'Partner Admin' : 'Team Member'}</Badge>
                <span className="text-sm text-muted-foreground">Account Type</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                  Active
                </Badge>
                <span className="text-sm text-muted-foreground">Status</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
