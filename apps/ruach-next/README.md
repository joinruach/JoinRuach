# Ruach Ministries — Next.js + Strapi Starter

A production-ready Next.js (App Router) project wired to Strapi with:
- NextAuth credential login (stores Strapi JWT in the session)
- Typed Strapi fetchers (with Next caching tags)
- Lesson progress API + auth
- Comments proxy + moderation (approve workflow)
- Certificate generator (Satori → Resvg) with 100% completion gate
- Upstash rate-limits (signup/resend/reports)
- Give page with donation tracker & events
- Admin comments moderation table
- Sitemap & robots
- JSON-LD/OG examples for media & course details
- Toast system for consistent UX notifications

## Quickstart

1) Copy `.env.example` → `.env.local` and fill in values.
2) `pnpm i` (or `npm i` / `yarn`)
3) `pnpm dev` → http://localhost:3000

### Required Strapi content-types (simplified)

- `course` (fields: `title`, `slug`, `description`, `cover (media)`, relation `lessons`)
- `lesson` (fields: `title`, `slug`, `order (int)`, `video_url`, relation to course optional)
- `media-item` (fields: `title`, `slug`, `description`, `category`, `video_url`, `thumbnail`)
- `lesson-progress` (fields: `user (relation to users-permissions)`, `courseSlug`, `lessonSlug`, `completed (bool)`, `secondsWatched (int)`)
- `lesson-comment` (fields: `user (relation)`, `courseSlug`, `lessonSlug`, `text`, `approved (bool)` defaults false)
- `comment-report` (fields: `user (relation)`, `commentId (string)`, `reason (text)`)

> Ensure Strapi permissions/policies return only the current user's `lesson-progress` when authorized.

### What to replace

- **Fonts**: Replace `public/fonts/Inter-*.ttf` with your brand fonts.
- **Plausible**: Replace `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` or remove the script.
- **Newsletter**: Set `NEXT_PUBLIC_CONVERTKIT_FORM_ID`, `NEXT_PUBLIC_CONVERTKIT_API_KEY`, and `CONVERTKIT_API_SECRET` (or provide the embed/action envs) so the signup form can subscribe via ConvertKit.
- **Give processor URL**: Update `DonationForm` processorUrl.
- **SEO JSON-LD/OG**: Tune `generateMetadata` and JSON-LD per page.
- **Admin checks**: Switch email allowlist to role-based policy if desired.

### Webhooks & Cache

Create a Strapi webhook that POSTs to `/api/strapi-revalidate`. We parse the payload, extract slugs, and call `revalidateTag("media:slug")`, `revalidateTag("course:slug")`, etc.

### Auth

- `/login` calls Strapi `/api/auth/local` and stores the JWT in the NextAuth session (`session.strapiJwt`).
- Lesson and certificate routes require an authenticated session.

---
