# Giving & Donations Strategy (Stripe Only)

This page summarizes every giving touchpoint, the Stripe-first donation experience, and the backend model for **three distinct domains**:

- **Donations** → generosity (one-time or recurring gifts)
- **Memberships** → partnership (recurring covenant support + community benefits)
- **Courses** → formation products (one-time purchases + course licenses)

Key principle: **Memberships do not equal Courses.** Membership can bless course participation (discounts/early access), but course access should be **license-based**, not role-based.

## 1. UI surfaces

- **`/give` page** (`apps/ruach-next/src/app/[locale]/give/page.tsx`) now uses the shared `DonationForm` component to collect custom amounts, supports monthly toggles, and surfaces Stripe subscription buttons for partners, all in one place.
- **Embedded forms** on content-heavy pages (`builders/page.tsx:287`, `community-outreach/page.tsx:315`) re-use `DonationForm` so any copy updates immediately apply across builder, outreach, and donor-facing experiences.
- **Member portal** (`members/account/page.tsx:559`) points donors to `/give` and keeps `StripeSubscriptionButtons` centered on monthly support and billing management; there is no longer a separate Givebutter link.
- **Conference CTA** (`conferences/page.tsx:240`) falls back to `/give` and still allows editors to inject a Strapi-managed embed snippet if they want to show a Stripe payment link or donation block inline.

## 2. Stripe configuration

- `STRIPE_SECRET_KEY` — your live Stripe secret (used by the backend to create checkout sessions).
- `STRIPE_PARTNER_PRICE_ID` — the recurring price for the membership tier (used in `/api/stripe/create-checkout-session`).
- `STRIPE_CHECKOUT_SUCCESS_URL`, `STRIPE_CHECKOUT_CANCEL_URL`, `STRIPE_BILLING_RETURN_URL` — redirect targets after checkout/cancellation/billing portal.
- `NEXT_PUBLIC_STRIPE_CHECKOUT_SESSION_PATH` — overrides `/api/stripe/create-donation-session` when you want to host the donation endpoint elsewhere.
- `NEXT_PUBLIC_STRIPE_BILLING_PORTAL_PATH` — redirects that power the “Manage billing” buttons on membership controls.

The new `/api/stripe/create-donation-session` route (`apps/ruach-next/src/app/api/stripe/create-donation-session/route.ts`) accepts `{ amount, monthly?, campaign? }`, validates the amount, and builds either a one-time payment or recurring subscription directly via Stripe’s checkout sessions API. Metadata tags every donation with `type: donation`, `monthly`, and the optional `campaign` so you can segment gifts later.

## 3. Backend alignment & data model

- **Stripe webhook sync** (`ruach-ministries-backend/src/api/stripe/controllers/webhook.ts:165`) keeps `stripeCustomerId`, `stripeSubscriptionId`, `membershipStatus`, `membershipPlanName`, `membershipCurrentPeriodEnd`, and `activeMembership` up to date and toggles the appropriate Strapi role when a subscription changes state.
- **Strapi user schema** (`ruach-ministries-backend/src/extensions/users-permissions/content-types/user/schema.json:80`) already defines `stripeCustomerId`, `membershipStatus`, and other subscription fields that the webhook updates. Keep the schema in sync if you extend it with relations.
- **Recommended model** (separates partnership vs formation):
  ```
  User
  ├─ email
  ├─ stripeCustomerId
  ├─ roles
  ├─ memberships[]          (subscription-backed partnership)
  ├─ courseLicenses[]       (purchase-backed course access)
  ├─ donations[]            (optional: normalized gifts ledger)

  Membership
  ├─ tier
  ├─ status
  ├─ startedAt
  ├─ expiresAt
  ├─ stripeSubscriptionId
  ├─ stripePriceId

  CourseLicense
  ├─ courseId
  ├─ grantedAt
  ├─ source (purchase | comp | promo)
  ├─ stripeCheckoutSessionId?
  ├─ stripePaymentIntentId?
  ├─ accessEndsAt?           (optional: cohort/term-based)

  Donation
  ├─ amount
  ├─ currency
  ├─ createdAt
  ├─ recurring?              (optional)
  ├─ stripeCheckoutSessionId?
  ├─ campaign?
  ```
  Implement these as related content types (or repeatable components) in Strapi so you can grant/lock access deterministically from Stripe events.
- **Access control rules**
  - **Membership access** → role/entitlement-based (driven by subscription state).
  - **Course access** → license-based (driven by successful one-time purchase, or explicit comp/promo grants).
  - Avoid tying course access directly to membership roles; prefer member **discounts** and **early access** instead.
