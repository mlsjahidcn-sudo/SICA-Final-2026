"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  IconSchool as Building2,
  IconStar as Award,
  IconCircleCheck as CheckCircle2,
  IconChevronRight,
  IconClock,
  IconFileText,
  IconGlobe,
  IconUsers,
  IconCalendar,
  IconCash as DollarSign,
  IconShield as Shield,
  IconBook,
  IconLanguage,
  IconMapPin,
  IconBriefcase,
  IconHourglass,
} from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { DeadlineTimer } from '@/components/deadline-timer';

interface Program {
  id: string;
  name: string;
  name_fr: string | null;
  university_id: string;
  degree_level: string;
  language: string;
  category: string | null;
  sub_category: string | null;
  description: string | null;
  description_en: string | null;
  description_cn: string | null;
  curriculum_en: string | null;
  curriculum_cn: string | null;
  career_prospects_en: string | null;
  career_prospects_cn: string | null;
  duration_years: number | null;
  start_month: string | null;
  application_start_date: string | null;
  application_end_date: string | null;
  min_gpa: number | null;
  language_requirement: string | null;
  entrance_exam_required: boolean | null;
  entrance_exam_details: string | null;
  prerequisites: string | null;
  tuition_fee_per_year: number | null;
  currency: string;
  scholarship_coverage: string | null;
  scholarship_types: string[] | null;
  application_requirements: string | null;
  cover_image: string | null;
  is_active: boolean;
  rating: number | null;
  review_count: number | null;
  accreditation: string | null;
  outcomes: string | null;
  tags: string[] | null;
  capacity: number | null;
  current_applications: number | null;
  code: string | null;
  universities?: {
    id: string;
    name_en: string;
    name_cn: string | null;
    city: string;
    province: string | null;
    logo_url: string | null;
    website_url: string | null;
    type: string | null;
    ranking_national: number | null;
  };
}

interface RelatedProgram {
  id: string;
  name: string;
  degree_level: string;
  tuition_fee_per_year: number | null;
  currency: string | null;
  universities?: {
    id: string;
    name_en: string;
    logo_url: string | null;
  };
}

