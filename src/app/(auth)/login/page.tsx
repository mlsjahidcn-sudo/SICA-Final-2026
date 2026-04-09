'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Globe,
  GraduationCap,
  Award,
  Building2,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

const features = [
  {
    icon: Globe,
    title: '500+ Universities',
    description: 'Access top Chinese universities from 985 to Double First-Class institutions.',
  },
  {
    icon: GraduationCap,
    title: '10,000+ Programs',
    description: 'Find the perfect program in Engineering, Medicine, Business, and more.',
  },
  {
    icon: Award,
    title: 'Scholarship Support',
    description: 'Exclusive scholarship opportunities and financial aid guidance.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, signIn } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPortalDialog, setShowPortalDialog] = useState(false);

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

          {/* Stats */}
          <div className="mt-12 pt-8 border-t border-white/20">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-white">50K+</div>
                <div className="text-sm text-white/60">Students Placed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">95%</div>
                <div className="text-sm text-white/60">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">100+</div>
                <div className="text-sm text-white/60">Countries</div>
              </div>
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

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">or continue with</span>
            </div>
          </div>

          {/* Other Portals */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => setShowPortalDialog(true)}
          >
            <Building2 className="mr-2 h-5 w-5" />
            Partner or Admin Portal
          </Button>

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary hover:underline font-semibold">
              Create an account
            </Link>
          </p>
        </div>
      </div>

      {/* Portal Selection Dialog */}
      <Dialog open={showPortalDialog} onOpenChange={setShowPortalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Portal</DialogTitle>
            <DialogDescription>
              Choose the portal you want to access
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Link href="/partner/login" onClick={() => setShowPortalDialog(false)}>
              <Button variant="outline" className="w-full h-16 justify-start text-left">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">Partner Portal</div>
                    <div className="text-xs text-muted-foreground">For consultancy partners</div>
                  </div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/login" onClick={() => setShowPortalDialog(false)}>
              <Button variant="outline" className="w-full h-16 justify-start text-left">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="font-semibold">Admin Portal</div>
                    <div className="text-xs text-muted-foreground">For platform administrators</div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
