/* eslint-disable react/no-unescaped-entities */
import LocalizedLink from "@/components/navigation/LocalizedLink";
import MediaGrid from "@ruach/components/components/ruach/MediaGrid";
import type { MediaCardProps } from "@ruach/components/components/ruach/MediaCard";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import VolunteerSignupForm from "@/components/ruach/VolunteerSignupForm";
import { getOutreachStories } from "@/lib/strapi";
import { mapStoryToMediaCard } from "./story-helpers";

const fallbackStories: MediaCardProps[] = [
  {
    title: "Freedom in the Open",
    href: "/community-outreach/stories",
    excerpt:
      "Accounts from prayer, discernment, and deliverance carried into public spaces—where obedience is practiced, testimony is shared, and truth is lived outside institutional walls.",
    category: "Public Witness"
  },
  {
    title: "Provision with Presence",
    href: "/community-outreach/stories",
    excerpt:
      "Stories from local gatherings meeting practical needs through shared life—combining provision, prayer, and relational presence to strengthen households and communities.",
    category: "Household Strengthening"
  },
  {
    title: "Youth in Obedience",
    href: "/community-outreach/stories",
    excerpt:
      "Testimonies of young believers being formed in worship, discernment, and responsibility—growing in faith through obedience rather than performance.",
    category: "Next Generation Formation"
  }
];

const truthSystemFacts = [
  {
    icon: "📖",
    title: "Scripture-Rooted",
    body: "God's Word is the plumb line—above trends, platforms, personalities, and fear."
  },
  {
    icon: "🎙️",
    title: "Testimony-Powered",
    body: "Real encounters. Lived obedience. Faith refined through fire, not filters."
  },
  {
    icon: "🔍",
    title: "Open to Examination",
    body: "Truth welcomes scrutiny. Questions are not rebellion—they are pathways to maturity."
  },
  {
    icon: "🌐",
    title: "Resistant to Control",
    body: "Decentralized by design. No single voice replaces the Head of the Church."
  }
];

const equipAudience = [
  {
    title: "House Churches & Home Gatherings",
    description: "Families and small groups committed to Scripture, prayer, communion, and shared life."
  },
  {
    title: "Shepherds & Facilitators",
    description: "Those called to guide without control—stewarding people, not platforms."
  },
  {
    title: "Builders & Creators",
    description: "Developers, writers, filmmakers, and designers building tools that serve truth, not manipulation."
  },
  {
    title: "Remnant Leaders",
    description: "Those sensing a call to prepare people spiritually, not entertain them."
  }
];

const resourceHighlights = [
  {
    title: "House Church & Ecclesia Guides",
    bullets: [
      "Hosting gatherings with Scripture as the center",
      "Facilitating discussion and guarding against false teaching",
      "Cultivating discernment and navigating cultural pressure"
    ]
  },
  {
    title: "Companion Formation Resources",
    bullets: [
      "Engaging Scripture deeply together",
      "Testing teachings in community",
      "Anchoring identity in Christ and walking tension without division"
    ]
  },
  {
    title: "Testimony-Driven Media",
    bullets: [
      "Stories from deliverance, repentance, and obedience",
      "Shared to strengthen the Body, not for spectacle",
      "Recorded with humility and spiritual sensitivity"
    ]
  }
];

const givingHighlights = [
  "Bibles",
  "Food for families",
  "Formation resources",
  "Testimony-driven media",
  "Outreach and discipleship tools"
];

export const metadata = {
  title: "Community Outreach — Ruach Ministries",
  description:
    "Gather the remnant ecclesia with truth systems that equip house churches, builders, and shepherds for faithful witness."
};

