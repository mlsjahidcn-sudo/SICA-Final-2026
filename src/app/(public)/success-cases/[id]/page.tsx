'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { A4DocumentPreview } from '@/components/ui/a4-document-preview';
import { 
  IconArrowLeft, 
  IconStar, 
  IconCalendar, 
  IconSchool,
  IconMapPin,
  IconLoader2,
  IconFileText,
  IconCertificate
} from '@tabler/icons-react';

interface SuccessCase {
  id: string;
  student_name_en: string;
  student_name_cn: string | null;
  student_photo_signed_url: string | null;
  university_name_en: string | null;
  university_name_cn: string | null;
  program_name_en: string | null;
  program_name_cn: string | null;
  admission_year: number | null;
  intake: string | null;
  is_featured: boolean;
  description_en: string | null;
  description_cn: string | null;
  admission_notice_signed_url: string | null;
  jw202_signed_url: string | null;
  created_at: string;
}

export default function SuccessCaseDetailPage() {
  const params = useParams();
  const [caseItem, setCaseItem] = useState<SuccessCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchCase();
    }
  }, [params.id]);

  const fetchCase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/success-cases/${params.id}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Success case not found');
        } else {
          setError('Failed to load success case');
        }
        return;
      }

      const data = await response.json();
      setCaseItem(data.success_case);
    } catch (err) {
      console.error('Error fetching success case:', err);
      setError('Failed to load success case');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !caseItem) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{error || 'Case not found'}</p>
        <Link href="/success-cases">
          <Button variant="outline">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back to Success Cases
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <Link href="/success-cases">
              <Button variant="ghost" size="sm">
                <IconArrowLeft className="h-4 w-4 mr-2" />
                Back to Success Cases
              </Button>
            </Link>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            {/* Student Photo */}
            <div className="relative w-48 h-48 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {caseItem.student_photo_signed_url ? (
                <Image
                  src={caseItem.student_photo_signed_url}
                  alt={caseItem.student_name_en}
                  fill
                  className="object-cover"
                  sizes="192px"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <IconSchool className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
              {caseItem.is_featured && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-yellow-500 hover:bg-yellow-600">
                    <IconStar className="h-3 w-3 mr-1 fill-current" />
                    Featured
                  </Badge>
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {caseItem.student_name_en}
                {caseItem.student_name_cn && (
                  <span className="text-muted-foreground ml-3 text-2xl">
                    {caseItem.student_name_cn}
                  </span>
                )}
              </h1>
              
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
                {caseItem.university_name_en && (
                  <div className="flex items-center gap-1">
                    <IconMapPin className="h-5 w-5" />
                    <span>{caseItem.university_name_en}</span>
                  </div>
                )}
                {caseItem.admission_year && (
                  <div className="flex items-center gap-1">
                    <IconCalendar className="h-5 w-5" />
                    <span>{caseItem.admission_year}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {caseItem.program_name_en && (
                  <Badge variant="secondary" className="text-sm">
                    {caseItem.program_name_en}
                  </Badge>
                )}
                {caseItem.intake && (
                  <Badge variant="outline" className="text-sm">
                    Intake: {caseItem.intake}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {caseItem.description_en && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-xl">Success Story</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap">
                      {caseItem.description_en}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Documents Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <IconFileText className="h-5 w-5" />
                    Admission Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Admission Notice */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <IconCertificate className="h-4 w-4 text-primary" />
                        Admission Notice
                      </h3>
                      <A4DocumentPreview
                        url={caseItem.admission_notice_signed_url}
                        title={`Admission Notice - ${caseItem.student_name_en}`}
                        maxWidth={400}
                      />
                    </div>

                    {/* JW202 Form */}
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <IconFileText className="h-4 w-4 text-primary" />
                        JW202 Form
                      </h3>
                      <A4DocumentPreview
                        url={caseItem.jw202_signed_url}
                        title={`JW202 Form - ${caseItem.student_name_en}`}
                        maxWidth={400}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">University</p>
                    <p className="font-medium">{caseItem.university_name_en || 'N/A'}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Program</p>
                    <p className="font-medium">{caseItem.program_name_en || 'N/A'}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Admission Year</p>
                    <p className="font-medium">{caseItem.admission_year || 'N/A'}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Intake</p>
                    <p className="font-medium">{caseItem.intake || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Want to be our next success story?</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start your journey to top universities today.
                  </p>
                  <Link href="/apply">
                    <Button className="w-full">
                      Apply Now
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
