'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  IconBuilding,
  IconSchool,
  IconBuildingBank,
  IconBuildingCommunity,
  IconWorld,
  IconExternalLink,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  name: string;
  logo: string | null;
  logoAlt: string;
  type: string;
  website: string | null;
  description: string | null;
  country: string | null;
  partnershipLevel: string;
  isFeatured: boolean;
}

interface PartnersSectionProps {
  locale?: string;
  showAll?: boolean;
  limit?: number;
  className?: string;
}

// Partner type icons
const partnerTypeIcons: Record<string, typeof IconBuilding> = {
  university: IconSchool,
  education_agency: IconBuilding,
  government: IconBuildingBank,
  enterprise: IconBuilding,
  ngo: IconBuildingCommunity,
  other: IconWorld,
};

// Partnership level styles
const partnershipLevelStyles: Record<string, string> = {
  platinum: 'border-2 border-slate-400',
  gold: 'border-2 border-amber-400',
  silver: 'border-2 border-gray-300',
  standard: 'border border-gray-200',
};

function PartnerLogo({ partner }: { partner: Partner }) {
  const Icon = partnerTypeIcons[partner.type] || IconBuilding;

  return (
    <div className={cn(
      "relative group bg-card rounded-xl p-6 flex flex-col items-center justify-center h-full min-h-[160px] transition-all duration-300 hover:shadow-lg",
      partnershipLevelStyles[partner.partnershipLevel]
    )}>
      {partner.logo ? (
        <div className="relative w-full h-20 mb-4">
          <Image
            src={partner.logo}
            alt={partner.logoAlt}
            fill
            className="object-contain filter grayscale group-hover:grayscale-0 transition-all duration-300"
          />
        </div>
      ) : (
        <div className="w-16 h-16 mb-4 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      
      <h3 className="font-medium text-sm text-center line-clamp-2 mb-1">
        {partner.name}
      </h3>
      
      {partner.country && (
        <p className="text-xs text-muted-foreground text-center">
          {partner.country}
        </p>
      )}

      {partner.website && (
        <a
          href={partner.website}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0"
          aria-label={`Visit ${partner.name}`}
        >
          <span className="sr-only">Visit {partner.name}</span>
        </a>
      )}

      {/* Partnership Level Badge */}
      {partner.partnershipLevel === 'platinum' && (
        <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded">
          Platinum
        </div>
      )}
      {partner.partnershipLevel === 'gold' && (
        <div className="absolute top-2 right-2 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded">
          Gold
        </div>
      )}
    </div>
  );
}

function PartnerSkeleton() {
  return (
    <div className="bg-card rounded-xl p-6 border">
      <Skeleton className="w-full h-20 mb-4" />
      <Skeleton className="h-4 w-3/4 mx-auto mb-2" />
      <Skeleton className="h-3 w-1/2 mx-auto" />
    </div>
  );
}

export function PartnersSection({
  locale = 'en',
  showAll = false,
  limit = 8,
  className,
}: PartnersSectionProps) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('locale', locale);
        if (!showAll) {
          params.append('featured', 'true');
        }
        params.append('limit', showAll ? '0' : limit.toString());
        
        const res = await fetch(`/api/partners?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners || []);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    // Delay fetch to prevent Hostinger 429 rate limits on homepage load
    const timer = setTimeout(() => {
      fetchPartners();
    }, 2000);

    return () => clearTimeout(timer);
  }, [locale, showAll, limit]);

  if (loading) {
    return (
      <section className={cn("py-12 bg-muted/30", className)}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-48 mx-auto mb-3" />
            <Skeleton className="h-4 w-64 mx-auto" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <PartnerSkeleton key={i} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (partners.length === 0) {
    return null;
  }

  return (
    <section className={cn("py-12 bg-muted/30", className)}>
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Our Trusted Partners
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Working with leading institutions, governments, and organizations worldwide to provide the best educational opportunities
          </p>
        </div>

        {/* Partners Grid */}
        <div className={cn(
          "grid gap-4",
          showAll ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        )}>
          {partners.map((partner) => (
            <PartnerLogo key={partner.id} partner={partner} />
          ))}
        </div>

        {/* CTA */}
        {!showAll && partners.length > 0 && (
          <div className="text-center mt-8">
            <Button variant="outline" asChild>
              <Link prefetch={false} href="/partners">
                View All Partners
                <IconExternalLink className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Scrolling logos variant for hero section
export function PartnersLogosScroller({ locale = 'en' }: { locale?: string }) {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('locale', locale);
        params.append('limit', '12');
        
        const res = await fetch(`/api/partners?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners || []);
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    // Delay fetch to prevent Hostinger 429 rate limits
    const timer = setTimeout(() => {
      fetchPartners();
    }, 2500);

    return () => clearTimeout(timer);
  }, [locale]);

  if (loading || partners.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden py-8 bg-muted/20">
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Trusted by leading institutions worldwide</p>
      </div>
      <div className="relative">
        {/* Gradient overlays */}
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-muted/20 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-muted/20 to-transparent z-10" />
        
        {/* Scrolling container */}
        <div className="flex animate-scroll">
          {[...partners, ...partners].map((partner, index) => (
            <div
              key={`${partner.id}-${index}`}
              className="flex-shrink-0 w-32 h-16 mx-4 flex items-center justify-center"
            >
              {partner.logo ? (
                <Image
                  src={partner.logo}
                  alt={partner.logoAlt}
                  width={120}
                  height={48}
                  className="object-contain filter grayscale opacity-60 hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                />
              ) : (
                <span className="text-sm text-muted-foreground font-medium">
                  {partner.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PartnersSection;
