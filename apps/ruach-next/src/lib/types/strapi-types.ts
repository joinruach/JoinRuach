import type { AccessLevel as AccessLevelType } from "@ruach/components/components/ruach/CourseCard";

export type CourseAccessLevel = AccessLevelType;

export interface StrapiBase {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  [key: string]: unknown;
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
    displayName?: string;
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

export interface SeriesEntity extends StrapiBase {
  attributes: {
    title: string;
    slug: string;
    description?: string;
    coverImage?: { data?: { attributes?: Media } };
    mediaItems?: { data?: MediaItemEntity[] };
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
    likes?: number;
    durationSec?: number | null;
    releasedAt?: string | null;
    featured?: boolean;
    category?: { data?: CategoryEntity | null };
    series?: { data?: SeriesEntity | null };
    legacyCategory?: string | null;
    source?: VideoSource | null;
    speakers?: { data?: SpeakerEntity[] };
    tags?: { data?: TagEntity[] };
    weekNumber?: number | null;
    episodeNumber?: number | null;
    ctaLabel?: string;
    ctaUrl?: string;
    video_url?: string;
    videoUrl?: string;
    thumbnail?: { data?: { attributes?: Media } };
    gallery?: { data?: { attributes?: Media }[] };
    transcript?: string;
    featuredScripture?: string;
    scriptureReferences?: string[];
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: { data?: { attributes?: Media } };
    requiredAccessLevel?: CourseAccessLevel;
  };
}

export interface LessonEntity extends StrapiBase {
  attributes: {
    title: string;
    slug: string;
    summary?: string;
    order?: number;
    duration?: number;
    video_url?: string;
    videoUrl?: string;
    transcript?: string;
    transcript_html?: string;
    transcriptHtml?: string;
    transcriptDownload?: string;
    transcript_download?: string;
    transcriptFile?: { data?: { attributes?: Media } };
    previewAvailable?: boolean;
    course?: { data?: CourseEntity | null };
    requiredAccessLevel?: CourseAccessLevel;
  };
}

export interface CourseEntity extends StrapiBase {
  attributes: {
    name: string;
    slug: string;
    excerpt?: string;
    description?: string;
    cover?: { data?: { attributes?: Media } };
    heroVideo?: { data?: { attributes?: Media } };
    lessons?: { data?: LessonEntity[] };
    level?: 'foundation' | 'intermediate' | 'advanced';
    estimatedDuration?: string;
    featured?: boolean;
    ctaLabel?: string;
    ctaUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
    seoImage?: { data?: { attributes?: Media } };
    unlockRequirements?: string;
    requiredAccessLevel?: CourseAccessLevel;
    landingConfig?: LandingConfig;
    playerConfig?: PlayerConfig;
    auditConfig?: AuditConfig;
    ctaDetoxCourse?: {
      data?: {
        attributes?: {
          slug?: string;
          name?: string;
        };
      };
    };
  };
}

export interface LandingHero {
  title?: string;
  promiseLine?: string;
  microTrustLine?: string;
  optionalBadge?: string;
  primaryCtaLabel?: string;
  primaryCtaUrl?: string;
  secondaryCtaLabel?: string;
  secondaryCtaUrl?: string;
}

export interface LandingSegment {
  name?: string;
  durationMinutes?: number;
  outcome?: string;
  previewLabel?: string;
  previewUrl?: string;
}

export interface ScripturePassage {
  reference?: string;
  text?: string;
  translation?: string;
}

export interface DeliverableBlock {
  title?: string;
  description?: string;
  auditWizardUrl?: string;
  pdfUrl?: string;
  tagline?: string;
}

export interface QualifierItem {
  label?: string;
  text?: string;
}

export interface ProcessStep {
  title?: string;
  body?: string;
}

export interface DetoxBridge {
  title?: string;
  body?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export interface FAQItem {
  question?: string;
  answer?: string;
}

export interface LandingConfig {
  hero?: LandingHero;
  outcomes?: QualifierItem[];
  segments?: LandingSegment[];
  scriptureHelperLine?: string;
  scripturePassages?: ScripturePassage[];
  deliverable?: DeliverableBlock;
  whoItsFor?: QualifierItem[];
  whoItsNotFor?: QualifierItem[];
  processSteps?: ProcessStep[];
  detoxBridge?: DetoxBridge;
  faqItems?: FAQItem[];
}

export interface PlayerConfig {
  readModeEnabled?: boolean;
  listenModeEnabled?: boolean;
  doModeEnabled?: boolean;
  freedomMeterLabels?: string[];
  convictionTimerHours?: number;
  microDrillPrompts?: string[];
  offlineFirst?: boolean;
  windowOfObedienceLabel?: string;
}

export interface ObedienceCardTemplate {
  patternLabel?: string;
  oneStepLabel?: string;
  scheduledTimeLabel?: string;
  witnessLabel?: string;
  shareInstructions?: string;
}

export interface AuditConfig {
  renunciationHoldSeconds?: number;
  contractEnabled?: boolean;
  witnessEnabled?: boolean;
  generateObedienceCard?: boolean;
  instructions?: string;
  obedienceCardTemplate?: ObedienceCardTemplate;
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
  displayName?: string;
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

export interface SeoComponent extends Record<string, unknown> {
  id?: number;
  metaTitle?: string;
  metaDescription?: string;
  shareImage?: { data?: { attributes?: Media } };
}

export interface OutreachVolunteerPointComponent extends Record<string, unknown> {
  id?: number;
  title?: string;
  description?: string;
  icon?: string;
}

export interface OutreachGivingHighlightComponent extends Record<string, unknown> {
  id?: number;
  label?: string;
  amount?: string;
  description?: string;
  badge?: string;
}

export interface OutreachSubscriptionBannerComponent extends Record<string, unknown> {
  id?: number;
  title?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  image?: { data?: { attributes?: Media } };
}

export interface ImpactMetricComponent extends Record<string, unknown> {
  id?: number;
  label?: string;
  value?: string;
  description?: string;
  icon?: string;
}

export interface OutreachCampaignEntity extends StrapiBase {
  attributes: {
    name: string;
    slug: string;
    summary?: string;
    description?: string;
    donationLink?: string;
    giveCode?: string;
    active?: boolean;
    startDate?: string | null;
    endDate?: string | null;
    impactMetrics?: ImpactMetricComponent[];
    supportingMedia?: { data?: { attributes?: Media }[] };
    stories?: { data?: OutreachStoryEntity[] };
  };
}

export interface OutreachStoryEntity extends StrapiBase {
  attributes: {
    title: string;
    slug: string;
    storyDate?: string | null;
    summary?: string;
    body?: string;
    featured?: boolean;
    media?: { data?: { attributes?: Media }[] };
    tags?: { data?: TagEntity[] };
    relatedCampaign?: { data?: OutreachCampaignEntity | null };
    seo?: SeoComponent | null;
  };
}

export interface CommunityOutreachPageEntity extends StrapiBase {
  attributes: {
    heroEyebrow?: string;
    heroTitle: string;
    heroDescription?: string;
    heroPrimaryCtaLabel?: string;
    heroPrimaryCtaUrl?: string;
    heroSecondaryCtaLabel?: string;
    heroSecondaryCtaUrl?: string;
    featuredStoriesHeading?: string;
    featuredStoriesCtaLabel?: string;
    featuredStoriesCtaUrl?: string;
    featuredStories?: { data?: OutreachStoryEntity[] };
    highlightedCampaigns?: { data?: OutreachCampaignEntity[] };
    volunteerSectionTitle?: string;
    volunteerSectionBody?: string;
    volunteerHighlights?: OutreachVolunteerPointComponent[];
    volunteerFormEmbed?: string;
    volunteerFormProvider?: string;
    givingSectionTitle?: string;
    givingSectionBody?: string;
    givingHighlights?: OutreachGivingHighlightComponent[];
    givingCtaLabel?: string;
    givingCtaUrl?: string;
    donationFormUrl?: string;
    subscriptionBannerEnabled?: boolean;
    subscriptionBanner?: OutreachSubscriptionBannerComponent | null;
    seo?: SeoComponent | null;
  };
}

// Scripture Types
export interface ScriptureWorkEntity extends StrapiBase {
  attributes: {
    workId: string;
    canonicalName: string;
    translatedTitle: string;
    shortCode: string;
    testament: 'tanakh' | 'renewed_covenant' | 'apocrypha';
    canonicalOrder: number;
    totalChapters: number;
    totalVerses: number;
    author?: string;
    estimatedDate?: string;
    genre?: 'law' | 'history' | 'wisdom' | 'prophecy' | 'gospel' | 'epistle' | 'apocalyptic';
    summary?: string;
    hebrewName?: string;
    greekName?: string;
  };
}

export interface ScriptureVerseEntity extends StrapiBase {
  attributes: {
    verseId: string;
    work?: { data?: ScriptureWorkEntity };
    chapter: number;
    verse: number;
    text: string;
    paleoHebrewDivineNames: boolean;
    hasFootnotes: boolean;
    footnotes?: Array<{
      marker: string;
      text: string;
    }>;
  };
}
