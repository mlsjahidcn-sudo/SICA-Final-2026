/**
 * SEO Configuration for Study In China Academy
 * Centralized configuration for all SEO-related settings
 */

// Site metadata
export const SITE_CONFIG = {
  name: 'Study In China Academy',
  description: 'Your gateway to studying in China. Find universities, programs, scholarships, and apply to study in China.',
  url: process.env.COZE_PROJECT_DOMAIN_DEFAULT || 'https://studyinchina.academy',
  ogImage: '/images/og-default.jpg',
  locale: 'en_US',
  author: 'Study In China Academy',
  twitterHandle: '@studyinchina',
  keywords: ['study in china', 'chinese universities', 'scholarships in china', 'study abroad china', 'china education'],
} as const;

// Language configuration for i18n
export const LANGUAGES = [
  { code: 'en', name: 'English', locale: 'en_US' },
  { code: 'zh', name: '中文', locale: 'zh_CN' },
] as const;

// Page-specific SEO configurations
export const PAGE_SEO = {
  home: {
    title: 'Study In China Academy - Your Gateway to Chinese Universities',
    description: 'Discover top Chinese universities, programs, and scholarships. Apply to study in China with expert guidance and support.',
    keywords: ['study in china', 'chinese universities', 'scholarships', 'study abroad', 'international students china'],
  },
  universities: {
    title: 'Chinese Universities - Browse All Universities',
    description: 'Explore all Chinese universities. Find detailed information about programs, admissions, scholarships, and campus life.',
    keywords: ['chinese universities', 'university list china', 'beijing university', 'tsinghua university'],
  },
  programs: {
    title: 'Study Programs in China - Browse All Programs',
    description: 'Browse study programs in China. Find undergraduate, graduate, and PhD programs in various fields.',
    keywords: ['study programs china', 'degree programs', 'chinese courses', 'mba china', 'engineering china'],
  },
  blog: {
    title: 'Blog - Study In China Guide & Tips',
    description: 'Read our latest articles about studying in China, university guides, scholarship tips, and student experiences.',
    keywords: ['china study blog', 'student guide china', 'scholarship tips', 'university reviews'],
  },
  apply: {
    title: 'Apply Now - Start Your Journey to Study in China',
    description: 'Submit your application to study in China. Our team will guide you through the process.',
    keywords: ['apply to china university', 'application form', 'china student visa'],
  },
} as const;

// Organization schema for JSON-LD
export const ORGANIZATION_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  logo: `${SITE_CONFIG.url}/logo.png`,
  description: SITE_CONFIG.description,
  sameAs: [
    'https://twitter.com/studyinchina',
    'https://facebook.com/studyinchina',
    'https://linkedin.com/company/studyinchina',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+86-173-2576-4171',
    contactType: 'customer service',
    availableLanguage: ['English', 'Chinese'],
  },
} as const;

// Website schema for JSON-LD
export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_CONFIG.name,
  url: SITE_CONFIG.url,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_CONFIG.url}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
} as const;

/**
 * Generate Open Graph metadata
 */
export function generateOpenGraph(options: {
  title: string;
  description: string;
  url: string;
  images?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}) {
  return {
    title: options.title,
    description: options.description,
    url: options.url,
    siteName: SITE_CONFIG.name,
    images: options.images || [SITE_CONFIG.ogImage],
    type: options.type || 'website',
    locale: SITE_CONFIG.locale,
    ...(options.type === 'article' && {
      publishedTime: options.publishedTime,
      modifiedTime: options.modifiedTime,
      authors: options.author ? [options.author] : undefined,
    }),
  };
}

/**
 * Generate Twitter Card metadata
 */
export function generateTwitterCard(options: {
  title: string;
  description: string;
  image?: string;
}) {
  return {
    card: 'summary_large_image',
    site: SITE_CONFIG.twitterHandle,
    title: options.title,
    description: options.description,
    images: options.image ? [options.image] : [SITE_CONFIG.ogImage],
  };
}

/**
 * Generate alternate languages for hreflang
 */
export function generateAlternateLanguages(path: string) {
  return LANGUAGES.map(lang => ({
    hrefLang: lang.code,
    href: `${SITE_CONFIG.url}/${lang.code}${path}`,
  }));
}

/**
 * Generate breadcrumb schema
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${SITE_CONFIG.url}${item.url}`,
    })),
  };
}

/**
 * Generate university schema
 */
export function generateUniversitySchema(university: {
  id: string;
  name_en: string;
  name_cn?: string | null;
  city: string;
  province: string;
  description?: string | null;
  website_url?: string | null;
  logo_url?: string | null;
}) {
  return {
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
    sameAs: university.website_url,
  };
}

/**
 * Generate program/course schema
 */
export function generateProgramSchema(program: {
  id: string;
  name: string;
  description?: string | null;
  degree_level: string;
  duration_years?: number | null;
  tuition_fee?: number | null;
  currency?: string;
  university_name: string;
  university_url: string;
}) {
  return {
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
}

/**
 * Generate article schema for blog posts
 */
export function generateArticleSchema(article: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  modifiedAt?: string;
  author: string;
  image?: string;
  category?: string;
}) {
  return {
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
      name: SITE_CONFIG.name,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    image: article.image || SITE_CONFIG.ogImage,
    articleSection: article.category,
  };
}

/**
 * Generate FAQ schema
 */
export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  return {
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
}
