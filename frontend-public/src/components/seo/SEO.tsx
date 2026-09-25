import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string; // If omitted, uses the current location pathname
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  robots?: string; // e.g., "index, follow" or "noindex, nofollow"
  children?: ReactNode; // For JSON-LD or other custom tags
}

export function SEO({
  title,
  description,
  canonicalPath,
  ogImage = '/logo.png',
  ogType = 'website',
  robots = 'index, follow',
  children,
}: SEOProps) {
  const location = useLocation();
  const baseUrl = 'https://raashitech.com'; // Production absolute URL
  const currentPath = canonicalPath !== undefined ? canonicalPath : location.pathname;
  // Ensure we don't have double slashes if path is empty or already starts with /
  const canonicalUrl = `${baseUrl}${currentPath === '/' ? '' : currentPath.startsWith('/') ? currentPath : `/${currentPath}`}`;

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robots} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Raashi Cognitive Technologies" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />

      {/* Custom tags (e.g. JSON-LD) */}
      {children}
    </Helmet>
  );
}
