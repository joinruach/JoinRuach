import Image from "next/image";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { auth } from "@/lib/auth";
import type { Session } from "next-auth";
import { redirect } from "next/navigation";
import { imgUrl } from "@/lib/strapi";
import { getCourseProgressMap } from "@/lib/api/courseProgress";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ruach/ui/Button";
import StripeSubscriptionButtons from "@/components/ruach/StripeSubscriptionButtons";
import MembershipActions from "@/components/ruach/MembershipActions";
import { isMembershipActive } from "@/lib/strapi-membership";
import {
  ACCESS_FEATURES,
  TIER_LABELS,
  detectTierFromName,
  TIER_SEQUENCE,
  type MembershipTier,
} from "@/lib/memberships";
import { postStripeSync } from "@/lib/stripe-sync";

export const dynamic = "force-dynamic";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

type StrapiUserProfile = {
  id: number;
  fullName?: string | null;
  location?: string | null;
  role?: string | null;
  bio?: any;
  profilePicture?: any;
};

type StrapiUserMe = {
  id: number;
  username: string;
  email: string;
  confirmed: boolean;
  user_profile?: StrapiUserProfile | null;
  membershipStatus?: string | null;
  membershipPlanName?: string | null;
  membershipCurrentPeriodEnd?: string | null;
  activeMembership?: boolean;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  membershipTier?: MembershipTier | null;
  accessLevel?: string | null;
};

type LessonProgressEntry = {
  id: number;
  courseSlug: string;
  lessonSlug: string;
  completed: boolean;
  secondsWatched: number;
  updatedAt: string;
  createdAt: string;
};

type CourseLesson = {
  slug: string;
  title: string;
  order: number | null;
};

type CourseDetail = {
  slug: string;
  title: string;
  coverUrl?: string;
  lessons: CourseLesson[];
};

type StrapiSession = Session & {
  strapiJwt?: string | null;
};

function normalizeTier(value?: string | null): MembershipTier | null {
  if (!value) return null;
  const normalized = value.toLowerCase();
  return TIER_SEQUENCE.includes(normalized as MembershipTier)
    ? (normalized as MembershipTier)
    : null;
}

