'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { IconStar, IconCalendar, IconSchool, IconMapPin, IconLoader2, IconFileTypePdf } from '@tabler/icons-react';

interface SuccessCase {
  id: string;
  student_name_en: string;
  student_name_cn: string | null;
  student_photo_signed_url: string | null;
  admission_notice_signed_url: string | null;
  university_name_en: string | null;
  university_name_cn: string | null;
  program_name_en: string | null;
  program_name_cn: string | null;
  admission_year: number | null;
  intake: string | null;
  is_featured: boolean;
  description_en: string | null;
  description_cn: string | null;
}

interface SuccessCasesResponse {
  success_cases: SuccessCase[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function SuccessCasesPage() {
  const [cases, setCases] = useState<SuccessCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });

  useEffect(() => {
    fetchCases();
  }, [page]);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/success-cases?page=${page}&limit=12`);
      if (!response.ok) throw new Error('Failed to fetch success cases');
      
      const data: SuccessCasesResponse = await response.json();
      setCases(data.success_cases);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching success cases:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Success Stories
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Our Students' Success Stories
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Celebrating the achievements of our students who have successfully gained admission to top universities
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <IconSchool className="h-5 w-5 text-primary" />
                <span>Top Universities</span>
              </div>
              <div className="flex items-center gap-2">
                <IconStar className="h-5 w-5 text-primary" />
                <span>Verified Cases</span>
              </div>
              <div className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5 text-primary" />
                <span>Recent Admissions</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cases Grid */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <IconLoader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : cases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No success cases available yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cases.map((caseItem) => (
                  <Link key={caseItem.id} href={`/success-cases/${caseItem.id}`}>
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <div className="relative h-64 bg-muted">
                        {caseItem.admission_notice_signed_url ? (
                          caseItem.admission_notice_signed_url.toLowerCase().includes('.pdf') ? (
                            <div className="w-full h-full flex items-center justify-center bg-red-50">
                              <IconFileTypePdf className="h-16 w-16 text-red-500" />
                            </div>
                          ) : (
                            <Image
                              src={caseItem.admission_notice_signed_url}
                              alt={`${caseItem.student_name_en}'s admission notice`}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <IconSchool className="h-16 w-16 text-muted-foreground/50" />
                          </div>
                        )}
                        {caseItem.is_featured && (
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-yellow-500 hover:bg-yellow-600">
                              <IconStar className="h-3 w-3 mr-1 fill-current" />
                              Featured
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-5">
                        <div className="space-y-3">
                          <div>
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                              {caseItem.student_name_en}
                              {caseItem.student_name_cn && (
                                <span className="text-muted-foreground ml-2">
                                  {caseItem.student_name_cn}
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <IconMapPin className="h-4 w-4" />
                              <span className="line-clamp-1">
                                {caseItem.university_name_en || 'University'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {caseItem.admission_year && (
                              <Badge variant="outline" className="text-xs">
                                <IconCalendar className="h-3 w-3 mr-1" />
                                {caseItem.admission_year}
                              </Badge>
                            )}
                            {caseItem.program_name_en && (
                              <Badge variant="secondary" className="text-xs line-clamp-1">
                                {caseItem.program_name_en}
                              </Badge>
                            )}
                          </div>
                          {caseItem.description_en && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {caseItem.description_en}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    disabled={!pagination.hasPrevPage}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
