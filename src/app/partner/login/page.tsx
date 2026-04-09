'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Building2,
  Users,
  Globe,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const features = [
  {
    icon: Users,
    title: 'Student Management',
    description: 'Manage and track your students throughout their application journey.',
  },
  {
    icon: Globe,
    title: 'Global Network',
    description: 'Access our network of 500+ Chinese universities and programs.',
  },
  {
    icon: TrendingUp,
    title: 'Analytics Dashboard',
    description: 'Track performance metrics and gain insights into your operations.',
  },
];

export default function PartnerLoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      if (user.role === 'partner') {
        router.replace('/partner-v2');
      } else {
        // Non-partner user, redirect to their dashboard
        switch (user.role) {
          case 'admin':
            router.replace('/admin/v2');
            break;
          default:
            router.replace('/student-v2');
        }
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
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-chart-2 via-chart-2/90 to-chart-2/80 relative overflow-hidden">
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
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-xl bg-white/20 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Partner Portal</h1>
                <p className="text-white/70 text-sm">Study In China Academy</p>
              </div>
            </div>
          </div>

          {/* Headline */}
          <div className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Grow Your<br />
              <span className="text-white/90">Consultancy Business</span>
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Connect students with top Chinese universities and build your education consultancy with our powerful platform.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-chart-2/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-chart-2" />
              </div>
              <div className="text-left">
                <h1 className="text-xl font-bold">Partner Portal</h1>
                <p className="text-sm text-muted-foreground">SICA</p>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
            <p className="text-muted-foreground">
              Sign in to your partner account to manage students
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
              className="w-full h-12 text-base font-medium bg-chart-2 hover:bg-chart-2/90"
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

          {/* Other Portals */}
          <div className="mt-8 pt-6 border-t">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Looking for a different portal?
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/login">
                <Button variant="outline" className="w-full h-11">
                  Student
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button variant="outline" className="w-full h-11">
                  Admin
                </Button>
              </Link>
            </div>
          </div>

          {/* Apply Link */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Not a partner yet?{' '}
            <Link href="/partner/apply" className="text-chart-2 hover:underline font-semibold">
              Apply now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