async function fetchStrapiPrivate<T>(path: string, jwt: string): Promise<T> {
  const res = await fetch(`${STRAPI}${path}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unable to read error response");
    console.error(`[Account Page] Strapi request failed:`, {
      status: res.status,
      statusText: res.statusText,
      path,
      error: errorText,
    });
    throw new Error(`Strapi request failed (${res.status}) for ${path}: ${errorText}`);
  }

  return (await res.json()) as T;
}

async function fetchUser(jwt: string): Promise<StrapiUserMe> {
  const params = new URLSearchParams({
    "populate[user_profile][populate][profilePicture][fields][0]": "url",
    "populate[user_profile][fields][0]": "fullName",
    "populate[user_profile][fields][1]": "location",
    "populate[user_profile][fields][2]": "role",
    "populate[user_profile][fields][3]": "bio",
  });

  params.set("fields[0]", "username");
  params.set("fields[1]", "email");
  params.set("fields[2]", "membershipStatus");
  params.set("fields[3]", "membershipPlanName");
  params.set("fields[4]", "membershipCurrentPeriodEnd");
  params.set("fields[5]", "activeMembership");

  return await fetchStrapiPrivate<StrapiUserMe>(`/api/users/me?${params.toString()}`, jwt);
}

const LESSON_PROGRESS_PAGE_SIZE = 50; // Matches Strapi's `rest.maxLimit` so we avoid 400 responses.
const LESSON_PROGRESS_SORT = "updatedAt:desc";

type LessonProgressResponse = {
  data?: any[];
  meta?: {
    pagination?: {
      page?: number;
      pageCount?: number;
    };
  };
};

function normalizeLessonProgressRecords(rawEntries: any[]): LessonProgressEntry[] {
  return rawEntries
    .map((entry) => ({
      id: entry?.id,
      courseSlug: entry?.attributes?.courseSlug ?? "",
      lessonSlug: entry?.attributes?.lessonSlug ?? "",
      completed: Boolean(entry?.attributes?.completed),
      secondsWatched: Number(entry?.attributes?.secondsWatched ?? 0),
      updatedAt: entry?.attributes?.updatedAt ?? entry?.attributes?.createdAt ?? null,
      createdAt: entry?.attributes?.createdAt ?? null,
    }))
    .filter((entry) => entry.courseSlug && entry.lessonSlug && entry.updatedAt) as LessonProgressEntry[];
}

async function fetchLessonProgress(jwt: string): Promise<LessonProgressEntry[]> {
  const collectedEntries: any[] = [];
  let currentPage = 1;

  try {
    while (true) {
      const params = new URLSearchParams({
        "pagination[pageSize]": String(LESSON_PROGRESS_PAGE_SIZE),
        "pagination[page]": String(currentPage),
        "sort[0]": LESSON_PROGRESS_SORT,
      });

      const response = await fetchStrapiPrivate<LessonProgressResponse>(
        `/api/lesson-progresses?${params.toString()}`,
        jwt
      );

      const pageData = response.data ?? [];
      collectedEntries.push(...pageData);

      const pagination = response.meta?.pagination;
      if (!pagination) {
        break;
      }

      const pageNumber = pagination.page ?? currentPage;
      const totalPages = pagination.pageCount ?? pageNumber;
      if (pageNumber >= totalPages) {
        break;
      }

      currentPage = pageNumber + 1;
    }

    return normalizeLessonProgressRecords(collectedEntries);
  } catch (error) {
    console.error("[Account Page] Failed to fetch lesson progress:", error);
    return [];
  }
}

async function fetchCourseDetail(slug: string): Promise<CourseDetail | null> {
  const params = new URLSearchParams();
  params.set("filters[slug][$eq]", slug);
  params.set("fields[0]", "title");
  params.set("fields[1]", "slug");
  params.set("populate[cover][fields][0]", "url");
  params.set("populate[cover][fields][1]", "alternativeText");
  params.set("populate[lessons][fields][0]", "slug");
  params.set("populate[lessons][fields][1]", "title");
  params.set("populate[lessons][fields][2]", "order");
  params.set("pagination[pageSize]", "1");

  const res = await fetch(`${STRAPI}/api/courses?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return null;

  const json = (await res.json()) as { data?: any[] };
  const row = json?.data?.[0];
  if (!row) return null;

  const attributes = row.attributes ?? {};
  type LessonRelationEntry = {
    attributes?: {
      slug?: string;
      title?: string;
      order?: number | string | null;
    } | null;
  };

  const lessonsData: LessonRelationEntry[] = Array.isArray(attributes.lessons?.data)
    ? attributes.lessons.data
    : [];

  const lessons: CourseLesson[] = lessonsData.map((item) => {
    const rawOrder = item?.attributes?.order;
    let order: number | null = null;

    if (typeof rawOrder === "number") {
      order = rawOrder;
    } else if (rawOrder !== null && rawOrder !== undefined) {
      const parsed = Number(rawOrder);
      order = Number.isFinite(parsed) ? parsed : null;
    }

    return {
      slug: item?.attributes?.slug ?? "",
      title: item?.attributes?.title ?? item?.attributes?.slug ?? "Lesson",
      order,
    };
  });

  lessons.sort((a: CourseLesson, b: CourseLesson) => {
    if (a.order == null && b.order == null) return a.slug.localeCompare(b.slug);
    if (a.order == null) return 1;
    if (b.order == null) return -1;
    return a.order - b.order;
  });

  const coverUrl = attributes.cover?.data?.attributes?.url ?? attributes.cover?.url ?? undefined;

  return {
    slug,
    title: attributes.title ?? slug,
    coverUrl: coverUrl ? imgUrl(coverUrl) : undefined,
    lessons,
  };
}

function resolveProfileImage(media: any): string | undefined {
  if (!media) return undefined;
  if (typeof media === "string") return imgUrl(media);
  if (media.url) return imgUrl(media.url);
  const data = media.data;
  if (Array.isArray(data) && data[0]?.attributes?.url) return imgUrl(data[0].attributes.url);
  if (data?.attributes?.url) return imgUrl(data.attributes.url);
  return undefined;
}

function extractBioText(bio: unknown): string | null {
  if (!Array.isArray(bio)) return null;
  const lines: string[] = [];
  for (const block of bio) {
    if (!block || typeof block !== "object") continue;
    if ((block as { type?: unknown }).type === "paragraph" && Array.isArray((block as { children?: unknown }).children)) {
      const text = ((block as { children: unknown[] }).children).map((child) => (child as { text?: unknown })?.text ?? "").join("");
      if (text.trim()) lines.push(text.trim());
    }
  }
  return lines.length ? lines.join(" ") : null;
}

function formatRelativeRole(role?: string | null): string | null {
  if (!role) return null;
  return role.replace(/_/g, " ");
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

type CourseProgressSummary = {
  slug: string;
  title: string;
  percent: number;
  completedLessons: number;
  totalLessons: number;
  coverUrl?: string;
  lastUpdated: string;
  nextLessonSlug?: string;
  nextLessonTitle?: string;
  finished: boolean;
};

function formatMembershipStatus(status?: string | null, hasActiveMembership?: boolean): string {
  if (!status) {
    return hasActiveMembership ? "Active" : "Not active";
  }
  return status
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function membershipStatusBadgeClasses(status?: string | null): string {
  switch (status) {
    case "active":
    case "trialing":
      return "border-emerald-400/60 bg-emerald-500/10 text-emerald-100";
    case "past_due":
      return "border-amber-400/60 bg-amber-500/10 text-amber-100";
    case "paused":
      return "border-sky-400/60 bg-sky-500/10 text-sky-100";
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    default:
      return "border-zinc-300/70 dark:border-white/25 bg-white dark:bg-white/5 text-zinc-600 dark:text-white/70";
  }
}

type MembershipStatusCardProps = {
  tierLabel: string;
  statusLabel: string;
  nextChargeLabel: string;
  isPastDue: boolean;
  isCanceled: boolean;
  showEmailConfirmationNote: boolean;
  primaryCtaLabel: string;
  inactiveNote?: string | null;
};

function MembershipStatusCard({
  tierLabel,
  statusLabel,
  nextChargeLabel,
  isPastDue,
  isCanceled,
  showEmailConfirmationNote,
  primaryCtaLabel,
  inactiveNote,
}: MembershipStatusCardProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">
        Membership Overview
      </p>
      <h2 className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">{tierLabel} Member</h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
        You&rsquo;re helping fund testimonies, discipleship, and real-world outreach&mdash;every month.
      </p>
      <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
        Your membership unlocks the Ruach library and strengthens the work behind it&mdash;courses, livestreams, and the
        stories God is writing through His people.
      </p>
      <div className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-white/70">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Status</span>
          <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-700 dark:border-white/20 dark:text-white/80">
            {statusLabel}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Next gift</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-white">{nextChargeLabel}</span>
        </div>
        {inactiveNote ? (
          <p className="rounded-2xl border border-zinc-200 bg-zinc-50 p-2 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            {inactiveNote}
          </p>
        ) : null}
        {showEmailConfirmationNote ? (
          <p className="rounded-2xl border border-zinc-200 bg-white/70 p-2 text-xs text-zinc-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
            Confirm your email to secure your account and keep access uninterrupted.
          </p>
        ) : null}
      </div>
      {isPastDue ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900">
          Payment issue&mdash;update billing to keep access active.
        </p>
      ) : isCanceled ? (
        <p className="mt-4 rounded-2xl border border-zinc-200 bg-white/70 p-3 text-xs font-semibold text-zinc-700">
          Membership paused&mdash;start a plan again anytime.
        </p>
      ) : null}
      <Button as="a" href="#billing-subscription" variant="gold" className="mt-5 w-full justify-center">
        {primaryCtaLabel}
      </Button>
    </div>
  );
}

type AccessSummaryProps = {
  features: { label: string; hasAccess: boolean }[];
  hasActiveMembership: boolean;
};

function AccessSummary({ features, hasActiveMembership }: AccessSummaryProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/5">
      <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Your Access</p>
      <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Unlocked today</h3>
      <p className="mt-1 text-sm text-zinc-600 dark:text-white/70">
        Your dashboard shows what&rsquo;s unlocked right now based on your membership level.
      </p>
      <ul className="mt-4 space-y-3 text-sm text-zinc-600 dark:text-white/70">
        {features.map((feature) => (
          <li key={feature.label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-5 w-5 items-center justify-center rounded-full text-xs font-semibold",
                feature.hasAccess && hasActiveMembership
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "bg-zinc-100 text-zinc-400 dark:bg-white/10 dark:text-zinc-500"
              )}
            >
              {feature.hasAccess && hasActiveMembership ? "✓" : "—"}
            </span>
            <span>{feature.label}</span>
          </li>
        ))}
      </ul>
      {!hasActiveMembership ? (
        <>
          <p className="mt-4 text-xs text-zinc-500 dark:text-white/70">
            Activate your membership to unlock the full library&mdash;and help keep this mission moving.
          </p>
          <Button as="a" href="#billing-subscription" variant="gold" className="mt-4 w-full justify-center">
            Unlock Full Access
          </Button>
        </>
      ) : null}
    </div>
  );
}