export default async function CommunityOutreachPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const storyEntities = await getOutreachStories({ limit: 6, featured: true }).catch(() => []);
  let stories = storyEntities.map(mapStoryToMediaCard).filter((story): story is MediaCardProps => Boolean(story));

  if (stories.length === 0) {
    const recentStories = await getOutreachStories({ limit: 6 }).catch(() => []);
    stories = recentStories.map(mapStoryToMediaCard).filter((story): story is MediaCardProps => Boolean(story));
  }

  if (stories.length === 0) {
    stories = fallbackStories;
  }

  const donationFormUrl =
    process.env.NEXT_PUBLIC_OUTREACH_GIVE_URL || "https://givebutter.com/ruach-outreach";

  return (
    <div className="space-y-10">
      <section
        className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-10 text-zinc-900 shadow-sm dark:border-amber-300/30 dark:from-amber-500/10 dark:to-orange-500/10 dark:text-white"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-amber-200">Gather the Remnant</p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900 dark:text-white">Equipping the Ecclesia for a Fractured World</h1>
        <p className="mt-2 text-base text-zinc-700 dark:text-white/80">Ruach in a Moment of Tension</p>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>They’re building control systems. We’re building truth systems.</p>
          <p>
            Technology accelerates. Narratives are shaped. Systems are being constructed—not simply to inform,
            but to direct behavior, shape belief, and centralize authority.
          </p>
          <p>
            Ruach is not here to compete. Ruach exists to gather and equip decentralized ecclesia—small,
            Scripture-anchored communities meeting in homes, living rooms, backyards, and everyday spaces.
          </p>
          <p>This is not about scale. It’s about faithfulness.</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="#stories">
            <span className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">
              Explore Resources
            </span>
          </LocalizedLink>
          <LocalizedLink href="#equip">
            <span className="rounded-full border border-zinc-900 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white">
              Equip Your House Church
            </span>
          </LocalizedLink>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-8 text-foreground">
        <h2 className="text-2xl font-semibold text-foreground">What Is a Truth System?</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {truthSystemFacts.map((fact) => (
            <div key={fact.title} className="space-y-3">
              <div className="text-3xl">{fact.icon}</div>
              <h3 className="text-lg font-semibold text-foreground">{fact.title}</h3>
              <p className="text-sm text-muted-foreground">{fact.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">We're Equipping the Ecclesia</h2>
          <p className="text-sm text-zinc-600">
            Ruach exists to equip small, resilient communities—not spectators. Whether you’re gathering weekly in a living room, leading a small prayer fellowship,
            hosting Scripture study around a table, or discerning how to shepherd people outside institutional walls—you are not behind. You are early.
          </p>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {equipAudience.map((item) => (
            <div key={item.title} className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-white/10 dark:bg-white/5">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{item.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm" id="stories">
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold">What We’re Providing</h2>
          <p className="text-sm text-zinc-600">
            Resources, tools, and stories that keep fledgling gatherings alive, accountable, and obedient.
          </p>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {resourceHighlights.map((resource) => (
            <div key={resource.title} className="space-y-3 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-white/10 dark:bg-black/10">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{resource.title}</h3>
              <ul className="space-y-1 text-sm text-zinc-600 dark:text-white/70">
                {resource.bullets.map((bullet) => (
                  <li key={bullet}>• {bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">From the Field</p>
            <h2 className="text-2xl font-semibold text-foreground">Obedience in Practice — Not Theory</h2>
            <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-white/70">Witness how Scripture becomes lived formation.</p>
          </div>
          <LocalizedLink href="/community-outreach/stories">
            <span className="text-sm font-semibold text-foreground underline decoration-[hsl(var(--primary))] decoration-2 underline-offset-4">
              View All Testimonies →
            </span>
          </LocalizedLink>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
          <MediaGrid items={stories} />
        </div>
        <div className="grid gap-3 text-sm text-zinc-600 dark:text-white/70">
          <p className="font-semibold text-zinc-900 dark:text-white">What These Stories Reveal</p>
          <ul className="space-y-1">
            <li>• Ecclesia in motion — faith practiced publicly through prayer, testimony, and deliverance</li>
            <li>• Formation through presence — meeting needs while strengthening spiritual identity</li>
            <li>• Obedience cultivated early — young believers formed in worship, leadership, and courage</li>
          </ul>
        </div>
      </section>

      <section id="equip" className="rounded-3xl border border-zinc-900/10 bg-gradient-to-br from-black to-zinc-900 p-8 text-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
          <h2 className="text-3xl font-semibold">Equip the Remnant</h2>
          <p className="text-sm">
            If God is stirring something in you—to gather, shepherd, build, or replicate—we want to walk with you.
            This is not a volunteer signup. This is an invitation into formation and responsibility.
          </p>
        </div>
        <div className="mt-8 grid gap-8 md:grid-cols-[1.2fr,1fr]">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Ways to Engage</h3>
            <ul className="space-y-2 text-sm">
              <li>• Equip and host a house church or ecclesia.</li>
              <li>• Develop Scripture-rooted teaching or media.</li>
              <li>• Build tools that support decentralized communities.</li>
              <li>• Test and discern emerging technologies together.</li>
              <li>• Share testimonies that strengthen the Body.</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/20 bg-black/50 p-6">
            <VolunteerSignupForm />
          </div>
        </div>
      </section>

      <section className="grid gap-8 rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 md:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Strengthen the Infrastructure of the Ecclesia</h2>
          <div className="space-y-3 text-sm text-zinc-600">
            <p>
              Every gift reinforces what cannot be centralized or controlled—Scripture in homes, provision at tables, formation in small gatherings,
              testimony carried in truth, and tools that serve obedience rather than platforms.
            </p>
            <p className="font-semibold text-zinc-900">This is not funding a brand.</p>
            <p className="font-semibold text-zinc-900">It is resourcing faithfulness.</p>
          </div>
          <div className="space-y-3 text-sm text-zinc-700">
            <p className="font-semibold text-zinc-900">Ways to Participate</p>
            <div className="space-y-1">
              <p className="font-semibold text-zinc-900">Monthly Partnership (Recommended)</p>
              <p>$75 / month — sustains household provision and equips small ecclesial gatherings with Scripture, formation resources, and practical tools.</p>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-zinc-900">One-Time Participation</p>
              <p>$25 • $50 • $100 • $250 • Custom</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-zinc-600">
            <p className="font-semibold text-zinc-900">What This Supports</p>
            <ul className="space-y-1">
              <li>• Scripture distributed and taught in homes and gatherings</li>
              <li>• Provision for families through local, presence-based care</li>
              <li>• Formation guides and teaching rooted in Scripture</li>
              <li>• Testimony-driven media that strengthens the Body</li>
              <li>• Outreach and discipleship tools for decentralized communities</li>
            </ul>
          </div>
          <LocalizedLink href="/give">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-900 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white">
              Give Securely
            </span>
          </LocalizedLink>
        </div>
        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 shadow">
          <DonationForm processorUrl={donationFormUrl} />
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <h2 className="text-2xl font-semibold">Called to Lead or Replicate?</h2>
          <p className="text-sm text-zinc-700">
            Some are called to participate. Others are called to plant, shepherd, and send. If you sense God calling you to start a house church,
            shepherd a small ecclesia, or carry this vision into your city—we don’t want to control it. We want to equip you and release you.
          </p>
          <LocalizedLink href="/carry">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-5 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-900 hover:text-white">
              Learn More →
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
