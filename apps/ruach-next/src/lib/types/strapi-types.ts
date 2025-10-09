export interface StrapiBase {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface Media {
  url: string;
  alternativeText?: string;
  mime?: string;
  name?: string;
}

export interface CategoryEntity extends StrapiBase {
  attributes: {
    name: string;
    slug: string;
    description?: string;
    accentColor?: string;
    displayOrder?: number;
  };
}

export interface SpeakerEntity extends StrapiBase {
  attributes: {
    name: string;
    slug: string;
    title?: string;
    organization?: string;
    featured?: boolean;
    bio?: string;
    photo?: { data?: { attributes?: Media } };
    socialLinks?: Array<{
      platform?: 'youtube' | 'instagram' | 'facebook' | 'spotify' | 'tiktok' | 'website' | 'other';
      label?: string;
      url: string;
      handle?: string;
    }>;
  };
}

export interface VideoSource {
  kind?: 'youtube' | 'vimeo' | 'file' | 'rumble' | 'custom';
  title?: string;
  url?: string;
  embedId?: string;
  startSeconds?: number | null;
  file?: { data?: { attributes?: Media } };
}

export interface MediaItemEntity extends StrapiBase {
  attributes: {
    title: string;
    slug: string;
    description?: string;
    excerpt?: string;
    type?: 'testimony' | 'teaching' | 'worship' | 'podcast' | 'short';
    views?: number;
    durationSec?: number | null;
    releasedAt?: string | null;
    featured?: boolean;
    category?: { data?: CategoryEntity | null };
    legacyCategory?: string | null;
    source?: VideoSource | null;
    speakers?: { data?: SpeakerEntity[] };
    tags?: { data?: TagEntity[] };
    ctaLabel?: string;
    ctaUrl?: string;
    video_url?: string;
    videoUrl?: string;
    thumbnail?: { data?: { attributes?: Media } };
    gallery?: { data?: { attributes?: Media }[] };
    transcript?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: { data?: { attributes?: Media } };
  };
}

export interface CourseEntity extends StrapiBase {
  attributes: {
    title: string;
    slug: string;
    excerpt?: string;
    description?: string;
    cover?: { data?: { attributes?: Media } };
    heroVideo?: { data?: { attributes?: Media } };
    level?: 'foundation' | 'intermediate' | 'advanced';
    estimatedDuration?: string;
    featured?: boolean;
    ctaLabel?: string;
    ctaUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: { data?: { attributes?: Media } };
  };
}

export interface PrayerEntity extends StrapiBase {
  attributes: {
    name?: string;
    body: string;
    createdAt?: string;
    status?: 'open' | 'answered' | 'closed';
    featured?: boolean;
    city?: string;
    country?: string;
  };
}

export interface StatEntity extends StrapiBase {
  attributes: {
    headline: string;
    body?: string;
    metrics?: Array<{
      id?: number;
      label: string;
      value: string;
      description?: string;
      icon?: string;
    }>;
  };
}

export interface EventEntity extends StrapiBase {
  attributes: {
    title: string;
    slug: string;
    description?: string;
    location?: string;
    date?: string;
    startDate?: string;   // required by schema but optional in types for safety
    endDate?: string;
    timezone?: string;
    isOnline?: boolean;
    category?: 'conference' | 'gathering' | 'outreach' | 'online';
    cover?: { data?: { attributes?: Media } };
    heroGallery?: { data?: { attributes?: Media }[] };
    registrationUrl?: string;
    ctaLabel?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: { data?: { attributes?: Media } };
  };
}

export interface TagEntity extends StrapiBase {
  attributes: {
    name: string;
    slug: string;
    description?: string;
  };
}

export interface ConferenceScheduleItem extends Record<string, unknown> {
  id?: number;
  time?: string;
  title?: string;
  name?: string;
  description?: string;
  label?: string;
  body?: string;
}

export interface ConferenceSpeakerItem extends Record<string, unknown> {
  id?: number;
  name?: string;
  role?: string;
  title?: string;
  bio?: string;
  description?: string;
  photo?: { data?: { attributes?: Media } } | { attributes?: Media };
  image?: { data?: { attributes?: Media } } | { attributes?: Media };
}

export interface ConferenceMerchItem extends Record<string, unknown> {
  id?: number;
  title?: string;
  name?: string;
  description?: string;
  body?: string;
  href?: string;
  url?: string;
  link?: string;
  ctaLabel?: string;
  cta_label?: string;
}

export interface ConferencePageEntity extends StrapiBase {
  attributes: {
    heroBadge?: string;
    hero_badge?: string;
    badge?: string;
    heroTitle?: string;
    hero_title?: string;
    title?: string;
    heroDescription?: string;
    hero_description?: string;
    description?: string;
    heroImage?: { data?: { attributes?: Media } } | { attributes?: Media };
    hero_image?: { data?: { attributes?: Media } } | { attributes?: Media };
    heroPhoto?: { data?: { attributes?: Media } } | { attributes?: Media };
    hero_photo?: { data?: { attributes?: Media } } | { attributes?: Media };
    registrationUrl?: string;
    registration_url?: string;
    registrationLink?: string;
    registration_link?: string;
    registrationLabel?: string;
    registration_label?: string;
    registrationEmbed?: string;
    registration_embed?: string;
    primaryCtaLabel?: string;
    primary_cta_label?: string;
    primaryCtaUrl?: string;
    primary_cta_url?: string;
    secondaryCtaLabel?: string;
    secondary_cta_label?: string;
    secondaryCtaUrl?: string;
    secondary_cta_url?: string;
    sponsorUrl?: string;
    sponsor_url?: string;
    sponsorLabel?: string;
    sponsor_label?: string;
    sponsorCtaLabel?: string;
    sponsor_cta_label?: string;
    sponsorCtaUrl?: string;
    sponsor_cta_url?: string;
    schedule?: ConferenceScheduleItem[];
    speakers?: ConferenceSpeakerItem[];
    merch?: ConferenceMerchItem[];
    featuredEvent?: { data?: EventEntity | null };
    featured_event?: { data?: EventEntity | null };
    date?: string;
    eventDate?: string;
    event_date?: string;
    startDate?: string;
    start_date?: string;
    location?: string;
    eventLocation?: string;
    event_location?: string;
  };
}