export default async function AccountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ checkout?: string; billing?: string }>;
}) {
  try {
    const resolvedSearchParams = (await searchParams) ?? {};
    return await renderAccountPage(params, resolvedSearchParams);
  } catch (error) {
    console.error("[MEMBER DASHBOARD RENDER ERROR]", error);
    return null;
  }
}

async function renderAccountPage(
  params: Promise<{ locale: string }>,
  searchParams: { checkout?: string; billing?: string } = {}
) {
  const { locale } = await params;
  const session = (await auth()) as StrapiSession | null;
  const jwt = session?.strapiJwt ?? undefined;

  if (process.env.NODE_ENV === "development") {
    console.debug("[Account Page] Session", session ? "present" : "missing");
    console.debug("[Account Page] JWT", jwt ? "present" : "missing");
  }

  if (!jwt) {
    redirect(
      `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/members/account`)}`
    );
  }

  const queryCheckout = searchParams?.checkout ?? null;
  const queryBilling = searchParams?.billing ?? null;

  const shouldShowCheckoutBanner = queryCheckout === "success";
  const shouldShowBillingBanner = queryBilling === "updated";

  let user: StrapiUserMe;
  let progressEntries: LessonProgressEntry[];

  try {
    if (shouldShowCheckoutBanner) {
      await postStripeSync(jwt, "sync-latest");
    }
    if (shouldShowBillingBanner) {
      await postStripeSync(jwt, "sync-customer");
    }

    [user, progressEntries] = await Promise.all([
      fetchUser(jwt),
      fetchLessonProgress(jwt),
    ]);
  } catch (error) {
    console.error("[Account Page] Critical error fetching user data:", error);
    // If we can't fetch the user, try to fetch just the user without progress
    try {
      user = await fetchUser(jwt);
      progressEntries = [];
      console.log("[Account Page] Successfully fetched user data, but lesson progress unavailable");
    } catch (userError) {
      console.error("[Account Page] Failed to fetch user data, redirecting to login:", userError);
      // If even the user fetch fails, the session might be invalid
      redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/members/account`)}&error=session_expired`);
    }
  }

  const userProfile = user.user_profile ?? undefined;
  const displayName = userProfile?.fullName || session?.user?.name || user.username || user.email;
  const avatarUrl = resolveProfileImage(userProfile?.profilePicture);
  const bioText = extractBioText(userProfile?.bio);
  const roleLabel = formatRelativeRole(userProfile?.role);
  const rawMembershipStatus = user.membershipStatus ?? null;
  const hasActiveMembership = isMembershipActive(user);
  const membershipNextChargeIso = user.membershipCurrentPeriodEnd ?? null;
  const membershipNextCharge = membershipNextChargeIso ? formatDateTime(membershipNextChargeIso) : null;

  const isIncomplete =
    rawMembershipStatus === "incomplete" || rawMembershipStatus === "incomplete_expired";
  const isPastDue = rawMembershipStatus === "past_due";
  const isCanceled = rawMembershipStatus === "canceled" || rawMembershipStatus === "unpaid";
  const isPaused = rawMembershipStatus === "paused" || isPastDue;

  const membershipStatusLabel = (() => {
    if (isIncomplete) return "Incomplete — almost there";
    if (hasActiveMembership) return "Active — thank you for standing with Ruach";
    if (isPaused) return "Paused — access limited";
    if (isCanceled) {
      return membershipNextCharge
        ? `Canceled — access ending ${membershipNextCharge}`
        : "Canceled — access ending soon";
    }
    return formatMembershipStatus(rawMembershipStatus, hasActiveMembership);
  })();
  const membershipBadgeClass = membershipStatusBadgeClasses(rawMembershipStatus);
  const membershipPlanName = user.membershipPlanName ?? null;
  const membershipNextChargeLabel = (() => {
    if (!membershipNextCharge) {
      return hasActiveMembership ? "Pending" : "Not scheduled";
    }
    return hasActiveMembership ? `Renews on ${membershipNextCharge}` : membershipNextCharge;
  })();
  const showManageMembershipButton = Boolean(user.stripeCustomerId || hasActiveMembership);
  const membershipSupportMessage = "Need help linking a legacy membership or updating billing details?";

  const membershipTierKey: MembershipTier | null =
    normalizeTier(user.membershipTier ?? null) ??
    detectTierFromName(membershipPlanName);
	  const membershipTierLabel =
	    membershipTierKey
	      ? TIER_LABELS[membershipTierKey]
	      : membershipPlanName ?? "Partner member";
	  const primaryCtaLabel = (() => {
	    if (isIncomplete) return "Activate Membership";
	    if (isPaused) return "Resume Membership";
	    if (hasActiveMembership) return "Manage Membership";
	    return "Start Monthly Partnership";
	  })();
	  const inactiveNote = isIncomplete
	    ? "Finish setup to unlock your full access and activate monthly giving."
	    : !hasActiveMembership
	      ? "Start monthly partnership to unlock your full access and activate monthly giving."
	      : null;
	  const featureItems = ACCESS_FEATURES.map((feature) => ({
	    label: feature.label,
	    hasAccess:
	      hasActiveMembership &&
      membershipTierKey !== null &&
      feature.tiers.includes(membershipTierKey),
  }));

  const courseSlugs = Array.from(new Set(progressEntries.map((entry) => entry.courseSlug))).filter(Boolean);
  const courseDetailsList = await Promise.all(courseSlugs.map((slug) => fetchCourseDetail(slug)));
  const courseDetailsMap = new Map<string, CourseDetail>();
  courseDetailsList
    .filter((detail): detail is CourseDetail => Boolean(detail))
    .forEach((detail) => courseDetailsMap.set(detail.slug, detail));
  const courseProgressMap = await getCourseProgressMap(courseSlugs, jwt);

  const progressByCourse = new Map<string, LessonProgressEntry[]>();
  for (const entry of progressEntries) {
    const existing = progressByCourse.get(entry.courseSlug) ?? [];
    existing.push(entry);
    progressByCourse.set(entry.courseSlug, existing);
  }

  const courseSummaries: CourseProgressSummary[] = Array.from(progressByCourse.entries()).map(
    ([courseSlug, entries]) => {
      const detail = courseDetailsMap.get(courseSlug) ?? null;
      const progressInfo = courseProgressMap.get(courseSlug);
      const totalLessons = progressInfo?.totalLessons ?? detail?.lessons.length ?? entries.length;
      const completedLessons =
        progressInfo?.completedLessons ?? entries.filter((entry) => entry.completed).length;
      const percent =
        progressInfo?.percentComplete ??
        (totalLessons > 0 ? Math.min(100, Math.round((completedLessons / totalLessons) * 100)) : 0);
      const lastUpdated = entries.reduce(
        (latest, entry) => (new Date(entry.updatedAt) > new Date(latest) ? entry.updatedAt : latest),
        entries[0]?.updatedAt ?? new Date().toISOString()
      );

      const completedLessonSlugs = new Set(entries.filter((entry) => entry.completed).map((entry) => entry.lessonSlug));
      const nextLesson =
        detail?.lessons.find((lesson) => !completedLessonSlugs.has(lesson.slug)) ?? detail?.lessons[0] ?? undefined;

      return {
        slug: courseSlug,
        title: detail?.title ?? courseSlug,
        percent,
        completedLessons,
        totalLessons,
        coverUrl: detail?.coverUrl,
        lastUpdated,
        nextLessonSlug: nextLesson?.slug,
        nextLessonTitle: nextLesson?.title,
        finished: percent === 100 && totalLessons > 0,
      };
    }
  );

  courseSummaries.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

  const latestActivities = progressEntries.slice(0, 8).map((entry) => {
    const detail = courseDetailsMap.get(entry.courseSlug);
    const lessonTitle =
      detail?.lessons.find((lesson) => lesson.slug === entry.lessonSlug)?.title ?? entry.lessonSlug;
    const courseTitle = detail?.title ?? entry.courseSlug;
    return {
      id: entry.id,
      courseTitle,
      lessonTitle,
      completed: entry.completed,
      updatedAt: entry.updatedAt,
    };
  });

  return (
    <div className="space-y-10">
      {shouldShowCheckoutBanner ? (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-900 shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-600">Giving update</p>
          <h2 className="mt-3 text-2xl font-semibold text-emerald-900">Thank you for your generosity.</h2>
          <p className="mt-2 text-sm text-emerald-900/80">
            Your donation was successfully processed. A receipt has been emailed to you and you can manage your giving anytime from this page.
          </p>
          <p className="mt-3 text-sm font-semibold text-emerald-900">
            {hasActiveMembership ? "You're now a monthly partner." : "We value your faithful support."}
          </p>
        </section>
      ) : shouldShowBillingBanner ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <p className="text-sm uppercase tracking-[0.35em] text-amber-600">Billing update</p>
          <h2 className="mt-3 text-2xl font-semibold text-amber-900">Billing information updated.</h2>
          <p className="mt-2 text-sm text-amber-900/80">
            We refreshed your subscription state and membership tier. Changes may take a few moments to appear everywhere.
          </p>
        </section>
      ) : null}
      <header className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white shadow-lg">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-zinc-300 dark:border-white/20 bg-white dark:bg-white/10">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="80px" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-semibold">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-zinc-500 dark:text-white/60">Member Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">Welcome back, {displayName}</h1>
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{user.email}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                {roleLabel ? <span className="rounded-full border border-zinc-200/70 dark:border-white/15 px-3 py-1">{roleLabel}</span> : null}
                {userProfile?.location ? (
                  <span className="rounded-full border border-zinc-200/70 dark:border-white/15 px-3 py-1">{userProfile.location}</span>
                ) : null}
                {user.confirmed ? (
                  <span className="rounded-full border border-emerald-400/60 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                    Email confirmed
                  </span>
                ) : (
                  <span className="rounded-full border border-amber-400/60 bg-amber-500/10 px-3 py-1 text-amber-100">
                    Email pending confirmation
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            {bioText ? <p className="max-w-md text-sm text-zinc-600 dark:text-white/70">{bioText}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button as="a" href="/logout" variant="white">
                Sign out
              </Button>
              <Button as="a" href="/contact" variant="gold">
                Contact support
              </Button>
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-6 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white shadow-sm">
        {isPastDue ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-amber-800">Payment issue</h3>
            <p className="text-sm text-amber-900/80">
              We detected a past–due payment. Update your billing details to keep your access active and avoid interruptions.
            </p>
          </div>
        ) : null}
        {isCanceled ? (
          <div className="rounded-2xl border border-zinc-200 bg-white/70 p-4 text-zinc-900">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-600">Membership paused</h3>
            <p className="text-sm text-zinc-700">
              Your membership is canceled, but you can rejoin anytime by starting a new tier below.
            </p>
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
          <MembershipStatusCard
            tierLabel={membershipTierLabel}
            statusLabel={membershipStatusLabel}
            nextChargeLabel={membershipNextChargeLabel}
            isPastDue={isPastDue}
            isCanceled={isCanceled}
            showEmailConfirmationNote={!user.confirmed}
            primaryCtaLabel={primaryCtaLabel}
            inactiveNote={inactiveNote}
          />
          <AccessSummary features={featureItems} hasActiveMembership={hasActiveMembership} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <MembershipActions
            currentTier={membershipTierKey}
            membershipStatus={rawMembershipStatus}
            hasActiveMembership={hasActiveMembership}
	          />
	          <div
	            id="billing-subscription"
	            className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-white/5"
	          >
	            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">
	              {hasActiveMembership ? "Billing & Subscription" : "Start Monthly Giving"}
	            </h3>
	            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
	              {hasActiveMembership
	                ? "Update your card, view invoices, cancel, or resume through our secure billing portal."
	                : "Join the people building Kingdom infrastructure—testimony media, discipleship courses, outreach tools, and practical support for families."}
	            </p>
	            <div className="mt-4">
	              <StripeSubscriptionButtons
	                className="space-y-3"
	                orientation="column"
	                showCheckout={!hasActiveMembership && !isPaused}
	                showManage={showManageMembershipButton}
	                checkoutLabel={isIncomplete ? "Activate Membership" : "Become a Monthly Partner"}
	                manageLabel={isPaused ? "Resume Membership" : "Open Billing Portal"}
	                manageVariant="white"
	                size="md"
	              />
	            </div>
	            <p className="mt-3 text-xs text-zinc-500 dark:text-white/60">
	              Powered by Stripe&mdash;your payment details stay protected. {membershipSupportMessage}{" "}
	              <LocalizedLink href="/contact">
	                <span className="text-amber-300 hover:text-amber-200">Contact support</span>
	              </LocalizedLink>
	              &mdash;we&rsquo;ll take care of it.
	            </p>
	          </div>
	        </div>
	      </section>

	      <section className="space-y-3 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
	        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Give Anytime</h2>
	        <p className="text-sm text-zinc-600 dark:text-white/70">
	          Make a one-time gift to accelerate testimonies, discipleship, and outreach&mdash;right when it&rsquo;s needed
	          most.
	        </p>
	        <div className="flex flex-col gap-3 sm:flex-row">
	          <Button as="a" href="/give#donate" variant="gold" className="w-full justify-center">
	            Give a One-Time Gift
	          </Button>
	          <Button as="a" href="/give" variant="white" className="w-full justify-center">
	            View Giving Options
	          </Button>
	        </div>
	      </section>

      <section className="space-y-3 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Next steps</h2>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-white/70">
          <li>
            <LocalizedLink href="/courses">
              <span className="text-amber-300 hover:text-amber-200">Explore discipleship courses →</span>
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink href="/media">
              <span className="text-amber-300 hover:text-amber-200">Watch the latest testimonies →</span>
            </LocalizedLink>
          </li>
          <li>
            <LocalizedLink href="/community-outreach">
              <span className="text-amber-300 hover:text-amber-200">Join a local outreach →</span>
            </LocalizedLink>
          </li>
        </ul>
        <p className="text-xs text-zinc-500 dark:text-white/60">
          Questions? Email{" "}
          <a className="text-amber-300 hover:text-amber-200" href="mailto:hello@joinruach.org">
            hello@joinruach.org
          </a>
          .
        </p>
      </section>

      <section className="space-y-4 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Learning journey</h2>
            <p className="text-sm text-zinc-600 dark:text-white/70">
              Track your course progress, pick up where you left off, and download completion certificates.
            </p>
          </div>
          <Button as="a" href="/courses" variant="white">
            Browse all courses
          </Button>
        </div>

        {courseSummaries.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200/70 dark:border-white/15 bg-white dark:bg-white/5 p-6 text-center text-sm text-zinc-600 dark:text-white/70">
            You haven&rsquo;t started a course yet. Choose a course to begin your discipleship journey.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {courseSummaries.map((course) => (
              <div
                key={course.slug}
                className="space-y-4 rounded-2xl border border-zinc-200/70 dark:border-white/15 bg-white dark:bg-white/5 p-6 shadow-inner transition hover:border-zinc-300/70 dark:hover:border-white/25"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{course.title}</h3>
                    <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                      {course.completedLessons} of {course.totalLessons} lessons complete
                    </p>
                  </div>
                  {course.coverUrl ? (
                    <div className="relative h-16 w-24 overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10">
                      <Image src={course.coverUrl} alt={`${course.title} cover`} fill className="object-cover" />
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white dark:bg-white/10">
                    <div
                      className={cn(
                        "h-full rounded-full bg-amber-400 transition-all",
                        course.finished ? "bg-emerald-400" : ""
                      )}
                      style={{ width: `${course.percent}%` }}
                    />
                  </div>
                  <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                    Last activity {formatDateTime(course.lastUpdated)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    as="a"
                    href={
                      course.nextLessonSlug
                        ? `/courses/${course.slug}/${course.nextLessonSlug}`
                        : `/courses/${course.slug}`
                    }
                    variant="gold"
                    className="flex-1 justify-center"
                  >
                    {course.finished ? "Review course" : "Continue course"}
                  </Button>
                  {course.finished ? (
                    <Button
                      as="a"
                      href={`/api/certificate/${course.slug}`}
                      variant="white"
                      className="flex-1 justify-center"
                    >
                      Download certificate
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Recent activity</h2>
            <p className="text-sm text-zinc-600 dark:text-white/70">Your most recent course sessions and lesson completions.</p>
          </div>
        </div>

        {latestActivities.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200/70 dark:border-white/15 bg-white dark:bg-white/5 p-6 text-sm text-zinc-600 dark:text-white/70">
            Start a course to see your activity timeline.
          </div>
        ) : (
          <div className="space-y-4">
            {latestActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex flex-col gap-1 rounded-2xl border border-zinc-200/70 dark:border-white/15 bg-white dark:bg-white/5 p-4 text-sm text-zinc-600 dark:text-white/70 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">{activity.courseTitle}</div>
                  <div className="text-zinc-600 dark:text-white/70">
                    Lesson: {activity.lessonTitle}{" "}
                    {activity.completed ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                        Completed
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center rounded-full bg-white dark:bg-white/10 px-2 py-0.5 text-xs font-semibold text-zinc-600 dark:text-white/70">
                        In progress
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">
                  {formatDateTime(activity.updatedAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );

}
