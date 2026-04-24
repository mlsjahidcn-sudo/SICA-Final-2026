'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconStar,
  IconStarFilled,
  IconQuote,
  IconChevronLeft,
  IconChevronRight,
  IconPlayerPlay,
  IconMapPin,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Testimonial {
  id: string;
  userName: string;
  userAvatar: string | null;
  userCountry: string | null;
  userCountryCode: string | null;
  userRole: string | null;
  university: string | null;
  program: string | null;
  content: string;
  rating: number;
  videoUrl: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  source: string;
  createdAt: string;
}

interface TestimonialsSectionProps {
  locale?: string;
  showAll?: boolean;
  limit?: number;
  className?: string;
}

// Country flag emoji mapping
const countryFlags: Record<string, string> = {
  US: '🇺🇸',
  GB: '🇬🇧',
  DE: '🇩🇪',
  FR: '🇫🇷',
  ES: '🇪🇸',
  IT: '🇮🇹',
  JP: '🇯🇵',
  KR: '🇰🇷',
  CN: '🇨🇳',
  RU: '🇷🇺',
  BR: '🇧🇷',
  IN: '🇮🇳',
  AU: '🇦🇺',
  CA: '🇨🇦',
  EG: '🇪🇬',
  NG: '🇳🇬',
  ZA: '🇿🇦',
  MX: '🇲🇽',
  ID: '🇮🇩',
  TH: '🇹🇭',
  VN: '🇻🇳',
  PH: '🇵🇭',
  MY: '🇲🇾',
  SG: '🇸🇬',
  PK: '🇵🇰',
  BD: '🇧🇩',
  SA: '🇸🇦',
  AE: '🇦🇪',
  IR: '🇮🇷',
  TR: '🇹🇷',
};

