'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Lock,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Globe,
  GraduationCap,
  Award,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    // Check if we have the necessary parameters from Supabase
    const hasToken = searchParams.has('token');
    const hasType = searchParams.has('type');
    
    if (!hasToken || !hasType) {
      setTokenMissing(true);
    }
    
    // Redirect if already logged in
    if (user) {
      router.replace('/student-v2');
    }
  }, [searchParams, user, router]);

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/[A-Z]/.test(pwd)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(pwd)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(pwd)) {
      return 'Password must contain at least one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate passwords
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }

      // Use Supabase client directly to update password
      const { getSupabaseClient } = await import('@/storage/database/supabase-client');
      const supabase = getSupabaseClient();
      
      if (!supabase) {
        setError('Authentication service not available');
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: password
      });

      if (updateError) {
        setError(updateError.message || 'Failed to reset password');
        setLoading(false);
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error('Reset password error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (tokenMissing) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Brand Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            {/* Logo */}
            <div className="mb-12">
              <Image
                src="/logo.png"
                alt="SICA"
                width={180}
                height={72}
                className="h-14 w-auto brightness-0 invert"
                priority
              />
            </div>

            {/* Headline */}
            <div className="mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Your Gateway to<br />
                <span className="text-white/90">Chinese Education</span>
              </h1>
              <p className="text-lg text-white/80 max-w-md">
                Discover world-class universities, find perfect programs, and get expert guidance throughout your application journey.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Error Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="SICA"
                  width={140}
                  height={56}
                  className="h-12 w-auto mx-auto"
                  priority
                />
              </Link>
            </div>

            {/* Error Icon */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Lock className="w-10 h-10 text-amber-600" />
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Invalid reset link</h2>
              <p className="text-muted-foreground">
                This password reset link is invalid or has expired
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-4">
              <Button
                type="button"
                className="w-full h-12 text-base font-medium"
                onClick={() => router.push('/forgot-password')}
              >
                Request new reset link
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-12 text-base"
                onClick={() => router.push('/login')}
              >
                <ArrowLeft className="mr-2 h-5 w-5" />
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex">
        {/* Left Side - Brand Section */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0">
            <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
            {/* Logo */}
            <div className="mb-12">
              <Image
                src="/logo.png"
                alt="SICA"
                width={180}
                height={72}
                className="h-14 w-auto brightness-0 invert"
                priority
              />
            </div>

            {/* Headline */}
            <div className="mb-12">
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
                Your Gateway to<br />
                <span className="text-white/90">Chinese Education</span>
              </h1>
              <p className="text-lg text-white/80 max-w-md">
                Discover world-class universities, find perfect programs, and get expert guidance throughout your application journey.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Success Message */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
          <div className="w-full max-w-md text-center">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="SICA"
                  width={140}
                  height={56}
                  className="h-12 w-auto mx-auto"
                  priority
                />
              </Link>
            </div>

            {/* Success Icon */}
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground mb-2">Password reset complete!</h2>
              <p className="text-muted-foreground">
                Your password has been successfully updated. You can now sign in with your new password.
              </p>
            </div>

            {/* Success Alert */}
            <Alert className="mb-8 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                For security reasons, we&apos;ve logged you out of all other devices. Please sign in again with your new password.
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <Button
              type="button"
              className="w-full h-12 text-base font-medium"
              onClick={() => router.push('/login')}
            >
              Go to Sign In
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-primary/80 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20">
          {/* Logo */}
          <div className="mb-12">
            <Image
              src="/logo.png"
              alt="SICA"
              width={180}
              height={72}
              className="h-14 w-auto brightness-0 invert"
              priority
            />
          </div>

          {/* Headline */}
          <div className="mb-12">
            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Your Gateway to<br />
              <span className="text-white/90">Chinese Education</span>
            </h1>
            <p className="text-lg text-white/80 max-w-md">
              Discover world-class universities, find perfect programs, and get expert guidance throughout your application journey.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/">
              <Image
                src="/logo.png"
                alt="SICA"
                width={140}
                height={56}
                className="h-12 w-auto mx-auto"
                priority
              />
            </Link>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Create new password</h2>
            <p className="text-muted-foreground">
              Your new password must be different from previously used passwords
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">New password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Resetting password...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <Link
              href="/login"
              className="text-sm text-primary hover:underline font-medium inline-flex items-center"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