- **Access gating**: `apps/ruach-next/src/lib/require-membership.ts` can continue to guard member-only features. Add a separate `requireCourseLicense(courseSlug)` guard for course libraries once `courseLicenses[]` exists.

## 4. Messaging & best practices

1. **Donations first** — rely on `/give` and `DonationForm` so the landing page is the canonical giving experience. Keep the membership section nearby so people can toggle between one-time gifts and subscriptions.
2. **Remind donors to match** — mention “Ask your employer to match this donation” on the `/give` page without third-party scripts.
3. **No Givebutter** — Stripe covers payment intents, subscriptions, and course purchases, so remove Givebutter/Double the Donation dependencies from assets and docs. Use `EmbedScript` only for authorized Stripe widgets.
4. **Memberships vs courses**
   - Membership communicates: “I’m helping hold the rope.” (partnership + community benefits)
   - Courses communicate: “I’m committing to go through this.” (formation product + durable value)
   - Membership can bless courses via discounts/early access, but don’t make “all courses included” the default.
5. **Courses** — treat each course as a Stripe **one-time product/price**, grant access via Stripe events, and store entitlements under `courseLicenses` (not membership roles).
5. **Monitor webhooks** — Stripe is the source of truth. Reconcile failed events through the webhook logs and ensure Strapi reflects the same membership/monthly status in every environment.

## 5. Membership sync endpoints & banners

Two new Strapi-driven endpoints keep your membership state deterministic:

1. `POST /api/stripe/sync-latest` — hit this after a donation or checkout success (`?checkout=success` on `/members/account`) to pull the most recent subscription, update `membershipTier`, `accessLevel`, status fields, and role, then return the refreshed subscription id.
2. `POST /api/stripe/sync-customer` — call this when the Stripe Customer Portal redirects back with `?billing=updated`. It re-runs the same sync logic so billing changes, card updates, and cancellations immediately reflect in Strapi.

Both routes require an authenticated Strapi session (Next.js calls them from the server using the JWT your login flow already exposes). They use the same `stripe-sync` service as the webhook so you never drift.

On the Next.js side:
* `/members/account` reads `searchParams.checkout` / `billing`, hits the matching sync endpoint before fetching dashboard data, and renders a thank-you or billing-confirmation banner so donors see the freshest membership state rather than waiting on asynchronous webhooks.
* `/give` shows a gentle “Donation paused” banner when `searchParams.checkout === "cancelled"`, confirms no charge occurred, and offers quick links to retry or contact support.

These additions keep Stripe as the payment authority, Strapi as the access authority, and your donors confident after every redirect.

## 6. Membership upgrades & downgrade API

Keep one canonical price map in `apps/ruach-next/src/lib/membership-prices.ts` so only the backend knows every `price_*` identifier and its rank, tier label, and access level. The new `POST /api/stripe/change-membership` route (`apps/ruach-next/src/app/api/stripe/change-membership/route.ts`) uses that map, the authenticated Strapi membership, and Stripe’s `subscriptions.update` API so upgrades fire prorations, downgrades wait until the next billing cycle, and the call never creates a second subscription.

Once the request succeeds, the route calls the sync helper (`apps/ruach-next/src/lib/stripe-sync.ts`), which reuses the webhook logic via the Strapi endpoints so `membershipTier`, `accessLevel`, and `membershipStatus` are refreshed wholesale before the page renders. Front-end buttons can now just POST `{ tier: "partner" }` without touching price IDs or Stripe secrets.

## 7. Member dashboard UI

The `/members/account` page now reflects the member-focused layout: the `MembershipStatusCard` surfaces the tier name, status badge, and next billing date, `MembershipActions` renders upgrade/downgrade buttons that POST to `/api/stripe/change-membership`, and the `AccessSummary` checks each `ACCESS_FEATURES` bullet so donors see exactly what resources are unlocked. Status banners above the card respond to `?checkout=success`, `?billing=updated`, past-due payments, or canceled memberships, and the `StripeSubscriptionButtons` component remains the gateway to Stripe Checkout or the Customer Portal.

This UI never decides access—it mirrors the Strapi truth and lets Stripe handle the billing math while the backend syncs the final state back to the dashboard via `/api/stripe/sync-latest` or `/api/stripe/sync-customer`.

## 8. Next steps

* Design the Stripe pricing/products for each membership and course (one-time product, monthly subscription, etc.).
* Expand the webhook or add background jobs to write new membership/course access records whenever Stripe signals a successful payment or subscription update.
* Communicate the Stripe-first flow in UI copy (e.g., `/faq/page.tsx`, marketing pages, and CTA sections) so donors know exactly where to go and what to expect.
