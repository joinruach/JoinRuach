# Content Type Documentation: Ruach Strapi Backend

## Table of Contents
- [Hardening & Performance Plan](#hardeningplan)
  - [0. Global Hardening](#globalhardening)
  - [1. Backfills & Fixes](#backfillsandfixes)
  - [2. API Contract](#apicontract)
  - [3. Schema Requirements & Indexes](#schemanotes)
  - [4. Performance Switches](#performanceswitches)
  - [5. Content Ops & SEO](#contentops)
  - [6. Observability & Safety](#observability)
  - [7. Quick Wins](#quickwins)
- [About](#about)
- [Article](#article)
- [Audio File](#audiofile)
- [Author](#author)
- [Blog Post](#blogpost)
- [Category](#category)
- [Channel](#channel)
- [Comment Report](#commentreport)
- [Contact Info](#contactinfo)
- [Contact Message](#contactmessage)
- [Course](#course)
- [Event](#event)
- [FAQ](#faq)
- [Gallery](#gallery)
- [Global](#global)
- [Hero Section](#herosection)
- [Image](#image)
- [Lesson](#lesson)
- [Lesson Comment](#lessoncomment)
- [Lesson Progress](#lessonprogress)
- [Media Item](#mediaitem)
- [Prayer](#prayer)
- [Project](#project)
- [Reply](#reply)
- [Setting](#setting)
- [Speaker](#speaker)
- [Impact Stat](#impactstat)
- [Tag](#tag)
- [Team Member](#teammember)
- [Testimonial](#testimonial)
- [Trending Video](#trendingvideo)
- [User Profile](#userprofile)
- [Video](#video)
- [Video Hero](#videohero)
- [User (Users & Permissions)](#useruserspermissions)


<a id="hardeningplan"></a>
## Hardening & Performance Plan

<a id="globalhardening"></a>
### 0. Global Hardening
- Validate and enforce required fields, unique constraints, and regex-pattern slugs across all schemas; set safe defaults on booleans and enumerations (e.g., `featured: false`, `type: 'testimony'`).
- Use Strapi UID fields for slugs and guard lifecycle hooks so slugs become immutable after publish.
- Add database indexes for high-traffic filters (slug, releasedAt, type) and foreign-key columns (category, channel, course, user) including join tables for many-to-many relations.
- Document a minimal `fields[]` and `populate[]` matrix per endpoint; disable deep populate globally and whitelist only the attributes needed for each response.
- Standardize pagination defaults (`pageSize=20`, hard cap `50`) and deterministic sorts (e.g., `releasedAt:desc`, `createdAt:desc`).
- Enforce an asset policy: WebP/PNG only for images, sanitise SVG uploads, cap file sizes, and stream videos exclusively from S3/CDN storage.
- Tighten role permissions so the public role is read-only on approved endpoints; lock create/update/delete routes to authenticated roles.
- Keep SEO defaults filled by maintaining the Global and Setting single types with title, description, and Open Graph image fallbacks.
- Operationalise health checks, automated backups, rate limiting, CORS restrictions, and backfill scripts to ensure production stability.

<a id="backfillsandfixes"></a>
### 1. Backfills & Fixes (Do First)
- Media Item: backfill `type`, `slug`, `featured=false`, and `releasedAt` where missing, then republish entries.
- Category, Tag, Speaker, Course, Event, Lesson, Video, Blog Post: generate missing slugs from name/title and enforce uniqueness.
- Image: populate `altText` (fallback to "Description pending" until curated).
- User Profile: ensure one-to-one linkage with `users_permissions_user` and supply a default avatar when absent.
- Contact Info, Global, Setting: complete required fields for header, footer, and SEO coverage.
- Trending Video: if unused, disable public routes and permissions to avoid unnecessary queries.
- (Optional) Append your ready-to-run console snippets here for quick execution.
- Script support: `scripts/backfill-slugs-and-defaults.ts` encapsulates the slug/default backfill and draft republish flow for repeatable runs.

<a id="apicontract"></a>
### 2. API Contract: Minimal Payloads
Use lean Strapi queries to minimise payload size and response time.

```http
GET /api/media-items?sort=releasedAt:desc&pagination[page]=1&pagination[pageSize]=20
&fields[0]=title&fields[1]=slug&fields[2]=type&fields[3]=releasedAt
&populate[thumbnail][fields][0]=url
&populate[category][fields][0]=name&populate[category][fields][1]=slug
```

```http
GET /api/lessons?filters[slug][$eq]={slug}&filters[course][slug][$eq]={courseSlug}
&fields[0]=title&fields[1]=slug&fields[2]=order
&populate[source][fields][0]=kind&populate[source][fields][1]=url&populate[source][fields][2]=file
&populate[speakers][fields][0]=name&populate[speakers][fields][1]=slug
```

```http
GET /api/videos?sort=createdAt:desc&pagination[pageSize]=12
&fields[0]=title&fields[1]=videoUrl
&populate[thumbnail][fields][0]=url
```

<a id="schemanotes"></a>
### 3. Schema Requirements & Indexes
#### High-Traffic Types
- **Media Item**: Required `title`, `slug (UID)`, `type`, `releasedAt`; indexes on `slug` (unique), `type`, `releasedAt`, `category`; forbid manual edits to `views`; prefer the `source` component over legacy `videoUrl`; thumbnails mandatory.
- **Video**: Required `videoUrl`, `title`, `slug (UID)`; indexes on `slug` (unique), `createdAt`, `trending_video`, related join tables; route uploads through the S3 controller; require thumbnails; limit populates to essentials.
- **Lesson**: Required `title`, `slug (UID)`, `order`, `course`; indexes on `slug`, `order`, `course`; enforce contiguous ordering and uniqueness per course; validate `source.kind`/`url`.
- **Course**: Required `title`, `slug (UID)`; index `slug` (unique); maintain lesson order; keep SEO fields populated.
- **Category / Tag / Speaker**: Required `name`, `slug (UID)`; indexes on `slug` (unique) and M2M join tables; keep slugs stable; require speaker photos; optional `accentColor` for categories.

#### Support Types
- **Event**: Required `title`, `slug (UID)`, `startDate`; indexes on `slug` (unique), `startDate`; validate timezone and CTA URLs.
- **Image**: Required file asset and `altText`; index `createdAt`; restrict to WebP/PNG, enforce size caps, ensure non-empty alt text.
- **Blog Post / Article**: Required `title`, `slug (UID)`; indexes on `slug` (unique) and `publishedDate` for Blog Posts; require cover images sized for OG; ensure Article has an author.
- **Prayer / Reply / Lesson Comment / Comment Report**: Ensure text/commentId/user fields are required; add indexes on foreign keys and `createdAt`; lock write access to authenticated roles; flag moderation states (`approved`, etc.); redact PII.
- **Global / Setting / Contact Info / Hero Section**: Keep required single-type fields populated; no indexes necessary; ensure assets are compressed and sized appropriately.
- **Trending Video**: Treat fields as system-managed; index `lastUpdated`; disable routes or permissions if unused.
- **User Profile / Author / Team Member**: Require `name`; enforce one-to-one linkage with users; add foreign-key indexes; ensure square avatars; avoid deleting records with active relations.

<a id="performanceswitches"></a>
### 4. Performance Switches (Strapi Config)
- Disable auto deep populate (`defaults.populateDepth = 1`).
- Require `fields[]` usage in responses; block broad dynamic-zone payloads unless explicitly needed.
- Implement caching for list endpoints with short TTL and purge on publish/unpublish.
- Protect public routes with rate limiting and restrict CORS to production domains.

<a id="contentops"></a>
### 5. Content Ops & SEO
- Apply a per-type SEO checklist: `seoTitle` ≤ 60 chars, `seoDescription` 150–160 chars, OG images 1200×630.
- Keep Global and Setting fallbacks complete for consistent metadata.
- Generate sitemaps/feeds for Course, Media Item, Video, Blog Post while excluding drafts.

<a id="observability"></a>
### 6. Observability & Safety
- Define error taxonomy (400 invalid content, 401/403 auth, 404 slug not found) and include it in developer docs.
- Maintain health-check documentation plus backup/restore runbooks.
- Sanitise SVG uploads and validate MIME types for all assets.

<a id="quickwins"></a>
### 7. Quick Wins
- Add `required` + `unique` constraints on slug/title where applicable.
- Create DB indexes for key filters: `media_item(type, releasedAt)`, `media_item(category)`, `video(createdAt)`, and many-to-many join tables.
- Update frontend fetches to the minimal populate patterns listed above.
- Run the backfill and republish scripts for media types and slugs.
- Ensure Global, Setting, and Contact Info single types have complete SEO/contact data.



<a id="about"></a>
## About
**Purpose:**  
Provides the long-form story, testimony quotes, and theological framing that anchor the About page.

**Usage:**  
Pulled by the legacy Next.js site via `useFetchAbout` for the About page and homepage About section. The new app has not yet wired this type, but will reuse the same content once the dynamic zone is mapped.

**Change Guidelines:**  
- Update `title` and the `blocks` dynamic zone when messaging evolves; keep at least one `shared.rich-text` block and one `shared.quote` block so the existing components continue to render.
- Before reordering blocks or introducing new component types, align with the frontend team because the homepage currently filters for specific block ids.

**Best Practices:**  
- Write rich text copy in Markdown and keep paragraphs concise for the homepage teaser.
- Use the quote block for a single, high-impact pull quote and review the page preview to confirm layout.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/about`
- `PUT /api/about`


<a id="article"></a>
## Article
**Purpose:**  
Stores long-form editorial content that pairs rich storytelling with media, quotes, and sliders.

**Usage:**  
Not yet surfaced in either frontend; reserved for the upcoming resource or blog experience so editors can stage content ahead of launch.

**Change Guidelines:**  
- Keep `slug` unique and stable once shared externally; update `title`, `description`, and `blocks` as the article evolves.
- Always connect an `author` and `category` so future listings can filter and attribute properly.

**Best Practices:**  
- Use the dynamic zone to mix `shared.rich-text`, `shared.quote`, and `shared.media` components instead of embedding markdown links manually.
- Attach a high-resolution `cover` image that meets OpenGraph dimensions to avoid blurry previews later.

**Required Fields:**  
- _None_

**Relations:**  
- `author`: manyToOne → Author (inverse `articles`)
- `category`: manyToOne → Category (inverse `articles`)
- `featuredInResources`: manyToMany → Resource Directory (mapped `featuredArticles`)

**Endpoints:**  
- `GET /api/articles`
- `GET /api/articles/:id`
- `POST /api/articles`
- `PUT /api/articles/:id`
- `DELETE /api/articles/:id`


<a id="audiofile"></a>
## Audio File
**Purpose:**  
Holds podcast episodes, audio testimonies, and downloadable teachings that need metadata beyond the raw file.

**Usage:**  
Not currently queried by the live frontends, but available to fuel podcast feeds or download hubs when those surfaces ship.

**Change Guidelines:**  
- Upload the final mastered file to `audioFile`; populate `title`, `description`, and `duration` before publishing.
- Tag each entry with relevant `tags` and `categories` to keep future filters accurate.

**Best Practices:**  
- Store show notes or key points in the `description` block rather than external documents.
- Favor compressed audio formats (AAC or MP3) to keep download sizes user friendly.

**Required Fields:**  
- _None_

**Relations:**  
- `tags`: manyToMany → Tag (inverse `audio_files`)
- `categories`: manyToMany → Category (inverse `audio_files`)

**Endpoints:**  
- `GET /api/audio-files`
- `GET /api/audio-files/:id`
- `POST /api/audio-files`
- `PUT /api/audio-files/:id`
- `DELETE /api/audio-files/:id`


<a id="author"></a>
## Author
**Purpose:**  
Tracks the people responsible for written content and prayer wall moderation.

**Usage:**  
Linked from the `Article` and `Prayer` types to surface attribution and drive author listings when those pages are introduced.

**Change Guidelines:**  
- Maintain `name` and a reachable `email`; update `avatar` so posts render with consistent headshots.
- Avoid deleting authors who already own content; reassign their entries first to preserve relations.

**Best Practices:**  
- Use shared inboxes for team roles (e.g., communications@) instead of personal emails when practical.
- Keep bios and extended metadata in the editorial toolset rather than bloating this core record.

**Required Fields:**  
- _None_

**Relations:**  
- `articles`: oneToMany → Article (mapped `author`)
- `prayers`: oneToMany → Prayer (mapped `author`)

**Endpoints:**  
- `GET /api/authors`
- `GET /api/authors/:id`
- `POST /api/authors`
- `PUT /api/authors/:id`
- `DELETE /api/authors/:id`


<a id="blogpost"></a>
## Blog Post
**Purpose:**  
A streamlined blog model separate from the heavier Article type, optimized for news updates and highlights.

**Usage:**  
Frontend components currently show placeholder data; wiring to this collection is planned for the blog rollout.

**Change Guidelines:**  
- Keep `slug` immutable once a post is shared; populate `title`, `content`, and `publishedDate` before publishing.
- Associate each post with the relevant `team_member` to unlock staff bios later.

**Best Practices:**  
- Use the rich-text `content` field for structured headings instead of inline HTML.
- Choose a landscape `featuredImage` to avoid cropping in card layouts.

**Required Fields:**  
- _None_

**Relations:**  
- `team_member`: manyToOne → Team Member (inverse `blog_posts`)
- `category`: manyToOne → Category
- `featuredInResources`: manyToMany → Resource Directory (mapped `featuredBlogPosts`)

**Endpoints:**  
- `GET /api/blog-posts`
- `GET /api/blog-posts/:id`
- `POST /api/blog-posts`
- `PUT /api/blog-posts/:id`
- `DELETE /api/blog-posts/:id`


<a id="category"></a>
## Category
**Purpose:**  
Provides a shared taxonomy for media, articles, audio, images, and videos across the platform.

**Usage:**  
Consumed by the new Ruach Next.js app for media filters, by the legacy media page for video grouping, and by Strapi relations on `Media Item`, `Video`, `Audio File`, and `Image`.

**Change Guidelines:**  
- Keep `name` and `slug` unique; changing a slug will break bookmarked category pages in the new media experience.
- Use `displayOrder` to control default sort order in admin views; adjust sparingly.

**Best Practices:**  
- Populate `accentColor` with a hex value so future UI treatments can color-code categories.
- When merging categories, update content relations first so orphaned records do not drop out of listings.

**Required Fields:**  
- `name`
- `slug`

**Relations:**  
- `mediaItems`: oneToMany → Media Item (mapped `category`)
- `articles`: oneToMany → Article (mapped `category`)
- `audio_files`: manyToMany → Audio file (mapped `categories`)
- `images`: manyToMany → Image (mapped `categories`)
- `videos`: manyToMany → Video (mapped `categories`)

**Endpoints:**  
- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories`
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id`


<a id="channel"></a>
## Channel
**Purpose:**  
Represents distribution channels such as YouTube or podcast feeds, including brand avatar and description blocks.

**Usage:**  
Queried indirectly via the `Video` relation to display channel names and avatars in the legacy Latest Videos and Trending sections.

**Change Guidelines:**  
- Set `name` and upload an `avatar` that respects square ratios; fill the `description` blocks with markdown when context is needed.
- Attach the collection of `videos` so editors can audit which assets belong to each channel.

**Best Practices:**  
- Keep channel bios tight; the frontend favors short descriptions for hover tooltips.
- Align channel records with the canonical public handle to simplify analytics and cross-posting.

**Required Fields:**  
- `name`

**Relations:**  
- `videos`: manyToMany → Video (mapped `channels`)

**Endpoints:**  
- `GET /api/channels`
- `GET /api/channels/:id`
- `POST /api/channels`
- `PUT /api/channels/:id`
- `DELETE /api/channels/:id`


<a id="commentreport"></a>
## Comment Report
**Purpose:**  
Captures user-submitted reports for lesson comments so moderators can review abusive or inaccurate content.

**Usage:**  
Created by the new app’s `/api/reports` route whenever an authenticated user flags a comment; surfaced internally through Strapi’s admin.

**Change Guidelines:**  
- Treat `commentId` as immutable—it maps to the Strapi lesson comment record the user flagged.
- `user` is populated automatically from the reporter’s JWT; only adjust if you discover a mis-linked account.

**Best Practices:**  
- Document follow-up actions in Strapi notes or a separate moderation log instead of editing the original report text.
- Archive resolved reports periodically to keep the moderation queue lean.

**Required Fields:**  
- `commentId`

**Relations:**  
- `user`: manyToOne → User

**Endpoints:**  
- `GET /api/comment-reports`
- `GET /api/comment-reports/:id`
- `POST /api/comment-reports`
- `PUT /api/comment-reports/:id`
- `DELETE /api/comment-reports/:id`


<a id="contactinfo"></a>
## Contact Info
**Purpose:**  
Stores canonical ministry contact details and social links for public display.

**Usage:**  
Loaded by the legacy site footer (`Footer.tsx`) to render email, phone, address, and linked platforms.

**Change Guidelines:**  
- Update `email`, `phone`, and `address` when details change; all values render directly in the footer.
- Manage social profiles through the `general.social-links` component and include full absolute URLs.

**Best Practices:**  
- Use accessible link labels (e.g., "Ruach on YouTube") in the `label` field to support screen readers.
- Keep social entries to active channels to avoid dead links in production.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/contact-info`
- `PUT /api/contact-info`


<a id="resource-directory"></a>
## Resource Directory
**Purpose:**  
Centralizes copy, highlights, and curated content for the `/resources` landing page.

**Usage:**  
Editors manage the hero copy, featured callouts, and per-section configuration from this singleton. The Next.js app consumes the record to render dynamic grids and CTAs.

**Change Guidelines:**  
- Keep `title` aligned with the on-page hero headline; update `heroCopy` for body text and supporting paragraphs.
- Use `highlights` for short callouts or stat blocks and link them with the inline CTA fields when relevant.
- Configure each entry in `sections` with the desired `type`, optional category/tag filters, and manual overrides via highlighted relations.
- Attach featured Media Items, Lessons, Articles, or Blog Posts when you need universal fallbacks regardless of section order.

**Best Practices:**  
- Favor the `category` relation on sections so filters stay in sync with `/media` and future blog tooling.
- Limit manual overrides to a handful of items per card to keep the UI balanced and avoid performance hits.
- Populate the `seo` component before launch to keep previews consistent across social platforms.

**Required Fields:**  
- `title`

**Relations:**  
- `featuredMediaItems`: manyToMany → Media Item (inverse `featuredInResources`)
- `featuredLessons`: manyToMany → Lesson (inverse `featuredInResources`)
- `featuredArticles`: manyToMany → Article (inverse `featuredInResources`)
- `featuredBlogPosts`: manyToMany → Blog Post (inverse `featuredInResources`)

**Endpoints:**  
- `GET /api/resource-directory`
- `PUT /api/resource-directory`


<a id="contactmessage"></a>
## Contact Message
**Purpose:**  
Receives inbound inquiries and testimonies submitted from the public contact form.

**Usage:**  
Written by the legacy contact page at `ruach-webapp/ruach-ministries/src/app/contact/page.tsx`; reviewed via the Strapi admin inbox.

**Change Guidelines:**  
- Treat existing entries as read-only—mark resolution status in your CRM or by adding admin notes rather than editing the original submission.
- Export and clear aged messages periodically if volume grows to keep the collection manageable.

**Best Practices:**  
- Respond to the original sender using the email captured here; Strapi does not send automatic replies.
- Consider tagging processed messages through the Strapi admin "labels" feature instead of deleting them outright.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/contact-messages`
- `GET /api/contact-messages/:id`
- `POST /api/contact-messages`
- `PUT /api/contact-messages/:id`
- `DELETE /api/contact-messages/:id`


<a id="course"></a>
## Course
**Purpose:**  
Defines Ruach Academy courses, including marketing copy, media assets, and SEO metadata.

**Usage:**  
Consumed by the new Ruach Next.js app for `/courses`, `/courses/[slug]`, the certificate API, and lesson navigation.

**Change Guidelines:**  
- Keep `slug` unique and stable; changing it breaks existing course URLs, progress tracking records, and certificate lookups.
- Maintain the `lessons` relation and `order` values so modules display in the intended sequence.

**Best Practices:**  
- Populate `heroVideo`, `cover`, and `excerpt` to give the course detail page rich visuals.
- Fill `seoTitle`, `seoDescription`, and `seoImage` for better share cards and search visibility.

**Required Fields:**  
- `title`
- `slug`

**Relations:**  
- `lessons`: oneToMany → Lesson (mapped `course`)

**Endpoints:**  
- `GET /api/courses`
- `GET /api/courses/:id`
- `POST /api/courses`
- `PUT /api/courses/:id`
- `DELETE /api/courses/:id`


<a id="event"></a>
## Event
**Purpose:**  
Manages conferences, gatherings, outreaches, and online events with full logistics and registration details.

**Usage:**  
Displayed on the new app’s `/events` index and detail pages via `getEvents` and `getEventBySlug`.

**Change Guidelines:**  
- Keep `slug` fixed once promoted; it powers the event detail route and Google indexing.
- Ensure `startDate` and `category` are set, and update `registrationUrl` plus `ctaLabel` whenever call-to-action links change.

**Best Practices:**  
- Provide high-resolution `cover` imagery and populate `heroGallery` for post-event storytelling.
- Confirm `timezone` and `location` formatting because the frontend shows them verbatim.

**Required Fields:**  
- `title`
- `slug`
- `startDate`

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/events`
- `GET /api/events/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`


<a id="faq"></a>
## FAQ
**Purpose:**  
Captures canonical questions and answers for onboarding and support.

**Usage:**  
Not yet rendered by a frontend surface; available for quick integration into support or landing pages.

**Change Guidelines:**  
- Phrase the `question` succinctly and write the `answer` in the provided rich-text block.
- Group related entries using Strapi categories or tags if the FAQ library grows large.

**Best Practices:**  
- Keep answers pastoral and action-oriented; link to deeper resources rather than duplicating long-form teachings.
- Review periodically to retire outdated items and avoid contradictory guidance.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/faqs`
- `GET /api/faqs/:id`
- `POST /api/faqs`
- `PUT /api/faqs/:id`
- `DELETE /api/faqs/:id`


<a id="gallery"></a>
## Gallery
**Purpose:**  
Organises curated sets of media assets, useful for press kits or recap pages.

**Usage:**  
Not currently consumed; intended for future media galleries or download bundles.

**Change Guidelines:**  
- Title each gallery clearly and upload the full collection through the `image` media field.
- Keep file naming consistent so downstream automation (e.g., zip exports) remains predictable.

**Best Practices:**  
- Favor landscape images and compress them before upload to keep bundle sizes manageable.
- Use galleries to group assets by campaign or event rather than uploading ad-hoc files.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/galleries`
- `GET /api/galleries/:id`
- `POST /api/galleries`
- `PUT /api/galleries/:id`
- `DELETE /api/galleries/:id`


<a id="global"></a>
## Global
**Purpose:**  
Holds site-wide defaults such as global SEO metadata, organization contact info, and CTA links.

**Usage:**  
Ready for consumption by both frontends; ideal for Next.js layout metadata once wired.

**Change Guidelines:**  
- Maintain `siteName`, `siteDescription`, and `defaultSeo`; these values should reflect the overarching brand.
- Update `primaryCtaLabel` and `primaryCtaUrl` only when the primary organizational ask shifts.

**Best Practices:**  
- Keep the `defaultSeo` component populated to avoid blank social cards on unconfigured pages.
- Align contact fields with the dedicated `Contact Info` single type to prevent divergence.

**Required Fields:**  
- `siteName`
- `siteDescription`

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/global`
- `PUT /api/global`


<a id="herosection"></a>
## Hero Section
**Purpose:**  
Controls the hero headline, subtitle, background image, and CTA used on the legacy homepage.

**Usage:**  
Queried by `HeroSection.tsx` in the legacy Next.js site to render the top-of-page experience.

**Change Guidelines:**  
- Refresh `title`, `subtitle`, and `button` copy as campaigns shift; ensure the `backgroundImage` is high resolution and compressed.
- If you need multiple CTAs, coordinate a schema update instead of overloading the existing single button fields.

**Best Practices:**  
- Provide descriptive alt text on the background image to maintain accessibility.
- Preview the hero on mobile and desktop to confirm text remains legible over the image overlay.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/hero-section`
- `PUT /api/hero-section`


<a id="image"></a>
## Image
**Purpose:**  
Stores individual media assets with alt text and taxonomy metadata for reuse across the site.

**Usage:**  
Linked to `Team Member`, `Category`, and `Tag` records; also available for manual selection through the Strapi media library.

**Change Guidelines:**  
- Always fill `altText` for accessibility and SEO.
- Use the `team_member` relation for headshots so the Team Members component can surface the correct photo set.

**Best Practices:**  
- Upload optimized WebP files when possible to keep public pages fast.
- Maintain consistent naming conventions to simplify asset searches in the Strapi library.

**Required Fields:**  
- _None_

**Relations:**  
- `tags`: manyToMany → Tag (inverse `images`)
- `categories`: manyToMany → Category (inverse `images`)
- `team_member`: manyToOne → Team Member (inverse `images`)

**Endpoints:**  
- `GET /api/images`
- `GET /api/images/:id`
- `POST /api/images`
- `PUT /api/images/:id`
- `DELETE /api/images/:id`


<a id="lesson"></a>
## Lesson
**Purpose:**  
Represents individual course lessons, including playback options, transcripts, and supplemental resources.

**Usage:**  
Fetched by the new app in course detail and lesson routes; feeds player configuration and resource download links.

**Change Guidelines:**  
- Keep `slug` unique within the course and aligned with the lesson URL; avoid renaming after publishing to preserve progress records.
- Configure the `source` component (`media.video-source`) with the correct `kind` (YouTube, Vimeo, Rumble, File, or Custom) and either `url` or uploaded `file`.

**Best Practices:**  
- Use the `order` field to define the exact sequence and ensure numbers remain contiguous.
- Attach `resources` for notes or assignments and update `previewAvailable` for lessons you want to expose publicly.

**Required Fields:**  
- `title`
- `slug`
- `order`

**Relations:**  
- `course`: manyToOne → Course (inverse `lessons`)
- `category`: manyToOne → Category
- `speakers`: manyToMany → Speaker (mapped `lessons`)
- `featuredInResources`: manyToMany → Resource Directory (mapped `featuredLessons`)

**Endpoints:**  
- `GET /api/lessons`
- `GET /api/lessons/:id`
- `POST /api/lessons`
- `PUT /api/lessons/:id`
- `DELETE /api/lessons/:id`


<a id="lessoncomment"></a>
## Lesson Comment
**Purpose:**  
Stores threaded discussion beneath lessons, enabling moderated community conversation.

**Usage:**  
Created via the new app’s `/api/comments` endpoint; displayed on lesson detail pages and moderated through admin workflows.

**Change Guidelines:**  
- Leave `courseSlug` and `lessonSlug` untouched after creation—they tie the comment to the correct lesson view.
- Use the `approved` flag to moderate visibility; comments remain hidden until this field is true.

**Best Practices:**  
- Encourage moderators to respond through the frontend instead of editing the original text to maintain authenticity.
- Monitor for spam and use the `Comment Report` queue to drive review cycles.

**Required Fields:**  
- `courseSlug`
- `lessonSlug`
- `text`

**Relations:**  
- `user`: manyToOne → User

**Endpoints:**  
- `GET /api/lesson-comments`
- `GET /api/lesson-comments/:id`
- `POST /api/lesson-comments`
- `PUT /api/lesson-comments/:id`
- `DELETE /api/lesson-comments/:id`


<a id="lessonprogress"></a>
## Lesson Progress
**Purpose:**  
Tracks per-user watch progress and completion state for each lesson.

**Usage:**  
Written by the new app’s `/api/progress/complete` endpoint and consulted when issuing course completion certificates.

**Change Guidelines:**  
- Treat records as system-managed; adjust via automation or migration scripts rather than manually editing in admin.
- Never change `courseSlug` or `lessonSlug` after creation, as they serve as natural keys for lookup.

**Best Practices:**  
- Periodically archive stale progress (e.g., test accounts) to keep the dataset lean.
- If you need to reset a user, delete rows through controlled scripts so downstream services stay in sync.

**Required Fields:**  
- `courseSlug`
- `lessonSlug`

**Relations:**  
- `user`: manyToOne → User

**Endpoints:**  
- `GET /api/lesson-progresses`
- `GET /api/lesson-progresses/:id`
- `POST /api/lesson-progresses`
- `PUT /api/lesson-progresses/:id`
- `DELETE /api/lesson-progresses/:id`


<a id="mediaitem"></a>
## Media Item
**Purpose:**  
Aggregates testimonies, teachings, worship sets, podcasts, and shorts into a unified media catalogue.

**Usage:**  
Drives the new app’s `/media` listing and detail pages, feeds featured testimony callouts, and exposes a `/api/media-items/:id/view` route that increments `views`.

**Change Guidelines:**  
- Keep `title`, `slug`, and `type` accurate; do not edit the `views` or `legacyCategory` fields because they are system-managed.
- Populate `category`, `source`, `thumbnail`, and optional `speakers`/`tags` so filtering, playback, and attribution work.

**Best Practices:**  
- Fill `releasedAt`, `ctaLabel`, `ctaUrl`, and SEO fields for better scheduling and sharing.
- When embedding hosted video, set the `source` component instead of relying solely on the deprecated `videoUrl` string.

**Required Fields:**  
- `title`
- `type`
- `slug`

**Relations:**  
- `category`: manyToOne → Category (inverse `mediaItems`)
- `speakers`: manyToMany → Speaker (inverse `mediaItems`)
- `tags`: manyToMany → Tag (mapped `mediaItems`)

**Endpoints:**  
- `GET /api/media-items`
- `GET /api/media-items/:id`
- `POST /api/media-items`
- `PUT /api/media-items/:id`
- `DELETE /api/media-items/:id`
- `POST /api/media-items/:id/view`


<a id="prayer"></a>
## Prayer
**Purpose:**  
Captures prayer requests and praise reports for the public prayer wall and internal ministry follow-up.

**Usage:**  
Rendered on the legacy community page (`/community`) and consumed by the new homepage `PrayerWallFeed` component.

**Change Guidelines:**  
- Update `status` to reflect answered or closed requests; adjust `featured` for items you want to highlight.
- Use the `replies` relation to attach pastoral responses rather than editing the original request body.

**Best Practices:**  
- Respect privacy—remove personally identifying information before publishing if the requester asks.
- Monitor `prayedCount` for engagement trends and reset only when intentional (e.g., archiving).

**Required Fields:**  
- _None_

**Relations:**  
- `author`: manyToOne → Author (inverse `prayers`)
- `replies`: oneToMany → Reply (mapped `prayer`)

**Endpoints:**  
- `GET /api/prayers`
- `GET /api/prayers/:id`
- `POST /api/prayers`
- `PUT /api/prayers/:id`
- `DELETE /api/prayers/:id`


<a id="project"></a>
## Project
**Purpose:**  
Showcases missional initiatives, compassion projects, and campaign updates.

**Usage:**  
Loaded by `MissionGrid` and `ProjectDisplay` components in the legacy site and featured on the homepage.

**Change Guidelines:**  
- Provide a compelling `title`, `description`, and `thumbnail`; set `videoURL` only when there is a companion film or highlight reel.
- Keep `publishedDate` accurate so projects can be sorted chronologically.

**Best Practices:**  
- Use the Strapi rich-text blocks to outline impact stories rather than linking to external docs.
- Refresh projects regularly to reflect current initiatives and prevent stale fundraising asks.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/projects`
- `GET /api/projects/:id`
- `POST /api/projects`
- `PUT /api/projects/:id`
- `DELETE /api/projects/:id`


<a id="reply"></a>
## Reply
**Purpose:**  
Stores staff or community responses to prayer requests.

**Usage:**  
Hooked up for future expansion of the prayer wall; relations exist so replies can surface next to prayers when the UI ships.

**Change Guidelines:**  
- Populate `author` with a `User Profile` record and associate the parent `prayer`; leave records untouched once published to maintain response integrity.
- Avoid orphaning replies by deleting prayers—archive instead so the conversation history remains intact.

**Best Practices:**  
- Use concise, pastoral language that acknowledges the original request before offering encouragement.
- Track follow-up actions outside the reply text to keep the public thread focused on ministry.

**Required Fields:**  
- _None_

**Relations:**  
- `author`: oneToOne → User Profile (inverse `reply`)
- `prayer`: manyToOne → Prayer (inverse `replies`)

**Endpoints:**  
- `GET /api/replies`
- `GET /api/replies/:id`
- `POST /api/replies`
- `PUT /api/replies/:id`
- `DELETE /api/replies/:id`


<a id="setting"></a>
## Setting
**Purpose:**  
Provides site branding assets (logo, favicon) and default SEO metadata for the legacy header.

**Usage:**  
Fetched by `Header.tsx` to render the logo, site name, and fallback meta details.

**Change Guidelines:**  
- Update `siteName`, `logo`, `favicon`, and `defaultSEO` together when rebranding to avoid mismatched imagery.
- Ensure file uploads include transparent backgrounds where needed so they blend with the header design.

**Best Practices:**  
- Keep the default SEO component synchronized with the `Global` single type to eliminate conflicting metadata.
- Replace large bitmap logos with optimized SVGs for crisp rendering.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/settings`
- `GET /api/settings/:id`
- `POST /api/settings`
- `PUT /api/settings/:id`
- `DELETE /api/settings/:id`


<a id="speaker"></a>
## Speaker
**Purpose:**  
Profiles teachers, storytellers, and worship leaders featured in media items and lessons.

**Usage:**  
Populated in Strapi and exposed in the new media detail page (speaker badges) and lesson metadata.

**Change Guidelines:**  
- Maintain `slug`, `name`, and `photo`; update bios and organizations as roles evolve.
- Link `mediaItems` and `lessons` to each speaker to keep content attribution complete.

**Best Practices:**  
- Use the `socialLinks` component to share official handles; verify URLs before publishing.
- Flag `featured` speakers who should appear in highlight carousels or filters in future UI iterations.

**Required Fields:**  
- `name`
- `slug`

**Relations:**  
- `mediaItems`: manyToMany → Media Item (mapped `speakers`)
- `lessons`: manyToMany → Lesson (inverse `speakers`)

**Endpoints:**  
- `GET /api/speakers`
- `GET /api/speakers/:id`
- `POST /api/speakers`
- `PUT /api/speakers/:id`
- `DELETE /api/speakers/:id`


<a id="impactstat"></a>
## Impact Stat
**Purpose:**  
Summarizes ministry outcomes with a headline and supporting metrics.

**Usage:**  
Read by the new `ImpactCounters` component, which expects at least one metric entry.

**Change Guidelines:**  
- Provide a compelling `headline` and populate the `metrics` repeatable component with `label` and `value`.
- Avoid removing all metrics; the frontend hides the entire block when none exist.

**Best Practices:**  
- Express metric values as formatted strings (e.g., "1.2M views") so you can include units.
- Limit the number of metrics to three or four to keep the counters visually balanced.

**Required Fields:**  
- `headline`

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/stats`
- `GET /api/stats/:id`
- `POST /api/stats`
- `PUT /api/stats/:id`
- `DELETE /api/stats/:id`


<a id="tag"></a>
## Tag
**Purpose:**  
Delivers flexible taxonomy for media, audio, images, and videos.

**Usage:**  
Attached to content in Strapi and exposed through API responses, enabling future filter controls and discovery experiences.

**Change Guidelines:**  
- Keep `name` and `slug` unique; avoid renaming slugs or you will break saved filters and marketing URLs.
- Associate tags with the relevant media collections to maintain clean taxonomy.

**Best Practices:**  
- Use lowercase, hyphenated slugs for consistency.
- Audit tags periodically to merge duplicates and retire unused labels.

**Required Fields:**  
- `name`
- `slug`

**Relations:**  
- `mediaItems`: manyToMany → Media Item (inverse `tags`)
- `audio_files`: manyToMany → Audio file (mapped `tags`)
- `images`: manyToMany → Image (mapped `tags`)
- `videos`: manyToMany → Video (mapped `tags`)

**Endpoints:**  
- `GET /api/tags`
- `GET /api/tags/:id`
- `POST /api/tags`
- `PUT /api/tags/:id`
- `DELETE /api/tags/:id`


<a id="teammember"></a>
## Team Member
**Purpose:**  
Highlights staff members along with bios, roles, and supporting imagery.

**Usage:**  
Rendered on the legacy “Meet the Team” section via `TeamMembers.tsx` and linked to blog posts for author attribution.

**Change Guidelines:**  
- Keep `name`, `role`, `bio`, and `profilePicture` current; update `socialLinks` when handles change.
- Manage the `images` relation so the gallery shows the correct supporting photos per member.

**Best Practices:**  
- Structure bios with short paragraphs to maintain readability on mobile.
- Ensure at least one image exists per member so the layout remains balanced.

**Required Fields:**  
- _None_

**Relations:**  
- `blog_posts`: oneToMany → Blog Post (mapped `team_member`)
- `images`: oneToMany → Image (mapped `team_member`)

**Endpoints:**  
- `GET /api/team-members`
- `GET /api/team-members/:id`
- `POST /api/team-members`
- `PUT /api/team-members/:id`
- `DELETE /api/team-members/:id`


<a id="testimonial"></a>
## Testimonial
**Purpose:**  
Stores partner and audience testimonials for marketing use.

**Usage:**  
Not yet displayed on the current frontends; content is ready for future landing pages.

**Change Guidelines:**  
- Capture `clientName`, `feedback`, and optional `rating`; add a `clientImage` when consent is granted.
- Verify testimonies align with Ruach’s theological commitments before publishing.

**Best Practices:**  
- Use the rich-text field for structured storytelling instead of embedding long single paragraphs.
- Tag testimonials by campaign or ministry focus using Strapi labels to simplify future filtering.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/testimonials`
- `GET /api/testimonials/:id`
- `POST /api/testimonials`
- `PUT /api/testimonials/:id`
- `DELETE /api/testimonials/:id`


<a id="trendingvideo"></a>
## Trending Video
**Purpose:**  
Tracks calculated trending metrics separate from the main `Video` collection.

**Usage:**  
Currently unused by the UI; intended for background jobs or analytics scripts that push curated trending lists.

**Change Guidelines:**  
- Treat `views`, `trendingScore`, and `lastUpdated` as system-managed; populate them via scripts, not manual edits.
- If you migrate data, keep the record ids aligned with the related `Video` entries the metrics describe.

**Best Practices:**  
- Schedule automation to refresh scores daily so “trending” reflects recent engagement.
- Consider consolidating this model with the `Video` `trending_video` flag if manual maintenance becomes cumbersome.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/trending-videos`
- `GET /api/trending-videos/:id`
- `POST /api/trending-videos`
- `PUT /api/trending-videos/:id`
- `DELETE /api/trending-videos/:id`


<a id="userprofile"></a>
## User Profile
**Purpose:**  
Extends authentication data with display name, bio, location, social links, and preferences.

**Usage:**  
Managed through the legacy dashboard profile editor (`ProfileEditForm.tsx`) and displayed on the `/profiles` directory.

**Change Guidelines:**  
- Keep the one-to-one `users_permissions_user` relation intact; deleting a profile orphan leaves the linked Strapi user without metadata.
- Respect the `role` enumeration (Artist, Supporter, Collaborator) when assigning roles so downstream permissions remain predictable.

**Best Practices:**  
- Store structured settings or notification hydration in the `preferences` JSON field.
- For avatars, upload square images; the UI assumes a 1:1 aspect ratio.

**Required Fields:**  
- _None_

**Relations:**  
- `users_permissions_user`: oneToOne → User (inverse `user_profile`)
- `reply`: oneToOne → Reply (mapped `author`)

**Endpoints:**  
- `GET /api/user-profiles`
- `GET /api/user-profiles/:id`
- `POST /api/user-profiles`
- `PUT /api/user-profiles/:id`
- `DELETE /api/user-profiles/:id`


<a id="video"></a>
## Video
**Purpose:**  
Houses the full video library, including hosted file URLs, thumbnails, taxonomy, and channel associations.

**Usage:**  
Powers the legacy site’s Latest Videos, media browsing page, trending carousel, and individual video detail routes. It also features a custom `/api/videos/upload` endpoint that uploads new files to S3 via the Strapi controller.

**Change Guidelines:**  
- Populate `videoUrl` (YouTube, Vimeo, or direct file), `title`, and `description`; link `categories`, `tags`, and `channels` for discoverability.
- Use the boolean `trending_video` flag to promote items into the trending carousels; keep `uid` consistent if external systems rely on it.

**Best Practices:**  
- Use the custom upload route for large files so they stream from S3 rather than consuming Strapi storage.
- Provide high-quality `thumbnail` assets; the frontends fall back to YouTube thumbnails only when necessary.

**Required Fields:**  
- `videoUrl`

**Relations:**  
- `tags`: manyToMany → Tag (inverse `videos`)
- `categories`: manyToMany → Category (inverse `videos`)
- `channels`: manyToMany → Channel (inverse `videos`)

**Endpoints:**  
- `GET /api/videos`
- `GET /api/videos/:id`
- `POST /api/videos`
- `PUT /api/videos/:id`
- `DELETE /api/videos/:id`
- `POST /api/videos/upload`


<a id="videohero"></a>
## Video Hero
**Purpose:**  
Configures hero call-to-action buttons for video-centric landing experiences.

**Usage:**  
Fetched by the legacy `VideoHeroSection` component to populate CTAs; the component currently falls back to a default background video because the schema only stores buttons.

**Change Guidelines:**  
- Manage the repeatable `general.button` component to control button text and links.
- Coordinate with engineering before adding new fields (e.g., background video URLs) so the frontend can consume them instead of relying on defaults.

**Best Practices:**  
- Keep button labels action-oriented (“Watch Now”, “Learn More”) and set internal links as leading slashes for Next.js routing.
- Limit the number of buttons to two or three to preserve layout clarity.

**Required Fields:**  
- _None_

**Relations:**  
- _None_

**Endpoints:**  
- `GET /api/video-heroes`
- `GET /api/video-heroes/:id`
- `POST /api/video-heroes`
- `PUT /api/video-heroes/:id`
- `DELETE /api/video-heroes/:id`


<a id="useruserspermissions"></a>
## User (Users & Permissions)
**Purpose:**  
Provides authentication, authorization, and JWT issuance for both frontends.

**Usage:**  
Accessed by Strapi’s custom auth controller to issue refresh tokens and by the new app for lesson progress, comments, and reporting. Each user links one-to-one with a `User Profile`.

**Change Guidelines:**  
- Do not edit `password`, `resetPasswordToken`, or `confirmationToken` fields manually—they are managed by Strapi’s auth workflows.
- Maintain the `role` relation and `user_profile` link; removing either breaks access or profile pages.

**Best Practices:**  
- Enforce unique `username` and `email` values and standardize on lowercase emails to avoid duplicate accounts.
- Rotate privileged accounts and use Strapi roles to limit backend access rather than sharing credentials.

**Required Fields:**  
- `username`
- `email`

**Relations:**  
- `role`: manyToOne → Role (inverse `users`)
- `user_profile`: oneToOne → User Profile (mapped `users_permissions_user`)
- `lesson_progresses`: oneToMany → Lesson Progress (mapped `user`)
- `lesson_comments`: oneToMany → Lesson Comment (mapped `user`)
- `comment_reports`: oneToMany → Comment Report (mapped `user`)

**Endpoints:**  
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`
- `POST /api/auth/local`
