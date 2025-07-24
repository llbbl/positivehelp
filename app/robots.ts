import { MetadataRoute } from 'next'
import { siteConfig } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/', // Block admin pages
          '/api/', // Block API endpoints
          '/add/', // Block submission form from being indexed
          '/_next/', // Block Next.js internal files
          '/private/', // Block any future private pages
        ],
      },
      {
        userAgent: 'GPTBot', // OpenAI's web crawler
        disallow: '/', // Block AI training crawlers if desired
      },
      {
        userAgent: 'Google-Extended', // Google's AI training crawler
        disallow: '/', // Block AI training crawlers if desired
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}