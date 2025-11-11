/**
 * SEO utilities for generating meta tags and structured data
 */

export interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'video.other';
  twitterCard?: 'summary' | 'summary_large_image' | 'player';
  keywords?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Generate meta tags for SEO
 * @param config - SEO configuration
 * @returns Object with meta tag properties
 */
export function generateMetaTags(config: SEOConfig) {
  const {
    title,
    description,
    canonical,
    ogImage,
    ogType = 'website',
    twitterCard = 'summary_large_image',
    keywords,
    author,
    publishedTime,
    modifiedTime,
    section,
    tags,
  } = config;

  const metaTags: Record<string, string> = {
    title,
    description,
    'og:title': title,
    'og:description': description,
    'og:type': ogType,
    'twitter:card': twitterCard,
    'twitter:title': title,
    'twitter:description': description,
  };

  if (canonical) {
    metaTags['canonical'] = canonical;
    metaTags['og:url'] = canonical;
  }

  if (ogImage) {
    metaTags['og:image'] = ogImage;
    metaTags['twitter:image'] = ogImage;
  }

  if (keywords && keywords.length > 0) {
    metaTags['keywords'] = keywords.join(', ');
  }

  if (author) {
    metaTags['author'] = author;
  }

  if (publishedTime) {
    metaTags['article:published_time'] = publishedTime;
  }

  if (modifiedTime) {
    metaTags['article:modified_time'] = modifiedTime;
  }

  if (section) {
    metaTags['article:section'] = section;
  }

  if (tags && tags.length > 0) {
    // Note: Multiple article:tag meta tags should be added separately
    metaTags['article:tag'] = tags.join(', ');
  }

  return metaTags;
}

/**
 * Generate JSON-LD structured data
 * @param type - Schema.org type
 * @param data - Structured data object
 * @returns JSON-LD string
 */
export function generateStructuredData(type: string, data: Record<string, any>): string {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(structuredData);
}

/**
 * Generate article structured data
 */
export function generateArticleSchema(config: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  dateModified?: string;
  author: string | { name: string; url?: string };
  publisher: { name: string; logo: string };
  url: string;
}): string {
  return generateStructuredData('Article', {
    headline: config.headline,
    description: config.description,
    image: config.image,
    datePublished: config.datePublished,
    dateModified: config.dateModified || config.datePublished,
    author: typeof config.author === 'string' ? { '@type': 'Person', name: config.author } : { '@type': 'Person', ...config.author },
    publisher: {
      '@type': 'Organization',
      name: config.publisher.name,
      logo: {
        '@type': 'ImageObject',
        url: config.publisher.logo,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': config.url,
    },
  });
}

/**
 * Generate video structured data
 */
export function generateVideoSchema(config: {
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string; // ISO 8601 duration (e.g., "PT1H30M")
  contentUrl?: string;
  embedUrl?: string;
}): string {
  return generateStructuredData('VideoObject', config);
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: { name: string; url: string }[]): string {
  return generateStructuredData('BreadcrumbList', {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  });
}
