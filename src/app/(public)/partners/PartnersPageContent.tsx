'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconBuilding,
  IconSchool,
  IconBuildingBank,
  IconBuildingCommunity,
  IconWorld,
  IconExternalLink,
  IconMapPin,
  IconUsers,
  IconTrophy,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

interface Partner {
  id: string;
  name: string;
  logo: string | null;
  logoAlt: string;
  type: string;
  category: string | null;
  website: string | null;
  description: string | null;
  country: string | null;
  countryCode: string | null;
  city: string | null;
  partnershipLevel: string;
  partnershipSince: string | null;
  studentsReferred: number;
  successRate: number | null;
  isFeatured: boolean;
}

// Partner type labels
const partnerTypeLabels: Record<string, string> = {
  university: 'Universities',
  education_agency: 'Education Agencies',
  government: 'Government',
  enterprise: 'Enterprises',
  ngo: 'NGOs',
  other: 'Other',
};

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
const partnershipLevelStyles: Record<string, { border: string; badge: string; label: string }> = {
  platinum: {
    border: 'border-2 border-slate-400',
    badge: 'bg-slate-100 text-slate-700',
    label: 'Platinum Partner',
  },
  gold: {
    border: 'border-2 border-amber-400',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Gold Partner',
  },
  silver: {
    border: 'border-2 border-gray-300',
    badge: 'bg-gray-100 text-gray-700',
    label: 'Silver Partner',
  },
  standard: {
    border: 'border border-gray-200',
    badge: 'bg-muted text-muted-foreground',
    label: 'Partner',
  },
};

function PartnerCard({ partner }: { partner: Partner }) {
  const Icon = partnerTypeIcons[partner.type] || IconBuilding;
  const levelStyle = partnershipLevelStyles[partner.partnershipLevel];

  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-lg",
      levelStyle.border
    )}>
      <CardContent className="p-6">
        {/* Logo */}
        <div className="flex items-start justify-between mb-4">
          <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
            {partner.logo ? (
              <Image
                src={partner.logo}
                alt={partner.logoAlt}
                fill
                className="object-contain p-2"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className="h-10 w-10 text-muted-foreground" />
              </div>
            )}
          </div>
          
          {partner.isFeatured && (
            <Badge className="bg-primary/10 text-primary border-0">
              <IconTrophy className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>

        {/* Name and Location */}
        <div className="mb-3">
          <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors">
            {partner.name}
          </h3>
          {(partner.country || partner.city) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <IconMapPin className="h-3.5 w-3.5" />
              <span>{partner.city ? `${partner.city}, ` : ''}{partner.country}</span>
            </div>
          )}
        </div>

        {/* Description */}
        {partner.description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {partner.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          {partner.studentsReferred > 0 && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <IconUsers className="h-4 w-4" />
              <span>{partner.studentsReferred.toLocaleString()} students</span>
            </div>
          )}
          {partner.successRate && (
            <div className="flex items-center gap-1 text-green-600">
              <IconTrophy className="h-4 w-4" />
              <span>{partner.successRate}% success</span>
            </div>
          )}
        </div>

        {/* Partnership Level Badge */}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={levelStyle.badge}>
            {levelStyle.label}
          </Badge>
          
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary hover:underline"
            >
              Visit Website
              <IconExternalLink className="h-3.5 w-3.5 ml-1" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PartnerSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <Skeleton className="w-20 h-20 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-4" />
        <Skeleton className="h-8 w-24" />
      </CardContent>
    </Card>
  );
}

export default function PartnersPageContent() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnersByType, setPartnersByType] = useState<Record<string, Partner[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'type'>('grid');

  useEffect(() => {
    const fetchPartners = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/partners');
        if (res.ok) {
          const data = await res.json();
          setPartners(data.partners || []);
          setPartnersByType(data.partnersByType || {});
        }
      } catch (error) {
        console.error('Error fetching partners:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPartners();
  }, []);

  const filteredPartners = selectedType === 'all' 
    ? partners 
    : partners.filter(p => p.type === selectedType);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-background py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Our Partners</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            We collaborate with prestigious institutions, government agencies, and organizations worldwide to provide exceptional educational opportunities for international students.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{partners.length}+</div>
              <div className="text-sm text-muted-foreground">Partners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">{Object.keys(partnersByType).length}</div>
              <div className="text-sm text-muted-foreground">Categories</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">50+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="py-6 border-b bg-background sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.entries(partnerTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                All Partners
              </Button>
              <Button
                variant={viewMode === 'type' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('type')}
              >
                By Category
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <PartnerSkeleton key={i} />
              ))}
            </div>
          ) : viewMode === 'grid' ? (
            <>
              {filteredPartners.length === 0 ? (
                <div className="text-center py-12">
                  <IconBuilding className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No partners found</h3>
                  <p className="text-muted-foreground">Try selecting a different category</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPartners.map((partner) => (
                    <PartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-12">
              {Object.entries(partnersByType).map(([type, typePartners]) => (
                <div key={type}>
                  <div className="flex items-center gap-2 mb-6">
                    {(() => {
                      const Icon = partnerTypeIcons[type] || IconBuilding;
                      return <Icon className="h-6 w-6 text-primary" />;
                    })()}
                    <h2 className="text-2xl font-bold">
                      {partnerTypeLabels[type] || type}
                    </h2>
                    <Badge variant="outline">{typePartners.length}</Badge>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {typePartners.map((partner) => (
                      <PartnerCard key={partner.id} partner={partner} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">Interested in Partnering with Us?</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;re always looking to collaborate with institutions and organizations that share our mission of making education accessible to everyone.
          </p>
          <Button asChild size="lg">
            <Link href="/contact">
              Contact Us for Partnership
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
