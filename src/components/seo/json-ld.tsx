'use client';

import Script from 'next/script';

interface JsonLdProps {
  data: object | object[];
}

/**
 * JSON-LD Script Component
 * Injects structured data into the page for SEO
 * 
 * @example
 * <JsonLd data={organizationSchema} />
 * <JsonLd data={[organizationSchema, websiteSchema]} />
 */
export function JsonLd({ data }: JsonLdProps) {
  const jsonLdData = Array.isArray(data) ? data : [data];
  
  return (
    <>
      {jsonLdData.map((item, index) => (
        <Script
          key={index}
          id={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(item),
          }}
        />
      ))}
    </>
  );
}

/**
 * Organization Schema Component
 * Adds organization structured data to the page
 */
export function OrganizationSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Study In China Academy',
    url: process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy',
    logo: `${process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy'}/logo.png`,
    description: 'Your gateway to studying in China. Find universities, programs, scholarships, and apply to study in China.',
    sameAs: [
      'https://twitter.com/studyinchina',
      'https://facebook.com/studyinchina',
    ],
  };
  
  return <JsonLd data={schema} />;
}

/**
 * Website Schema Component
 * Adds website structured data with search action
 */
export function WebsiteSchema() {
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Study In China Academy',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/universities?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
  
  return <JsonLd data={schema} />;
}

/**
 * Breadcrumb Schema Component
 * Adds breadcrumb structured data for navigation
 */
interface BreadcrumbItem {
  name: string;
  url: string;
}

export function BreadcrumbSchema({ items }: { items: BreadcrumbItem[] }) {
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
  
  return <JsonLd data={schema} />;
}

/**
 * University Schema Component
 * Adds university structured data for university detail pages
 */
interface UniversitySchemaData {
  name_en: string;
  name_cn?: string | null;
  city: string;
  province: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
}

export function UniversitySchema({ university }: { university: UniversitySchemaData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollegeOrUniversity',
    name: university.name_en,
    alternateName: university.name_cn,
    description: university.description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: university.city,
      addressRegion: university.province,
      addressCountry: 'CN',
    },
    url: university.website_url,
    logo: university.logo_url,
  };
  
  return <JsonLd data={schema} />;
}

/**
 * Program Schema Component
 * Adds program/course structured data for program detail pages
 */
interface ProgramSchemaData {
  name: string;
  description?: string | null;
  degree_level: string;
  duration_years?: number | null;
  tuition_fee?: number | null;
  currency?: string;
  university_name: string;
  university_url: string;
}

export function ProgramSchema({ program }: { program: ProgramSchemaData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: program.name,
    description: program.description,
    provider: {
      '@type': 'CollegeOrUniversity',
      name: program.university_name,
      url: program.university_url,
    },
    educationalCredentialAwarded: program.degree_level,
    timeRequired: program.duration_years ? `P${program.duration_years}Y` : undefined,
    offers: program.tuition_fee ? {
      '@type': 'Offer',
      price: program.tuition_fee,
      priceCurrency: program.currency || 'CNY',
    } : undefined,
  };
  
  return <JsonLd data={schema} />;
}

/**
 * Article Schema Component
 * Adds article structured data for blog posts
 */
interface ArticleSchemaData {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  modifiedAt?: string;
  author: string;
  image?: string;
  category?: string;
}

export function ArticleSchema({ article }: { article: ArticleSchemaData }) {
  const baseUrl = process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy';
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: article.url,
    datePublished: article.publishedAt,
    dateModified: article.modifiedAt || article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Study In China Academy',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    image: article.image || `${baseUrl}/og-default.jpg`,
    articleSection: article.category,
  };
  
  return <JsonLd data={schema} />;
}

/**
 * FAQ Schema Component
 * Adds FAQ structured data for pages with FAQs
 */
interface FAQItem {
  question: string;
  answer: string;
}

export function FAQSchema({ faqs }: { faqs: FAQItem[] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  
  return <JsonLd data={schema} />;
}

/**
 * Local Business Schema Component (for physical offices)
 */
interface LocalBusinessSchemaData {
  name: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
  phone?: string;
  email?: string;
  openingHours?: string;
}

export function LocalBusinessSchema({ business }: { business: LocalBusinessSchemaData }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name: business.name,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address.street,
      addressLocality: business.address.city,
      addressRegion: business.address.province,
      postalCode: business.address.postalCode,
      addressCountry: business.address.country,
    },
    telephone: business.phone,
    email: business.email,
    openingHours: business.openingHours,
  };
  
  return <JsonLd data={schema} />;
}
