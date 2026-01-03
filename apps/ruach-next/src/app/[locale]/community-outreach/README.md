# Community Outreach Pages

This directory contains the community outreach section of the Ruach Ministries website, showcasing outreach initiatives, stories, and campaigns.

## Pages

### `/community-outreach` - Main Landing Page
**File**: `page.tsx`

Displays the comprehensive community outreach hub with:
- Hero section with customizable CTAs
- Featured outreach stories grid
- Active campaigns with impact metrics
- Volunteer signup section with form embed
- Giving/donation section
- Optional subscription banner

**Data Sources**:
1. `getCommunityOutreachPage()` - Fetches page content from Strapi
2. `getOutreachStories()` - Fetches stories with 3-tier fallback:
   - Featured stories from page content
   - Stories marked as featured
   - Most recent stories
   - Hardcoded fallback stories

### `/community-outreach/stories` - Stories Index
**File**: `stories/page.tsx`

Paginated listing of all outreach stories.

**Data Sources**:
- `getOutreachStories({ limit: 24, page: currentPage })`
- Maps to media cards via `mapStoryToMediaCard()`

**Features**:
- Pagination support via `?page=N` query param
- Fallback message when no stories exist
- Links back to main outreach page

### `/community-outreach/stories/[slug]` - Story Detail
**File**: `stories/[slug]/page.tsx`

Individual story page with full content, media, and related stories.

**Data Sources**:
- `getOutreachStoryBySlug(slug)` - Main story content
- `getOutreachStories({ limit: 4, excludeIds: [story.id] })` - Related stories

**Features**:
- Full story content with rich text body
- Hero image/media gallery
- Story tags display
- Related campaign information
- Related stories grid
- SEO metadata with OpenGraph images

## Data Flow

### Strapi Content Types

**Community Outreach Page** (Single Type)
```
/api/community-outreach-page
- heroEyebrow, heroTitle, heroDescription
- heroPrimaryCtaLabel, heroPrimaryCtaUrl
- heroSecondaryCtaLabel, heroSecondaryCtaUrl
- featuredStories (relation → OutreachStory[])
- highlightedCampaigns (relation → OutreachCampaign[])
- volunteerSectionTitle, volunteerSectionBody
- volunteerHighlights (component: outreach.volunteer-point[])
- volunteerFormEmbed, volunteerFormProvider
- givingSectionTitle, givingSectionBody
- givingHighlights (component: outreach.giving-highlight[])
- donationFormUrl
- subscriptionBannerEnabled
- subscriptionBanner (component: outreach.subscription-banner)
- seo (component: shared.seo)
```

**Outreach Story** (Collection Type)
```
/api/outreach-stories
- title, slug
- storyDate
- summary, body (rich text)
- media (images/videos/files[])
- tags (relation → Tag[])
- featured (boolean)
- relatedCampaign (relation → OutreachCampaign)
- seo (component: shared.seo)
```

**Outreach Campaign** (Collection Type)
```
/api/outreach-campaigns
- name, slug
- summary, description
- impactMetrics (component: impact.metric[])
- supportingMedia (images/videos[])
- donationLink, giveCode
- active (boolean)
- startDate, endDate
- stories (relation ← OutreachStory[])
```

### Helper Functions

**`story-helpers.ts`**:
- `mapStoryToMediaCard()` - Converts OutreachStoryEntity → MediaCardProps
- `getPrimaryStoryMedia()` - Extracts first media item from story
- `formatStoryDate()` - Formats story dates for display

### API Calls

All Strapi API calls are in `/lib/strapi.ts`:

- `getCommunityOutreachPage()` (L:1154-1174)
  - Populates with `deep,4` to get all nested relations
  - Revalidates every 300 seconds (5 minutes)
  - Returns null on 404 or network error

- `getOutreachStories(options)` (L:1184-1228)
  - Options: `{ limit?, featured?, includeDraft?, excludeIds?, page? }`
  - Sorts by storyDate desc, then publishedAt desc
  - Populates with `deep,2`
  - Returns empty array on error

- `getOutreachStoryBySlug(slug)` (L:1230-1249)
  - Populates with `deep,3`
  - Returns null on 404 or network error

- `getOutreachStorySlugs(limit)` (L:1251-1272)
  - Fetches only slug field for static generation
  - Returns empty array on error

## Static Generation

All pages use Next.js static generation:
- `export const dynamic = "force-static"`
- `export const revalidate = 300` (5 minutes)

Story detail pages pre-generate the 60 most recent stories via `generateStaticParams()`.

## Error Handling

All data fetching includes `.catch()` handlers:
- API errors gracefully fall back to default content
- Missing data uses fallback values or empty arrays
- Network errors don't break page rendering

## Components Used

- `MediaGrid` - Displays grid of story cards
- `DonationForm` - Embedded giving form
- `VolunteerSignupForm` - Volunteer registration
- `EmbedScript` - Renders third-party form embeds (e.g., Typeform, Google Forms)

## Environment Variables

- `NEXT_PUBLIC_STRAPI_URL` - Strapi backend URL
- `NEXT_PUBLIC_MEDIA_CDN_URL` - CDN for media assets (default: https://cdn.joinruach.org)
- `NEXT_PUBLIC_STRIPE_CHECKOUT_SESSION_PATH` - Donation session endpoint used by the embedded `DonationForm` (defaults to `/api/stripe/create-donation-session`)

## Customization via Strapi

Content editors can customize:
1. Hero section text and CTAs
2. Featured stories selection
3. Campaign highlights with metrics
4. Volunteer section copy and form embed
5. Giving section copy and highlights
6. Subscription banner toggle and content
7. SEO metadata for all pages

All content is editable through the Strapi admin panel without code changes.
