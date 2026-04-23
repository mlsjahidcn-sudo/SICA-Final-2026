'use client';

import { useCallback, useEffect, useState } from 'react';
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

  const fetchCases = useCallback(async () => {
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
  }, [page]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

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
              Our Students&apos; Success Stories
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Celebrating the achievements of our students who have successfully gained admission to top universities
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <IconSchool className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span>Top Universities</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconStar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <span>Verified Cases</span>
              </div>
              <div className="flex items-center gap-1.5">
                <IconCalendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                {cases.map((caseItem) => (
                  <Link key={caseItem.id} href={`/success-cases/${caseItem.id}`}>
                    <Card className="group h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
                      <div className="flex md:block h-full">
                        {/* Image */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-full md:h-64 flex-shrink-0 bg-muted">
                          {caseItem.admission_notice_signed_url ? (
                            caseItem.admission_notice_signed_url.toLowerCase().includes('.pdf') ? (
                              <div className="w-full h-full flex items-center justify-center bg-red-50">
                                <IconFileTypePdf className="h-8 w-8 sm:h-10 sm:w-10 md:h-16 md:w-16 text-red-500" />
                              </div>
                            ) : (
                              <Image
                                src={caseItem.admission_notice_signed_url}
                                alt={`${caseItem.student_name_en}'s admission notice`}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 768px) 112px, (max-width: 1200px) 50vw, 33vw"
                              />
                            )
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <IconSchool className="h-8 w-8 sm:h-10 sm:w-10 md:h-16 md:w-16 text-muted-foreground/50" />
                            </div>
                          )}
                          {caseItem.is_featured && (
                            <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3">
                              <Badge className="bg-yellow-500 hover:bg-yellow-600 text-[10px] md:text-xs px-1 md:px-2">
                                <IconStar className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5 md:mr-1 fill-current" />
                                <span className="hidden sm:inline md:inline">Featured</span>
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <CardContent className="flex-1 p-3 md:p-5 min-w-0 flex flex-col justify-center">
                          <div className="space-y-1 md:space-y-3">
                            <div>
                              <h3 className="font-semibold text-sm md:text-lg mb-0.5 md:mb-1 truncate">
                                {caseItem.student_name_en}
                                {caseItem.student_name_cn && (
                                  <span className="text-muted-foreground ml-1 md:ml-2 text-xs md:text-base">
                                    {caseItem.student_name_cn}
                                  </span>
                                )}
                              </h3>
                              <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground">
                                <IconMapPin className="h-3 w-3 md:h-4 md:w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {caseItem.university_name_en || 'University'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                              {caseItem.admission_year && (
                                <Badge variant="outline" className="text-[10px] md:text-xs px-1.5 py-0">
                                  <IconCalendar className="h-2.5 w-2.5 md:h-3 md:w-3 mr-0.5" />
                                  {caseItem.admission_year}
                                </Badge>
                              )}
                              {caseItem.program_name_en && (
                                <Badge variant="secondary" className="text-[10px] md:text-xs line-clamp-1 px-1.5 py-0 max-w-full">
                                  {caseItem.program_name_en}
                                </Badge>
                              )}
                            </div>
                            {caseItem.description_en && (
                              <p className="hidden sm:block text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2">
                                {caseItem.description_en}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </div>
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
