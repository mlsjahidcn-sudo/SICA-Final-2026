'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Shield,
  Users,
  CheckCircle2,
  Facebook,
  Youtube,
  Instagram,
  Linkedin,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// TikTok icon component (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
    </svg>
  );
}

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com', icon: Facebook },
  { name: 'TikTok', href: 'https://tiktok.com', icon: TikTokIcon },
  { name: 'YouTube', href: 'https://youtube.com', icon: Youtube },
  { name: 'Instagram', href: 'https://instagram.com', icon: Instagram },
  { name: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin },
];

const trustBadges = [
  { icon: Shield, text: 'Secure & Verified' },
  { icon: Users, text: '5000+ Students' },
  { icon: CheckCircle2, text: 'Official Partner' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setIsSubmitting(true);
    try {
      // Simulate subscription - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSubmitStatus('success');
      setEmail('');
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  };

  return (
    <footer className="bg-background border-t">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-x-8 gap-y-10 lg:gap-x-12">
          
          {/* Brand Column */}
          <div className="sm:col-span-2 lg:col-span-1 space-y-5">
            <Link prefetch={false} href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="SICA - Study in China Academy"
                width={120}
                height={48}
                className="h-10 w-auto"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Your trusted partner for studying in China. We help international students find their dream universities.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-1">
              {socialLinks.map((social) => (
                <Link prefetch={false}
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { name: 'Universities', href: '/universities' },
                { name: 'Programs', href: '/programs' },
                { name: 'Scholarships', href: '/programs?scholarship=true' },
                { name: 'Resources', href: '/blog' },
              ].map((link) => (
                <li key={link.name}>
                  <Link prefetch={false}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="space-y-3">
              {[
                { name: 'Free Assessment', href: '/assessment' },
                { name: 'Study Guide', href: '/blog?category=guide' },
                { name: 'Blog', href: '/blog' },
              ].map((link) => (
                <li key={link.name}>
                  <Link prefetch={false}
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Column */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Contact</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href="mailto:info@studyinchina.academy" className="hover:text-primary transition-colors">
                  info@studyinchina.academy
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <a href="tel:+8617325764171" className="hover:text-primary transition-colors">
                  +8617325764171
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <address className="not-italic leading-relaxed">
                  Guangzhou, China
                </address>
              </li>
            </ul>
          </div>

          {/* Stay Updated Column */}
          <div className="space-y-5">
            <h3 className="text-sm font-semibold text-foreground">Stay Updated</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Get the latest scholarship news and application tips.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-background"
                  required
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={isSubmitting}
                  className="shrink-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {submitStatus === 'success' && (
                <p className="text-xs text-green-600">Successfully subscribed!</p>
              )}
              {submitStatus === 'error' && (
                <p className="text-xs text-destructive">Subscription failed. Please try again.</p>
              )}
            </form>
            <p className="text-xs text-muted-foreground pt-1">
              We respect your privacy. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Trust Badges Section */}
      <div className="border-t border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-8 md:gap-16">
            {trustBadges.map((badge, index) => (
              <div key={index} className="flex items-center gap-1 sm:gap-2.5 text-primary">
                <badge.icon className="h-3 w-3 sm:h-5 sm:w-5" />
                <span className="text-[10px] sm:text-sm font-medium whitespace-nowrap">{badge.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-row justify-between items-center gap-2">
          <p className="text-[10px] sm:text-sm text-muted-foreground whitespace-nowrap">
            © {new Date().getFullYear()} Study in China Academy. All rights reserved.
          </p>
          <Link prefetch={false}
            href="/contact"
            className="text-[10px] sm:text-sm text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