function getCountryFlag(countryCode: string | null): string {
  if (!countryCode) return '🌍';
  return countryFlags[countryCode.toUpperCase()] || '🌍';
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>
          {star <= rating ? (
            <IconStarFilled className="h-4 w-4 text-amber-400" />
          ) : (
            <IconStar className="h-4 w-4 text-muted-foreground/30" />
          )}
        </span>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <Card className={cn(
      "h-full overflow-hidden transition-all duration-300 hover:shadow-lg",
      testimonial.isFeatured && "ring-2 ring-primary/20"
    )}>
      <CardContent className="p-6 flex flex-col h-full">
        {/* Quote Icon */}
        <div className="mb-4">
          <IconQuote className="h-8 w-8 text-primary/20" />
        </div>

        {/* Content */}
        <p className="text-foreground/90 leading-relaxed mb-4 flex-1 line-clamp-6">
          &ldquo;{testimonial.content}&rdquo;
        </p>

        {/* Video/Image */}
        {testimonial.videoUrl && (
          <div className="mb-4 relative rounded-lg overflow-hidden bg-muted">
            {showVideo ? (
              <video
                src={testimonial.videoUrl}
                controls
                autoPlay
                className="w-full aspect-video object-cover"
              />
            ) : (
              <div className="relative aspect-video">
                {testimonial.imageUrl ? (
                  <Image
                    src={testimonial.imageUrl}
                    alt={testimonial.userName}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <IconQuote className="h-16 w-16 text-primary/20" />
                  </div>
                )}
                <button
                  onClick={() => setShowVideo(true)}
                  className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
                >
                  <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                    <IconPlayerPlay className="h-8 w-8 text-primary ml-1" />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="mb-4">
          <StarRating rating={testimonial.rating} />
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 mt-auto pt-4 border-t">
          {/* Avatar */}
          <div className="relative">
            {testimonial.userAvatar ? (
              <Image
                src={testimonial.userAvatar}
                alt={testimonial.userName}
                width={48}
                height={48}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-lg font-semibold text-primary">
                {testimonial.userName.charAt(0)}
              </div>
            )}
            {/* Country Flag */}
            <span className="absolute -bottom-1 -right-1 text-lg">
              {getCountryFlag(testimonial.userCountryCode)}
            </span>
          </div>

          {/* Name and Details */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{testimonial.userName}</div>
            {testimonial.userRole && (
              <div className="text-sm text-muted-foreground truncate">
                {testimonial.userRole}
              </div>
            )}
            {testimonial.university && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                <IconMapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{testimonial.university}</span>
              </div>
            )}
          </div>
        </div>

        {/* Featured Badge */}
        {testimonial.isFeatured && (
          <div className="absolute top-3 right-3">
            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
              Featured
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TestimonialSkeleton() {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <Skeleton className="h-8 w-8 rounded mb-4" />
        <div className="space-y-3 mb-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex items-center gap-3 pt-4 border-t">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TestimonialsSection({
  locale = 'en',
  showAll = false,
  limit = 6,
  className,
}: TestimonialsSectionProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('locale', locale);
        params.append('limit', showAll ? '0' : limit.toString());
        
        const res = await fetch(`/api/testimonials?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    // Delay fetch to prevent Hostinger 429 rate limits on homepage load
    const timer = setTimeout(() => {
      fetchTestimonials();
    }, 1500);

    return () => clearTimeout(timer);
  }, [locale, showAll, limit]);

  // Auto-slide for featured testimonials
  useEffect(() => {
    if (testimonials.length <= 3) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.ceil(testimonials.length / 3));
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(Math.ceil(testimonials.length / 3) - 1, prev + 1));
  };

  if (loading) {
    return (
      <section className={cn("py-16 bg-muted/30", className)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <TestimonialSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-16 bg-muted/30", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            What Our Students Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Hear from students who have successfully started their journey to study in China with our help
          </p>
        </div>

        {/* Testimonials Grid */}
        {showAll ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        ) : (
          <div className="relative">
            {/* Navigation Arrows */}
            {testimonials.length > 3 && (
              <>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 bg-background shadow-lg hidden lg:flex"
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                >
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-background shadow-lg hidden lg:flex"
                  onClick={handleNext}
                  disabled={currentIndex >= Math.ceil(testimonials.length / 3) - 1}
                >
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Cards Container */}
            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{
                  transform: `translateX(-${currentIndex * 100}%)`,
                }}
              >
                {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, pageIndex) => (
                  <div key={pageIndex} className="w-full flex-shrink-0">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {testimonials
                        .slice(pageIndex * 3, (pageIndex + 1) * 3)
                        .map((testimonial) => (
                          <TestimonialCard key={testimonial.id} testimonial={testimonial} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dots Indicator */}
            {testimonials.length > 3 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: Math.ceil(testimonials.length / 3) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all",
                      i === currentIndex
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        {!showAll && (
          <div className="text-center mt-10">
            <Button variant="outline" asChild>
              <Link href="/testimonials">
                Read More Stories
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Compact version for sidebar or smaller spaces
export function TestimonialsCompact({ locale = 'en', limit = 3 }: { locale?: string; limit?: number }) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('locale', locale);
        params.append('featured', 'true');
        params.append('limit', limit.toString());
        
        const res = await fetch(`/api/testimonials?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setTestimonials(data.testimonials || []);
        }
      } catch (error) {
        console.error('Error fetching testimonials:', error);
      } finally {
        setLoading(false);
      }
    };

    // Delay fetch to prevent Hostinger 429 rate limits
    const timer = setTimeout(() => {
      fetchTestimonials();
    }, 2000);

    return () => clearTimeout(timer);
  }, [locale, limit]);

  if (loading || testimonials.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {testimonials.map((testimonial) => (
        <div key={testimonial.id} className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-2xl">{getCountryFlag(testimonial.userCountryCode)}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm truncate">{testimonial.userName}</span>
                <StarRating rating={testimonial.rating} />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {testimonial.content}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TestimonialsSection;
