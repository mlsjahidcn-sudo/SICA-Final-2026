'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface University {
  id: string;
  name_en: string;
  logo_url: string | null;
  city: string;
  slug: string;
}

export function UniversityLogoSlider() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Delay fetch to prevent Hostinger 429 rate limits on homepage load
    const timer = setTimeout(() => {
      fetchUniversities();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const fetchUniversities = async () => {
    try {
      const response = await fetch('/api/universities?limit=20');
      const data = await response.json();
      setUniversities(data.universities || []);
    } catch (error) {
      console.error('Error fetching universities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!scrollRef.current || universities.length === 0) return;

    const scrollContainer = scrollRef.current;
    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.3; // Pixels per frame

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // When we've scrolled through all items, reset to beginning
      if (scrollPosition >= scrollContainer.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      scrollContainer.scrollLeft = scrollPosition;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [universities]);

  // Duplicate universities array for seamless loop
  const displayUniversities = [...universities, ...universities];

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">
              Our Partner Universities
            </h2>
            <p className="text-muted-foreground">
              Trusted by leading universities across China
            </p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse flex gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-32 h-24 bg-muted rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (universities.length === 0) {
    return null;
  }

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-muted/30 to-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">
            Our Partner Universities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We work with over 200+ prestigious universities across China, including 985, 211, and Double First-Class institutions
          </p>
        </div>

        {/* Logo Slider */}
        <div 
          className="relative"
          onMouseEnter={() => {
            if (scrollRef.current) {
              scrollRef.current.style.animationPlayState = 'paused';
            }
          }}
          onMouseLeave={() => {
            if (scrollRef.current) {
              scrollRef.current.style.animationPlayState = 'running';
            }
          }}
        >
          {/* Gradient Overlays */}
          <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

          {/* Scroll Container */}
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-hidden scrollbar-hide"
            style={{
              scrollBehavior: 'auto',
            }}
          >
            {displayUniversities.map((university, index) => (
              <Link
                key={`${university.id}-${index}`}
                href={`/universities/${university.slug}`}
                className="group flex-shrink-0"
              >
                <div className="
                  w-32 sm:w-40 h-24 sm:h-28 
                  flex flex-col items-center justify-center 
                  bg-card border rounded-xl sm:rounded-2xl
                  transition-all duration-300
                  hover:shadow-lg hover:shadow-primary/5 hover:border-primary/30 hover:-translate-y-0.5
                  cursor-pointer
                ">
                  {university.logo_url && university.logo_url.trim() !== '' ? (
                    <div className="relative w-16 sm:w-20 h-16 sm:h-20 mb-2">
                      <Image
                        src={university.logo_url}
                        alt={university.name_en}
                        fill
                        className="object-contain p-1"
                        sizes="(max-width: 640px) 64px, 80px"
                      />
                    </div>
                  ) : (
                    <div className="w-16 sm:w-20 h-16 sm:h-20 mb-2 flex items-center justify-center bg-primary/5 rounded-lg">
                      <Building2 className="h-8 w-8 text-primary/40" />
                    </div>
                  )}
                  <p className="text-xs text-center text-muted-foreground line-clamp-1 px-2 group-hover:text-primary transition-colors">
                    {university.city}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 sm:gap-8">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">200+</div>
            <div className="text-sm text-muted-foreground">Partner Universities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">39</div>
            <div className="text-sm text-muted-foreground">985 Universities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">115</div>
            <div className="text-sm text-muted-foreground">211 Universities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-primary">31</div>
            <div className="text-sm text-muted-foreground">Provinces Covered</div>
          </div>
        </div>
      </div>
    </section>
  );
}
