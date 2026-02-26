import { redirect } from "next/navigation";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import { getUser } from "@/lib/strapi-user";
import { auth } from "@/lib/auth";
import { getPartnerProfile, getPartnerMetrics, getDonationHistory } from "@/lib/partner-data";
import ImpactMetrics from "@/components/partners/ImpactMetrics";
import DonationHistory from "@/components/partners/DonationHistory";

export const metadata = {
  title: "Partner Impact Dashboard | Ruach Ministries",
  description: "View your partnership impact, donation history, and exclusive partner benefits.",
};

export const dynamic = "force-dynamic";

export default async function ImpactDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // Check authentication
  const user = await getUser();

  if (!user) {
    redirect(`/${locale}/login?redirect=/${locale}/members/impact`);
  }

  const session = await auth();
  const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
  const jwt = (session as { strapiJwt?: string } | null)?.strapiJwt;

  // Fetch real partner data from Stripe + Strapi
  const profile = jwt
    ? await getPartnerProfile(strapiUrl, jwt)
    : { tier: "Supporter", memberSince: null, stripeCustomerId: null };

  const partnerTier = profile.tier;
  const memberSince = profile.memberSince || "Recently joined";

  // Fetch Stripe metrics if customer ID exists
  let metrics = { lifetimeTotal: 0, thisYearTotal: 0, donationCount: 0, firstDonationDate: null as string | null };
  let donationHistory: { id: string; date: string; amount: number; method: string; status: "completed" | "pending" | "failed" | "refunded"; receiptUrl: string | null }[] = [];

  if (profile.stripeCustomerId) {
    try {
      [metrics, donationHistory] = await Promise.all([
        getPartnerMetrics(profile.stripeCustomerId),
        getDonationHistory(profile.stripeCustomerId, 10),
      ]);
    } catch (error) {
      console.warn("[Impact] Failed to fetch Stripe data:", error);
    }
  }

  const currentYear = new Date().getFullYear();
  const estimatedReach = Math.round(metrics.lifetimeTotal * 2);

  const impactMetrics = [
    {
      label: "Total Contributions",
      value: `$${metrics.lifetimeTotal.toLocaleString()}`,
      description: "Lifetime giving",
    },
    {
      label: "This Year",
      value: `$${metrics.thisYearTotal.toLocaleString()}`,
      description: `${currentYear} donations`,
    },
    {
      label: "Lives Impacted",
      value: estimatedReach > 0 ? estimatedReach.toLocaleString() : "—",
      description: "Est. people reached",
    },
    {
      label: "Donations",
      value: metrics.donationCount.toString(),
      description: "Total transactions",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">Partner Dashboard</span>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-white">Your Impact</h1>
        <p className="text-sm text-zinc-600 dark:text-white/70">
          Track your partnership journey and see the eternal difference you&apos;re making.
        </p>
      </header>

      {/* Partner Status Card */}
      <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/5 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌟</span>
              <div>
                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">{partnerTier} Partner</h2>
                <p className="text-sm text-zinc-600 dark:text-white/70">Member since {memberSince}</p>
              </div>
            </div>
          </div>
          <LocalizedLink href="/partners">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-6 py-2 text-sm font-semibold text-zinc-900 dark:text-white transition hover:border-white hover:bg-white dark:hover:bg-white/10">
              Upgrade Partnership
            </span>
          </LocalizedLink>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Your Impact Metrics</h2>
        <ImpactMetrics metrics={impactMetrics} />
      </section>

      {/* Donation History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Donation History</h2>
          <LocalizedLink href="/give">
            <span className="text-sm font-semibold text-amber-300 hover:text-amber-200">
              Make a Donation →
            </span>
          </LocalizedLink>
        </div>
        <DonationHistory donations={donationHistory} />
      </section>

      {/* Partner Benefits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Your Partner Benefits</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎥</span>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Exclusive Content</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-white/70">
              Access partner-only videos, behind-the-scenes content, and early releases.
            </p>
            <LocalizedLink href="/members/downloads">
              <span className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200">
                Browse Content →
              </span>
            </LocalizedLink>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Quarterly Calls</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-white/70">
              Join video calls with leadership to hear updates and share feedback.
            </p>
            <a
              href="mailto:partners@joinruach.org"
              className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              Get Call Link →
            </a>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Partner Gifts</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-white/70">
              Receive appreciation gifts and ministry resources throughout the year.
            </p>
            <LocalizedLink href="/members/account">
              <span className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200">
                Update Shipping Info →
              </span>
            </LocalizedLink>
          </div>

          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Prayer Support</h3>
            </div>
            <p className="text-sm text-zinc-600 dark:text-white/70">
              Submit prayer requests and receive intercession from our team.
            </p>
            <LocalizedLink href="/contact">
              <span className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200">
                Submit Request →
              </span>
            </LocalizedLink>
          </div>
        </div>
      </section>

      {/* Year-End Giving */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-center space-y-4">
        <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
          Tax Receipt for Year-End Giving
        </h3>
        <p className="text-sm text-zinc-600 dark:text-white/70">
          Download your complete donation statement for tax purposes.
        </p>
        <button
          className="rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black transition hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!profile.stripeCustomerId}
        >
          Download {currentYear} Tax Receipt
        </button>
      </section>
    </div>
  );
}
