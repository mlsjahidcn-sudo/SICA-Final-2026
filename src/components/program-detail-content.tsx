"use client"

import * as React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  IconSchool,
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
  IconHeart,
  IconShare,
  IconBookmark,
  IconBrandFacebook,
  IconBrandTwitter,
  IconBrandLinkedin,
  IconMail,
  IconPhone,
  IconMessageCircle,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconCertificate,
  IconBuildingArch,
  IconBuilding,
} from "@tabler/icons-react"

const Building2 = IconBuilding;
import { cn } from "@/lib/utils"
import { toast } from "sonner"

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
    description?: string | null;
  };
}

interface RelatedProgram {
  id: string;
  name: string;
  degree_level: string;
  tuition_fee_per_year: number | null;
  currency: string | null;
  language?: string | null;
  category?: string | null;
  universities?: {
    id: string;
    name_en: string;
    logo_url: string | null;
    city?: string;
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

// Degree level badge color mapping
const degreeColors: Record<string, string> = {
  'Bachelor': 'bg-blue-500/10 text-blue-600 border-blue-200 dark:border-blue-800',
  'Master': 'bg-purple-500/10 text-purple-600 border-purple-200 dark:border-purple-800',
  'PhD': 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  'Doctoral': 'bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-800',
  'Associate': 'bg-green-500/10 text-green-600 border-green-200 dark:border-green-800',
  'Certificate': 'bg-cyan-500/10 text-cyan-600 border-cyan-200 dark:border-cyan-800',
  'Diploma': 'bg-teal-500/10 text-teal-600 border-teal-200 dark:border-teal-800',
};

export function ProgramDetailContent({ program }: { program: Program }) {
  const [relatedPrograms, setRelatedPrograms] = React.useState<RelatedProgram[]>([]);
  const [isSaved, setIsSaved] = React.useState(false);
  const [showShareMenu, setShowShareMenu] = React.useState(false);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Fix hydration mismatch: only render dynamic content after mount
  const [isMounted, setIsMounted] = React.useState(false);
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Deadline Countdown (only compute after mount)
  const [countdown, setCountdown] = React.useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (!isMounted || !program.application_end_date) {
      setCountdown(null);
      return;
    }

    const targetDate = new Date(program.application_end_date);
    const calculateCountdown = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds, isExpired: false });
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, [program.application_end_date, isMounted]);

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

  const university = program.universities;
  const hasScholarship = !!program.scholarship_coverage || (program.scholarship_types && program.scholarship_types.length > 0);

  // Share functionality
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = `${program.name} at ${university?.name_en || 'University'} - Study in China`;

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(shareTitle);
    
    let shareLink = '';
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        shareLink = `mailto:?subject=${encodedTitle}&body=Check out this program: ${encodedUrl}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopiedLink(true);
          toast.success('Link copied to clipboard!');
          setTimeout(() => setCopiedLink(false), 2000);
        } catch {
          toast.error('Failed to copy link');
        }
        return;
    }
    
    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400');
    }
    setShowShareMenu(false);
  };

  const handleSave = () => {
    setIsSaved(!isSaved);
    toast.success(isSaved ? 'Program removed from saved' : 'Program saved!');
  };

  // Get degree badge color
  const getDegreeColor = (degree: string) => {
    return degreeColors[degree] || 'bg-muted text-muted-foreground';
  };

  // Calculate fill percentage for capacity
  const capacityPercent = program.capacity && program.current_applications 
    ? Math.min((program.current_applications / program.capacity) * 100, 100)
    : null;

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Cover Image */}
        {program.cover_image ? (
          <div className="relative h-48 md:h-64 w-full overflow-hidden">
            <img 
              src={program.cover_image} 
              alt={program.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          </div>
        ) : (
          <div className="h-32 md:h-48 w-full bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link href="/programs" className="hover:text-foreground">Programs</Link>
                <IconChevronRight className="h-4 w-4" />
                <span className="text-foreground truncate">{program.name}</span>
              </nav>

              {/* Program Header */}
              <div className="space-y-4">
                {/* University Logo & Type */}
                {university && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-card border flex items-center justify-center overflow-hidden">
                      {university.logo_url ? (
                        <img src={university.logo_url} alt={university.name_en} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <Link href={`/universities/${university.id}`} className="font-medium hover:text-primary transition-colors">
                        {university.name_en}
                      </Link>
                      {university.type && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {university.type}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={cn("font-medium", getDegreeColor(program.degree_level))}>
                    {program.degree_level}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <IconGlobe className="h-3 w-3" />
                    {program.language || "General"}
                  </Badge>
                  {hasScholarship && (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-800 dark:text-yellow-400">
                      <Award className="mr-1 h-3 w-3" /> Scholarship
                    </Badge>
                  )}
                  {program.rating && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Award className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                      {program.rating.toFixed(1)}
                      {program.review_count && <span className="text-xs text-muted-foreground">({program.review_count})</span>}
                    </Badge>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{program.name}</h1>

                {/* Location */}
                {university && (
                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <IconMapPin className="h-4 w-4" />
                      <span>{university.city}{university.province ? `, ${university.province}` : ""}</span>
                    </div>
                    {university.ranking_national && (
                      <div className="flex items-center gap-1.5">
                        <IconCertificate className="h-4 w-4" />
                        <span>Rank #{university.ranking_national} in China</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                {program.tags && program.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {program.tags.slice(0, 6).map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleSave}
                        className={cn(isSaved && "text-red-500 border-red-200 hover:bg-red-50")}
                      >
                        <IconHeart className={cn("h-4 w-4", isSaved && "fill-current")} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isSaved ? 'Saved' : 'Save Program'}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" size="icon" onClick={() => handleShare('copy')}>
                        {copiedLink ? <IconCheck className="h-4 w-4 text-green-500" /> : <IconCopy className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{copiedLink ? 'Copied!' : 'Copy Link'}</TooltipContent>
                  </Tooltip>

                  <div className="relative">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                      <IconShare className="h-4 w-4" />
                    </Button>
                    
                    {showShareMenu && (
                      <div className="absolute top-full left-0 mt-2 bg-card border rounded-lg shadow-lg p-2 flex gap-1 z-50">
                        <Button variant="ghost" size="icon" onClick={() => handleShare('facebook')}>
                          <IconBrandFacebook className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleShare('twitter')}>
                          <IconBrandTwitter className="h-4 w-4 text-sky-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleShare('linkedin')}>
                          <IconBrandLinkedin className="h-4 w-4 text-blue-700" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleShare('email')}>
                          <IconMail className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Tabs - Only render after mount to avoid hydration mismatch */}
              {isMounted && (
                <Tabs defaultValue="overview" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                    <TabsTrigger value="requirements">Requirements</TabsTrigger>
                    <TabsTrigger value="careers">Careers</TabsTrigger>
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

                    {/* Quick Facts - Enhanced */}
                    <div className="rounded-lg border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Program Details</h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/20 border">
                          <IconSchool className="h-6 w-6 text-blue-600 mb-2" />
                          <p className="text-xs text-muted-foreground text-center">Degree</p>
                          <p className="font-semibold text-center">{program.degree_level}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/20 border">
                          <IconClock className="h-6 w-6 text-purple-600 mb-2" />
                          <p className="text-xs text-muted-foreground text-center">Duration</p>
                          <p className="font-semibold text-center">{program.duration_years ? `${program.duration_years} year${program.duration_years > 1 ? 's' : ''}` : 'N/A'}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border">
                          <IconLanguage className="h-6 w-6 text-green-600 mb-2" />
                          <p className="text-xs text-muted-foreground text-center">Language</p>
                          <p className="font-semibold text-center">{program.language || 'N/A'}</p>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/20 border">
                          <DollarSign className="h-6 w-6 text-amber-600 mb-2" />
                          <p className="text-xs text-muted-foreground text-center">Tuition/Year</p>
                          <p className="font-semibold text-center text-sm">{formatCurrency(program.tuition_fee_per_year, program.currency) || 'Contact'}</p>
                        </div>
                      </div>
                      
                      {/* Additional Details Row */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4 pt-4 border-t">
                        {program.category && (
                          <div className="flex items-center gap-2 text-sm">
                            <IconBook className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium">{program.category}</span>
                          </div>
                        )}
                        {program.start_month && (
                          <div className="flex items-center gap-2 text-sm">
                            <IconCalendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Start:</span>
                            <span className="font-medium">{program.start_month}</span>
                          </div>
                        )}
                        {program.code && (
                          <div className="flex items-center gap-2 text-sm">
                            <IconFileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Code:</span>
                            <span className="font-medium">{program.code}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Scholarship */}
                    {hasScholarship && (
                      <div className="rounded-lg border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                            <Award className="h-4 w-4 text-white" />
                          </div>
                          <h2 className="text-lg font-semibold text-green-800 dark:text-green-200">Scholarship Available</h2>
                        </div>
                        {program.scholarship_coverage && (
                          <p className="text-green-700 dark:text-green-300 whitespace-pre-wrap mb-3">{program.scholarship_coverage}</p>
                        )}
                        {program.scholarship_types && program.scholarship_types.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {program.scholarship_types.map((type, i) => (
                              <Badge key={i} variant="outline" className="bg-white/50 text-green-700 border-green-300 dark:border-green-700 dark:text-green-300">
                                {type}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Accreditation */}
                    {program.accreditation && (
                      <div className="rounded-lg border bg-card p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <IconCertificate className="h-5 w-5 text-primary" />
                          <h2 className="text-lg font-semibold">Accreditation</h2>
                        </div>
                        <p className="text-muted-foreground">{program.accreditation}</p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Curriculum Tab */}
                  <TabsContent value="curriculum" className="space-y-6">
                    <div className="rounded-lg border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4">Curriculum & Courses</h2>
                      {program.curriculum_en ? (
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                          <p className="whitespace-pre-wrap">{program.curriculum_en}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconBook className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Curriculum details not available.</p>
                          <p className="text-sm mt-1">Please contact the university for more information.</p>
                        </div>
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
                        <div className="space-y-4">
                          {program.min_gpa && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <IconSchool className="h-4 w-4" />
                                Minimum GPA
                              </span>
                              <Badge variant="secondary" className="font-mono">{program.min_gpa}</Badge>
                            </div>
                          )}
                          {program.language_requirement && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <IconLanguage className="h-4 w-4" />
                                Language Requirement
                              </span>
                              <span className="font-medium text-sm">{program.language_requirement}</span>
                            </div>
                          )}
                          {program.entrance_exam_required && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <IconFileText className="h-4 w-4" />
                                Entrance Exam
                              </span>
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">Required</Badge>
                            </div>
                          )}
                          {program.entrance_exam_details && (
                            <p className="text-sm text-muted-foreground pl-3 border-l-2">{program.entrance_exam_details}</p>
                          )}
                          {program.prerequisites && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-muted-foreground text-sm mb-1 flex items-center gap-2">
                                <IconCheck className="h-4 w-4" />
                                Prerequisites
                              </p>
                              <p className="text-sm whitespace-pre-wrap">{program.prerequisites}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Careers Tab */}
                  <TabsContent value="careers" className="space-y-6">
                    <div className="rounded-lg border bg-card p-6">
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <IconBriefcase className="h-5 w-5" />
                        Career Prospects
                      </h2>
                      {program.career_prospects_en ? (
                        <div className="prose prose-sm max-w-none text-muted-foreground">
                          <p className="whitespace-pre-wrap">{program.career_prospects_en}</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <IconBriefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Career information not available.</p>
                          <p className="text-sm mt-1">Contact the university for career guidance.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Outcomes */}
                    {program.outcomes && (
                      <div className="rounded-lg border bg-card p-6">
                        <h2 className="text-lg font-semibold mb-4">Program Outcomes</h2>
                        <p className="text-muted-foreground whitespace-pre-wrap">{program.outcomes}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              {/* Related Programs */}
              {relatedPrograms.length > 0 && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Related Programs</h2>
                    <Link href={`/programs?category=${program.category}`} className="text-sm text-primary hover:underline">
                      View all →
                    </Link>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {relatedPrograms.map((rp) => (
                      <Link key={rp.id} href={`/programs/${rp.id}`}>
                        <div className="rounded-xl border bg-card p-4 hover:shadow-lg hover:border-primary/50 transition-all h-full">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              {rp.universities?.logo_url && rp.universities.logo_url.trim() !== '' ? (
                                <img src={rp.universities.logo_url} alt={rp.universities.name_en} className="w-full h-full object-contain p-1.5" />
                              ) : (
                                <Building2 className="h-6 w-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium line-clamp-2 mb-1">{rp.name}</h3>
                              <p className="text-sm text-muted-foreground line-clamp-1">{rp.universities?.name_en}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">{rp.degree_level}</Badge>
                                {rp.tuition_fee_per_year && (
                                  <span className="text-xs text-muted-foreground">
                                    {formatCurrency(rp.tuition_fee_per_year, rp.currency)}/yr
                                  </span>
                                )}
                              </div>
                            </div>
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
              {/* Apply Card */}
              <div className="rounded-xl border bg-card p-6 sticky top-20 shadow-sm">
                {/* Tuition Highlight */}
                <div className="text-center mb-6">
                  <p className="text-sm text-muted-foreground mb-1">Tuition per Year</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(program.tuition_fee_per_year, program.currency) || 'Contact for fees'}
                  </p>
                  {program.duration_years && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Total: {formatCurrency((program.tuition_fee_per_year || 0) * program.duration_years, program.currency)}
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                {/* Application Timeline - Only render after mount */}
                {isMounted && (
                  <div className="space-y-4 mb-6">
                    <h3 className="font-semibold">Application Timeline</h3>
                    
                    {/* Countdown Timer */}
                    {countdown && (
                      <div className={cn(
                        "p-4 rounded-xl border",
                        countdown.isExpired 
                          ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" 
                          : "bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20"
                      )}>
                        {countdown.isExpired ? (
                          <div className="text-center">
                            <IconHourglass className="mx-auto h-8 w-8 text-red-500 mb-2" />
                            <p className="font-semibold text-red-700 dark:text-red-400">Applications Closed</p>
                            <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-1">Check for next intake</p>
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <IconHourglass className="h-3 w-3" />
                              Deadline in
                            </p>
                            <div className="grid grid-cols-4 gap-2 text-center">
                              <div className="bg-background rounded-lg p-2 border shadow-sm">
                                <div className="text-xl font-bold text-primary">{String(countdown.days).padStart(2, '0')}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Days</div>
                              </div>
                              <div className="bg-background rounded-lg p-2 border shadow-sm">
                                <div className="text-xl font-bold text-primary">{String(countdown.hours).padStart(2, '0')}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Hrs</div>
                              </div>
                              <div className="bg-background rounded-lg p-2 border shadow-sm">
                                <div className="text-xl font-bold text-primary">{String(countdown.minutes).padStart(2, '0')}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Min</div>
                              </div>
                              <div className="bg-background rounded-lg p-2 border shadow-sm">
                                <div className="text-xl font-bold text-primary">{String(countdown.seconds).padStart(2, '0')}</div>
                                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Sec</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Timeline Details */}
                    <div className="space-y-2">
                      {program.application_start_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <IconCalendar className="h-4 w-4" /> Opens
                          </span>
                          <Badge variant="secondary">{formatDate(program.application_start_date)}</Badge>
                        </div>
                      )}
                      {program.application_end_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <IconCalendar className="h-4 w-4" /> Deadline
                          </span>
                          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{formatDate(program.application_end_date)}</Badge>
                        </div>
                      )}
                      {program.start_month && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <IconCalendar className="h-4 w-4" /> Start
                          </span>
                          <Badge variant="secondary">{program.start_month}</Badge>
                        </div>
                      )}
                      {!program.application_start_date && !program.application_end_date && !program.start_month && !countdown && (
                        <p className="text-sm text-muted-foreground">Contact for deadline details</p>
                      )}
                    </div>
                  </div>
                )}

                <Separator className="my-4" />

                {/* Capacity */}
                {(program.capacity || program.current_applications) && (
                  <>
                    <div className="space-y-3 mb-6">
                      <h3 className="font-semibold">Available Spots</h3>
                      {program.capacity && (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Capacity</span>
                            <span className="font-medium">{program.capacity} students</span>
                          </div>
                          {capacityPercent !== null && (
                            <div className="space-y-1">
                              <div className="h-2 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all",
                                    capacityPercent > 80 ? "bg-red-500" : capacityPercent > 50 ? "bg-amber-500" : "bg-green-500"
                                  )}
                                  style={{ width: `${capacityPercent}%` }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground text-right">
                                {program.current_applications} applied ({Math.round(capacityPercent)}% filled)
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

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

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t">
                  <p className="text-sm font-medium mb-3">Need Help?</p>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
                    <a href="mailto:admissions@studyinchina.academy">
                      <IconMail className="h-4 w-4 mr-2" />
                      Contact Advisor
                    </a>
                  </Button>
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground" asChild>
                    <a href="https://wa.me/8612345678900" target="_blank" rel="noopener noreferrer">
                      <IconMessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp Support
                    </a>
                  </Button>
                </div>
              </div>

              {/* University Info Card */}
              {university && (
                <div className="rounded-xl border bg-card p-6">
                  <h3 className="font-semibold mb-4">About the University</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                      {university.logo_url ? (
                        <img src={university.logo_url} alt={university.name_en} className="w-full h-full object-contain p-1" />
                      ) : (
                        <IconBuildingArch className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{university.name_en}</p>
                      {university.name_cn && <p className="text-sm text-muted-foreground">{university.name_cn}</p>}
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconMapPin className="h-4 w-4" />
                      <span>{university.city}, {university.province}</span>
                    </div>
                    {university.type && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IconCertificate className="h-4 w-4" />
                        <span>{university.type} University</span>
                      </div>
                    )}
                    {university.ranking_national && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Award className="h-4 w-4" />
                        <span>National Rank #{university.ranking_national}</span>
                      </div>
                    )}
                  </div>
                  <Link href={`/universities/${university.id}`} className="block mt-4">
                    <Button variant="outline" size="sm" className="w-full">
                      Learn More
                      <IconExternalLink className="h-3 w-3 ml-2" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
