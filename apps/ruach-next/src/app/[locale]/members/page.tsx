import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getViewerAccessContext } from "@/lib/access-context";
import { fetchStrapiMembership, isMembershipActive } from "@/lib/strapi-membership";
import { getEvents } from "@/lib/strapi";
import MembershipStatusCard from "@/components/members/MembershipStatusCard";
import ContinueWatchingSection from "@/components/members/ContinueWatchingSection";
import DailyScriptureWidget from "@/components/members/DailyScriptureWidget";
import UpcomingEventsSection from "@/components/members/UpcomingEventsSection";
import PageAtmosphere from "@/components/PageAtmosphere";

export const revalidate = 0;

export default async function MembersDashboard({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const { viewer, jwt } = await getViewerAccessContext();
  const jwtOrUndefined = jwt ?? undefined;

  // Redirect to login if not authenticated
  if (!viewer) {
    redirect(`/${locale}/login`);
  }

  // Fetch membership and events data
  const [membership, events] = await Promise.all([
    fetchStrapiMembership(jwtOrUndefined),
    getEvents(3),
  ]);

  const isActive = isMembershipActive(membership);

  return (
    <div className="space-y-8">
      <PageAtmosphere />

      {/* Header */}
      <section>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">
          Welcome back{membership?.username ? `, ${membership.username}` : ""}
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-white/70">
          Continue your journey of formation and encounter
        </p>
      </section>

      {/* Grid Layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Continue Watching */}
          <Suspense fallback={<ContinueWatchingSkeleton />}>
            <ContinueWatchingSection jwt={jwtOrUndefined} locale={locale} />
          </Suspense>

          {/* Upcoming Events */}
          {events && events.length > 0 && (
            <UpcomingEventsSection events={events} locale={locale} />
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Membership Status */}
          <MembershipStatusCard
            membership={membership}
            isActive={isActive}
            locale={locale}
          />

          {/* Daily Scripture */}
          <DailyScriptureWidget />
        </div>
      </div>
    </div>
  );
}

function ContinueWatchingSkeleton() {
  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-zinc-200 dark:bg-white/10" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[1, 2].map((i) => (
          <div key={i} className="aspect-video animate-pulse rounded-xl bg-zinc-200 dark:bg-white/10" />
        ))}
      </div>
    </section>
  );
}
