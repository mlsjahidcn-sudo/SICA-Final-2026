import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.COE_PROJECT_DOMAIN_DEFAULT 
    ? `https://${process.env.COE_PROJECT_DOMAIN_DEFAULT}` 
    : 'http://localhost:5000';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/student/', '/partner/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