function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
  if (!amount) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'CNY',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function ProgramDetailContent({ program }: { program: Program }) {
  const [relatedPrograms, setRelatedPrograms] = React.useState<RelatedProgram[]>([]);
  const [showStickyApply, setShowStickyApply] = React.useState(true);

  // Fix hydration mismatch: only render dynamic content after mount
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch related programs
  React.useEffect(() => {
    if (!program.university_id || !program.category) return;
    const fetchRelated = async () => {
      try {
        const res = await fetch(`/api/programs?category=${program.category}&limit=4`);
        const data = await res.json();
        setRelatedPrograms((data.programs || []).filter((p: RelatedProgram) => p.id !== program.id).slice(0, 3));
      } catch { /* ignore */ }
    };
    fetchRelated();
  }, [program.university_id, program.category, program.id]);

  // Sticky apply button visibility
  React.useEffect(() => {
    const handleScroll = () => setShowStickyApply(window.scrollY < 200);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const university = program.universities;
  const hasScholarship = !!program.scholarship_coverage || (program.scholarship_types && program.scholarship_types.length > 0);

  return (
    <div className="relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/programs" className="hover:text-foreground">Programs</Link>
              <IconChevronRight className="h-4 w-4" />
              <span className="text-foreground">{program.name}</span>
            </nav>

            {/* Program Header */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge>{program.degree_level}</Badge>
                <Badge variant="outline">{program.language || "General"}</Badge>
                {hasScholarship && (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800 dark:text-yellow-400">
                    <Award className="mr-1 h-3 w-3" /> Scholarship
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-bold tracking-tight">{program.name}</h1>
              {university && (
                <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  <Link href={`/universities/${university.id}`} className="hover:text-foreground hover:underline">
                    {university.name_en}
                  </Link>
                  <span>•</span>
                  <IconMapPin className="h-4 w-4" />
                  <span>{university.city}{university.province ? `, ${university.province}` : ""}</span>
                </div>
              )}
            </div>

            {/* Tabs - Only render after mount to avoid hydration mismatch */}
            {isMounted && (
              <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                  <TabsTrigger value="requirements">Requirements</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {(program.description_en || program.description) && (
                    <div className="rounded-lg border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Program Overview</h2>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="whitespace-pre-wrap">{program.description_en || program.description}</p>
                      </div>
                    </div>
                  )}

                  {/* Quick Facts */}
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Quick Facts</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <IconBook className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Degree</p>
                          <p className="font-medium">{program.degree_level}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <IconClock className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="font-medium">{program.duration_years ? `${program.duration_years} year${program.duration_years > 1 ? 's' : ''}` : 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <IconLanguage className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Language</p>
                          <p className="font-medium">{program.language || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Tuition/Year</p>
                          <p className="font-medium">{formatCurrency(program.tuition_fee_per_year, program.currency) || 'Contact'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scholarship */}
                  {hasScholarship && (
                    <div className="rounded-lg border border-green-200 bg-green-50/50 p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Award className="h-5 w-5 text-green-600" />
                        <h2 className="text-lg font-semibold text-green-800">Scholarship Available</h2>
                      </div>
                      {program.scholarship_coverage && (
                        <p className="text-green-700 whitespace-pre-wrap">{program.scholarship_coverage}</p>
                      )}
                      {program.scholarship_types && program.scholarship_types.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {program.scholarship_types.map((type, i) => (
                            <Badge key={i} variant="outline" className="text-green-700 border-green-300">{type}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Career Prospects */}
                  {program.career_prospects_en && (
                    <div className="rounded-lg border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <IconBriefcase className="h-5 w-5" />
                        Career Prospects
                      </h2>
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="whitespace-pre-wrap">{program.career_prospects_en}</p>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Curriculum Tab */}
                <TabsContent value="curriculum" className="space-y-6">
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Curriculum</h2>
                    {program.curriculum_en ? (
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="whitespace-pre-wrap">{program.curriculum_en}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Curriculum details not available. Please contact the university for more information.</p>
                    )}
                  </div>
                </TabsContent>

                {/* Requirements Tab */}
                <TabsContent value="requirements" className="space-y-6">
                  <div className="rounded-lg border bg-card p-6">
                    <h2 className="text-lg font-semibold mb-4">Entry Requirements</h2>
                    {program.application_requirements ? (
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <p className="whitespace-pre-wrap">{program.application_requirements}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Entry requirements not specified. Please contact the university for details.</p>
                    )}
                  </div>

                  {/* Additional Requirements */}
                  {(program.min_gpa || program.language_requirement || program.entrance_exam_required || program.prerequisites) && (
                    <div className="rounded-lg border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Additional Requirements</h2>
                      <div className="space-y-3">
                        {program.min_gpa && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Minimum GPA</span>
                            <Badge variant="secondary">{program.min_gpa}</Badge>
                          </div>
                        )}
                        {program.language_requirement && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Language Requirement</span>
                            <span className="font-medium text-sm">{program.language_requirement}</span>
                          </div>
                        )}
                        {program.entrance_exam_required && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Entrance Exam</span>
                            <Badge variant="secondary">Required</Badge>
                          </div>
                        )}
                        {program.entrance_exam_details && (
                          <p className="text-sm text-muted-foreground">{program.entrance_exam_details}</p>
                        )}
                        {program.prerequisites && (
                          <div>
                            <p className="text-muted-foreground text-sm mb-1">Prerequisites</p>
                            <p className="text-sm whitespace-pre-wrap">{program.prerequisites}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}

            {/* Related Programs */}
            {relatedPrograms.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold mb-4">Related Programs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relatedPrograms.map((rp) => (
                    <Link key={rp.id} href={`/programs/${rp.id}`}>
                      <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            {rp.universities?.logo_url && rp.universities.logo_url.trim() !== '' ? (
                              <img src={rp.universities.logo_url} alt={rp.universities.name_en} className="w-full h-full object-contain rounded-lg" />
                            ) : (
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium line-clamp-1">{rp.name}</h3>
                            <p className="text-sm text-muted-foreground">{rp.universities?.name_en}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{rp.degree_level}</Badge>
                              {rp.tuition_fee_per_year && (
                                <span className="text-xs text-muted-foreground">
                                  {formatCurrency(rp.tuition_fee_per_year, rp.currency)}/yr
                                </span>
                              )}
                            </div>
                          </div>
                          <IconChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-lg border bg-card p-6 sticky top-20">
              {/* Program Fees */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Program Fees</h2>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tuition/Year</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(program.tuition_fee_per_year, program.currency) || 'Contact'}
                  </span>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Application Timeline */}
              <div className="space-y-3">
                <h2 className="text-lg font-semibold">Application Timeline</h2>
                
                {/* Deadline Timer */}
                {isMounted && program.application_end_date && (
                  <DeadlineTimer deadline={program.application_end_date} />
                )}
                
                {/* Timeline Dates */}
                {program.application_start_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" /> Opens
                    </span>
                    <Badge variant="secondary">{formatDate(program.application_start_date)}</Badge>
                  </div>
                )}
                {program.application_end_date && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" /> Deadline
                    </span>
                    <Badge variant="secondary">{formatDate(program.application_end_date)}</Badge>
                  </div>
                )}
                {program.start_month && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <IconCalendar className="h-4 w-4" /> Start
                    </span>
                    <Badge variant="secondary">{program.start_month}</Badge>
                  </div>
                )}
                {/* Contact message when no deadline */}
                {isMounted && !program.application_end_date && !program.application_start_date && !program.start_month && (
                  <p className="text-sm text-muted-foreground">Contact for deadline details</p>
                )}
              </div>

              {/* Capacity */}
              {(program.capacity || program.current_applications) && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold">Capacity</h2>
                    {program.capacity && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <IconUsers className="h-4 w-4" /> Spots
                        </span>
                        <span className="font-medium">{program.capacity}</span>
                      </div>
                    )}
                    {program.current_applications && (
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <IconUsers className="h-4 w-4" /> Applied
                        </span>
                        <span className="font-medium">{program.current_applications}</span>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Rating */}
              {program.rating && program.rating > 0 && (
                <>
                  <Separator className="my-4" />
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <div className="flex items-center gap-1">
                        <Award className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{program.rating.toFixed(1)}</span>
                        {program.review_count && program.review_count > 0 && (
                          <span className="text-xs text-muted-foreground">({program.review_count})</span>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator className="my-4" />

              {/* CTA Buttons */}
              <div className="space-y-3">
                <Link href={`/apply/${program.id}`} className="block">
                  <Button className="w-full" size="lg">
                    <IconFileText className="h-4 w-4 mr-2" />
                    Apply Now
                  </Button>
                </Link>
                {university && (
                  <Link href={`/universities/${university.id}`} className="block">
                    <Button variant="outline" className="w-full">
                      <Building2 className="h-4 w-4 mr-2" />
                      View University
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Apply Button (Mobile) */}
      {isMounted && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 bg-background border-t p-4 lg:hidden transition-transform duration-300 z-50',
            showStickyApply ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
            <div className="min-w-0">
              <p className="font-medium line-clamp-1">{program.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(program.tuition_fee_per_year, program.currency) || 'Contact'}/year
              </p>
            </div>
            <Link href={`/apply/${program.id}`}>
              <Button size="lg" className="shrink-0">Apply Now</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
