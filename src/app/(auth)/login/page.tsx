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
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Globe,
  GraduationCap,
  Award,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const features = [
  {
    icon: Globe,
    title: '200+ Universities',
    description: 'Access top Chinese universities from 985 to Double First-Class institutions.',
  },
  {
    icon: GraduationCap,
    title: '2,000+ Programs',
    description: 'Find the perfect program in Engineering, Medicine, Business, and more.',
  },
  {
    icon: Award,
    title: 'Scholarship Support',
    description: 'Exclusive scholarship opportunities and financial aid guidance.',
  },
];

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  // Show message from auth callback
  const invited = searchParams.get('invited');
  const callbackError = searchParams.get('error');
  const callbackErrorDesc = searchParams.get('error_description');

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      // Redirect based on role
      switch (user.role) {
        case 'admin':
          router.replace('/admin/v2');
          break;
        case 'partner':
          router.replace('/partner-v2');
          break;
        default:
          router.replace('/student-v2');
      }
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render form if user is logged in (waiting for redirect)
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // Don't set loading to false or redirect here
      // The useEffect will handle redirect based on user role
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-800 via-slate-800/95 to-slate-900 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
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

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/5 backdrop-blur flex items-center justify-center border border-white/10">
                  <feature.icon className="h-6 w-6 text-white/80" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                  <p className="text-white/60 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Security Notice */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center gap-3 text-white/60">
              <Shield className="h-5 w-5" />
              <p className="text-sm">
                Secure access with role-based permissions for all users
              </p>
            </div>
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
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your account to continue your journey
            </p>
          </div>

          {/* Invite Success Alert */}
          {invited && (
            <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
              <AlertDescription>
                Your account has been confirmed! Please log in with your credentials.
              </AlertDescription>
            </Alert>
          )}

          {/* Auth Callback Error Alert */}
          {callbackError && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                {callbackErrorDesc || 'Authentication failed. Please try again.'}
              </AlertDescription>
            </Alert>
          )}

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 text-base"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 text-base"
                  required
                  disabled={loading}
                />
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
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </p>

          {/* Partner Registration Link */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-center text-sm text-muted-foreground">
              Are you an educational agency?{' '}
              <Link href="/partner/register" className="text-primary hover:underline font-semibold">
                Register as a Partner
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
