import { redirect } from "next/navigation";
import Link from "next/link";
import { getUser } from "@/lib/strapi-user";
import ImpactMetrics from "@/components/partners/ImpactMetrics";
import DonationHistory from "@/components/partners/DonationHistory";

export const metadata = {
  title: "Partner Impact Dashboard | Ruach Ministries",
  description: "View your partnership impact, donation history, and exclusive partner benefits.",
};

export const dynamic = "force-dynamic";

export default async function ImpactDashboardPage() {
  // Check authentication
  const user = await getUser();

  if (!user) {
    redirect("/login?redirect=/members/impact");
  }

  // TODO: Fetch real partner data from Stripe/Strapi
  // For now, using mock data for demonstration
  const partnerTier = "Advocate"; // Could be: Friend, Advocate, Ambassador
  const memberSince = "January 2024";

  const impactMetrics = [
    {
      label: "Total Contributions",
      value: "$1,200",
      description: "Lifetime giving",
      trend: { value: 15, direction: "up" as const },
    },
    {
      label: "This Year",
      value: "$800",
      description: "2024 donations",
    },
    {
      label: "Lives Impacted",
      value: "2,400",
      description: "Est. people reached",
      trend: { value: 23, direction: "up" as const },
    },
    {
      label: "Content Funded",
      value: "8",
      description: "Videos & resources",
    },
  ];

  const donationHistory = [
    {
      id: "don_1",
      date: "2024-11-01",
      amount: 100,
      method: "Credit Card",
      status: "completed" as const,
      receiptUrl: "/api/receipts/don_1",
    },
    {
      id: "don_2",
      date: "2024-10-01",
      amount: 100,
      method: "Credit Card",
      status: "completed" as const,
      receiptUrl: "/api/receipts/don_2",
    },
    {
      id: "don_3",
      date: "2024-09-01",
      amount: 100,
      method: "Credit Card",
      status: "completed" as const,
      receiptUrl: "/api/receipts/don_3",
    },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="space-y-3">
        <span className="text-xs uppercase tracking-wide text-white/60">Partner Dashboard</span>
        <h1 className="text-3xl font-semibold text-white">Your Impact</h1>
        <p className="text-sm text-white/70">
          Track your partnership journey and see the eternal difference you're making.
        </p>
      </header>

      {/* Partner Status Card */}
      <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/5 p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌟</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{partnerTier} Partner</h2>
                <p className="text-sm text-white/70">Member since {memberSince}</p>
              </div>
            </div>
          </div>
          <Link
            href="/partners"
            className="rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
          >
            Upgrade Partnership
          </Link>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Your Impact Metrics</h2>
        <ImpactMetrics metrics={impactMetrics} />
      </section>

      {/* Donation History */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Donation History</h2>
          <Link
            href="/give"
            className="text-sm font-semibold text-amber-300 hover:text-amber-200"
          >
            Make a Donation →
          </Link>
        </div>
        <DonationHistory donations={donationHistory} />
      </section>

      {/* Partner Benefits */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Your Partner Benefits</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎥</span>
              <h3 className="text-lg font-semibold text-white">Exclusive Content</h3>
            </div>
            <p className="text-sm text-white/70">
              Access partner-only videos, behind-the-scenes content, and early releases.
            </p>
            <Link
              href="/members/downloads"
              className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              Browse Content →
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📅</span>
              <h3 className="text-lg font-semibold text-white">Quarterly Calls</h3>
            </div>
            <p className="text-sm text-white/70">
              Join video calls with leadership to hear updates and share feedback.
            </p>
            <a
              href="mailto:partners@joinruach.org"
              className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              Get Call Link →
            </a>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <h3 className="text-lg font-semibold text-white">Partner Gifts</h3>
            </div>
            <p className="text-sm text-white/70">
              Receive appreciation gifts and ministry resources throughout the year.
            </p>
            <Link
              href="/members/account"
              className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              Update Shipping Info →
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <h3 className="text-lg font-semibold text-white">Prayer Support</h3>
            </div>
            <p className="text-sm text-white/70">
              Submit prayer requests and receive intercession from our team.
            </p>
            <Link
              href="/contact"
              className="inline-block text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              Submit Request →
            </Link>
          </div>
        </div>
      </section>

      {/* Year-End Giving */}
      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
        <h3 className="text-xl font-semibold text-white">
          Tax Receipt for Year-End Giving
        </h3>
        <p className="text-sm text-white/70">
          Download your complete donation statement for tax purposes.
        </p>
        <button className="rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black transition hover:bg-amber-500">
          Download 2024 Tax Receipt
        </button>
      </section>
    </div>
  );
}
