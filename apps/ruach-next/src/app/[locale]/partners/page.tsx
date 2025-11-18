import Link from "next-intl/link";
import PartnerTierCard from "@/components/partners/PartnerTierCard";

export const metadata = {
  title: "Become a Partner | Ruach Ministries",
  description: "Join us in advancing the Kingdom through monthly partnership. Support discipleship, outreach, and media ministry.",
};

const partnerTiers = [
  {
    name: "Friend",
    price: 25,
    interval: "month" as const,
    description: "Join the mission with foundational support",
    features: [
      "Monthly email updates",
      "Access to partner-exclusive content",
      "Prayer partnership",
      "Community forum access",
    ],
    ctaText: "Start at $25/month",
    ctaHref: "/give?tier=friend",
  },
  {
    name: "Advocate",
    price: 100,
    interval: "month" as const,
    description: "Amplify the impact with dedicated partnership",
    features: [
      "All Friend benefits",
      "Quarterly video calls with leadership",
      "Early access to new content",
      "Partner appreciation gifts",
      "Name in ministry credits",
    ],
    highlighted: true,
    ctaText: "Start at $100/month",
    ctaHref: "/give?tier=advocate",
  },
  {
    name: "Ambassador",
    price: 500,
    interval: "month" as const,
    description: "Champion the mission at the highest level",
    features: [
      "All Advocate benefits",
      "Monthly 1-on-1 calls with leadership",
      "Input on content and direction",
      "VIP access to events and conferences",
      "Personalized impact reports",
      "Legacy naming opportunities",
    ],
    ctaText: "Start at $500/month",
    ctaHref: "/give?tier=ambassador",
  },
];

const impactStats = [
  { value: "50K+", label: "Lives Reached" },
  { value: "200+", label: "Video Testimonies" },
  { value: "15+", label: "Outreach Campaigns" },
  { value: "1M+", label: "Content Views" },
];

export default async function PartnersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="space-y-6 text-center">
        <div className="space-y-3">
          <span className="text-xs uppercase tracking-wide text-white/60">Partnership</span>
          <h1 className="text-4xl font-bold text-white lg:text-5xl">
            Join the Mission
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-white/80">
            Partner with Ruach Ministries to advance discipleship, outreach, and media ministry
            that transforms lives and communities around the world.
          </p>
        </div>

        <Link
          href="#tiers"
        >
          <span className="inline-block rounded-full bg-amber-400 px-8 py-3 font-semibold text-black transition hover:bg-amber-500">
            See Partnership Levels
          </span>
        </Link>
      </section>

      {/* Impact Stats */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {impactStats.map((stat) => (
            <div key={stat.label} className="text-center space-y-2">
              <div className="text-4xl font-bold text-amber-400">{stat.value}</div>
              <div className="text-sm text-white/70">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Partner Section */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Why Partner With Us?</h2>
          <p className="text-white/70">Your partnership makes eternal impact</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="text-4xl">🎥</div>
            <h3 className="text-xl font-semibold text-white">Media Ministry</h3>
            <p className="text-sm text-white/70">
              Fund the creation of testimonies, teachings, and cinematic content that reaches
              millions with the Gospel.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="text-4xl">📖</div>
            <h3 className="text-xl font-semibold text-white">Discipleship</h3>
            <p className="text-sm text-white/70">
              Support deep-dive courses, resources, and mentorship programs that equip believers
              for Kingdom work.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
            <div className="text-4xl">🌍</div>
            <h3 className="text-xl font-semibold text-white">Global Outreach</h3>
            <p className="text-sm text-white/70">
              Enable on-the-ground ministry, community transformation, and humanitarian aid in
              underserved regions.
            </p>
          </div>
        </div>
      </section>

      {/* Partnership Tiers */}
      <section id="tiers" className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-white">Choose Your Partnership Level</h2>
          <p className="text-white/70">Select the level that fits your calling and capacity</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {partnerTiers.map((tier) => (
            <PartnerTierCard key={tier.name} tier={tier} />
          ))}
        </div>

        <div className="text-center">
          <p className="text-sm text-white/60">
            All donations are tax-deductible. Ruach Ministries is a 501(c)(3) nonprofit organization.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="rounded-3xl border border-amber-400/20 bg-gradient-to-br from-amber-400/10 to-white/5 p-12 text-center space-y-6">
        <h2 className="text-3xl font-bold text-white">
          Ready to Make a Difference?
        </h2>
        <p className="mx-auto max-w-xl text-white/80">
          Your partnership today will create lasting impact for eternity. Join hundreds of partners
          advancing the Kingdom through Ruach Ministries.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/give"
          >
            <span className="rounded-full bg-amber-400 px-8 py-3 font-semibold text-black transition hover:bg-amber-500">
              Become a Partner Today
            </span>
          </Link>
          <Link
            href="/members/impact"
          >
            <span className="rounded-full border border-white/20 px-8 py-3 font-semibold text-white transition hover:border-white hover:bg-white/10">
              View Partner Dashboard
            </span>
          </Link>
        </div>
      </section>
    </div>
  );
}
