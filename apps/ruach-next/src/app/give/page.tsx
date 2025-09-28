import Link from "next/link";
import DonationEmbedSwitcher from "@/components/ruach/DonationEmbedSwitcher";
import SEOHead from "@/components/ruach/SEOHead";
import GivebutterGoalWidget from "@ruach/addons/components/ruach/GivebutterGoalWidget";
import DoubleTheDonation from "@ruach/addons/components/ruach/DoubleTheDonation";

export const dynamic = "force-static";
export const revalidate = 180;

export default function GivePage(){
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://ruachministries.org";
  const givebutterUrl = process.env.NEXT_PUBLIC_GIVEBUTTER_URL || "https://givebutter.com/ruach-ministries";
  const givebutterEmbedHtml = process.env.NEXT_PUBLIC_GIVEBUTTER_EMBED_HTML;
  const memberfulUrl = process.env.NEXT_PUBLIC_MEMBERFUL_URL;
  const goalId = process.env.NEXT_PUBLIC_GIVEBUTTER_GOAL_ID;

  const donationSchema = {
    "@context": "https://schema.org",
    "@type": "DonateAction",
    name: "Support Ruach Ministries",
    target: `${site}/give` as const,
    recipient: {
      "@type": "Organization",
      name: "Ruach Ministries",
      url: site
    },
    description: "Partner with Ruach Ministries to fund testimonies, discipleship courses, and community outreach.",
    actionStatus: "PotentialActionStatus"
  };

  return (
    <div className="space-y-12">
      <SEOHead jsonLd={donationSchema} />

      <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Partner with Ruach</span>
        <h1 className="mt-4 text-3xl font-semibold text-white">Your generosity fuels freedom.</h1>
        <p className="mt-3 max-w-3xl text-sm text-white/70">
          Every gift helps us produce cinematic testimonies, launch discipleship courses, and fund outreach campaigns that lead people into encounters with Jesus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="#donate"
            className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Give now
          </Link>
          <Link
            href="/community-outreach#support"
            className="rounded-full border border-white/20 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Sponsor outreach
          </Link>
        </div>
      </section>

      <section id="donate" className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
        <h2 className="text-2xl font-semibold text-white">Choose your giving experience</h2>
        <p className="mt-2 text-sm text-white/70">
          Give through Givebutter for one-time or recurring donations, or manage your Memberful partnership for monthly discipleship resources.
        </p>
        <div className="mt-6">
          <DonationEmbedSwitcher
            givebutterUrl={givebutterUrl}
            givebutterEmbedHtml={givebutterEmbedHtml}
            memberfulUrl={memberfulUrl}
          />
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-white">Campaign Progress</h2>
          <p className="text-sm text-white/70">
            Track the current goal for production, outreach, and course development. Share the campaign with friends who carry a heart for revival.
          </p>
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6">
            {goalId ? (
              <GivebutterGoalWidget dataGoalId={goalId} />
            ) : (
              <p className="text-sm text-white/60">
                Set `NEXT_PUBLIC_GIVEBUTTER_GOAL_ID` to display the live Givebutter goal widget.
              </p>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-6 text-neutral-900 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Double the Donation</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Search your employer and multiply the impact of your gift through company matching.
          </p>
          <div className="mt-4">
            <DoubleTheDonation />
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 text-white md:grid-cols-3">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-wide text-white/60">1</div>
          <h3 className="mt-2 text-lg font-semibold text-white">Become a Partner</h3>
          <p className="mt-2 text-sm text-white/70">Join our monthly support team for behind-the-scenes updates, exclusive films, and partner-only prayer calls.</p>
          <Link
            href={memberfulUrl || "/signup"}
            className="mt-4 inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
          >
            Set up monthly giving
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-wide text-white/60">2</div>
          <h3 className="mt-2 text-lg font-semibold text-white">Sponsor a Course</h3>
          <p className="mt-2 text-sm text-white/70">Fund curriculum writing, filming, and translation so the global church can access discipleship for free.</p>
          <Link
            href="/courses"
            className="mt-4 inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            View active courses
          </Link>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="text-xs uppercase tracking-wide text-white/60">3</div>
          <h3 className="mt-2 text-lg font-semibold text-white">Support Outreach</h3>
          <p className="mt-2 text-sm text-white/70">Give to meals, supplies, and follow-up discipleship that keeps freedom flowing on the streets.</p>
          <Link
            href="/community-outreach#support"
            className="mt-4 inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Fund community outreach
          </Link>
        </div>
      </section>
    </div>
  );
}
