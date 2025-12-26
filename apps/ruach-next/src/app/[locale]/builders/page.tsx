/* eslint-disable react/no-unescaped-entities */
import LocalizedLink from "@/components/navigation/LocalizedLink";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import VolunteerSignupForm from "@/components/ruach/VolunteerSignupForm";

const heroDescription =
  "Technology is accelerating. Narratives are being shaped. Systems are being built—not just to inform people, but to guide behavior, manage belief, and centralize authority.\n\nRuach is not here to compete with those systems. Ruach is here to build something different.\n\nNot control systems—but truth systems. Systems that help people see clearly, test what they hear, and walk faithfully in a fractured world.\n\nWe're gathering Kingdom creators and developers—builders who will shape tools, platforms, and communities rooted in Scripture, powered by testimony, open to examination, and resistant to control.";

const volunteerHighlights = [
  { title: "Build truth-centered platforms & tools", description: "Code, design, content systems" },
  { title: "Create Scripture-rooted media & resources", description: "Video, writing, courses, podcasts" },
  { title: "Develop communities of discernment", description: "Local hubs, online networks, study groups" },
  { title: "Test & validate emerging technologies", description: "AI, blockchain, communication tools" }
];

const currentProjects = [
  {
    title: "Truth Systems Platform",
    category: "Development",
    description: "Building decentralized infrastructure for Scripture-rooted content and community",
    status: "Active Development"
  },
  {
    title: "Testimony Archive",
    category: "Infrastructure",
    description: "Permanent, immutable storage for witness accounts and spiritual breakthroughs",
    status: "Planning"
  },
  {
    title: "Discernment Tools",
    category: "AI/ML",
    description: "AI-assisted Scripture analysis and teaching validation frameworks",
    status: "Research"
  }
];

const developmentIdeas = [
  {
    title: "Decentralized Community Networks",
    description: "Local-first platforms for Kingdom builders to connect, share resources, and collaborate"
  },
  {
    title: "Scripture Memory & Study Apps",
    description: "Mobile-first tools for meditation, memorization, and community Scripture engagement"
  },
  {
    title: "Media Production Pipeline",
    description: "Open-source tooling for testimony capture, editing, and distribution"
  },
  {
    title: "Prayer & Intercession Platforms",
    description: "Secure, private networks for prayer requests and spiritual warfare coordination"
  }
];

export async function generateMetadata() {
  return {
    title: "Builders — Ruach Ministries",
    description: heroDescription,
    openGraph: {
      title: "Builders — Ruach Ministries",
      description: "Join Kingdom creators building truth systems over control systems"
    }
  };
}

export default async function BuildersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15+ requirement)
  await params;

  const donationFormUrl =
    process.env.NEXT_PUBLIC_OUTREACH_GIVE_URL ||
    "https://givebutter.com/ruach-outreach";

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="rounded-3xl border border-border bg-card p-10 text-foreground shadow-[0_25px_80px_rgba(43,37,30,0.08)]">
        <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Ruach in a Moment of Tension
        </span>
        <h1 className="mt-4 text-3xl font-semibold text-foreground">
          They're Building Control Systems. We're Building Truth Systems.
        </h1>
        <p className="mt-3 max-w-3xl text-base text-muted-foreground whitespace-pre-line">
          {heroDescription}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="#projects">
            <span className="rounded-full bg-[hsl(var(--primary))] px-5 py-2 text-sm font-semibold text-[hsl(var(--primary-foreground))] transition hover:bg-[#C7A574]">
              Explore Projects
            </span>
          </LocalizedLink>
          <LocalizedLink href="#volunteer">
            <span className="rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground transition hover:bg-[rgba(43,43,43,0.05)]">
              Join Us
            </span>
          </LocalizedLink>
        </div>
      </section>

      {/* What Makes a Truth System? */}
      <section className="rounded-3xl border border-border bg-card p-8 text-foreground">
        <h2 className="mb-6 text-2xl font-semibold text-foreground">What Makes a Truth System?</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <div className="text-3xl">📖</div>
            <h3 className="text-lg font-semibold text-foreground">Scripture-Rooted</h3>
            <p className="text-sm text-muted-foreground">
              God's Word is the plumbline for all decisions, interpretations, and direction.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">🎙️</div>
            <h3 className="text-lg font-semibold text-foreground">Testimony-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Real stories over synthetic narratives. Lived faith over curated performance.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">🔍</div>
            <h3 className="text-lg font-semibold text-foreground">Open to Examination</h3>
            <p className="text-sm text-muted-foreground">
              Truth invites testing. Questions are not threats—they're pathways to clarity.
            </p>
          </div>
          <div className="space-y-3">
            <div className="text-3xl">🌐</div>
            <h3 className="text-lg font-semibold text-foreground">Resistant to Control</h3>
            <p className="text-sm text-muted-foreground">
              Decentralized by design. No single voice replaces conscience, Scripture, or the Spirit.
            </p>
          </div>
        </div>
      </section>

      {/* Kingdom Creators & Developers */}
      <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-300/30 dark:from-amber-500/10 dark:to-orange-500/10 p-10 text-zinc-900 dark:text-white">
        <div className="max-w-3xl mx-auto space-y-6 text-center">
          <h2 className="text-3xl font-semibold text-zinc-900 dark:text-white">
            We're Gathering Kingdom Creators
          </h2>
          <p className="text-base text-zinc-700 dark:text-white/80">
            Not everyone is called to build. But if you sense God calling you to create, develop, or shape infrastructure that serves His Kingdom—you're in the right place.
          </p>
          <div className="grid gap-6 md:grid-cols-3 text-left mt-8">
            <div className="rounded-2xl border border-amber-200 bg-white dark:border-amber-300/20 dark:bg-white/5 p-6 space-y-3">
              <div className="text-3xl">🛠️</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Builders</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">
                Developers, designers, engineers creating platforms, tools, and systems that serve truth over control.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white dark:border-amber-300/20 dark:bg-white/5 p-6 space-y-3">
              <div className="text-3xl">✍️</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Creators</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">
                Writers, filmmakers, artists producing media that awakens, equips, and challenges the Church.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white dark:border-amber-300/20 dark:bg-white/5 p-6 space-y-3">
              <div className="text-3xl">🧭</div>
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Leaders</h3>
              <p className="text-sm text-zinc-600 dark:text-white/70">
                Pastors, teachers, organizers building communities of discernment rooted in Scripture and Spirit.
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-600 dark:text-white/70 mt-6">
            If this resonates, scroll down to "Join the Builders" and let us know what you're called to create.
          </p>
        </div>
      </section>

      {/* Current Projects & Development Ideas */}
      <section id="projects" className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Current Projects</h2>
        <div className="rounded-3xl border border-border bg-card p-8 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
          <div className="grid gap-6 md:grid-cols-3">
            {currentProjects.map((project, index) => (
              <div key={index} className="space-y-3 rounded-2xl border border-border bg-muted/30 p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      {project.category}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{project.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {project.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Development Ideas */}
      <section className="space-y-6">
        <h2 className="text-lg font-semibold text-foreground">Ideas for Development</h2>
        <div className="rounded-3xl border border-border bg-card p-8 text-foreground">
          <div className="grid gap-4 md:grid-cols-2">
            {developmentIdeas.map((idea, index) => (
              <div key={index} className="space-y-2 rounded-xl border border-border bg-muted/20 p-5">
                <h3 className="text-base font-semibold text-foreground">{idea.title}</h3>
                <p className="text-sm text-muted-foreground">{idea.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the Builders - Volunteer Form */}
      <section
        id="volunteer"
        className="grid gap-8 rounded-3xl border border-border bg-card p-8 text-foreground lg:grid-cols-[1.1fr,0.9fr]"
      >
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">Join the Builders</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-line">{heroDescription}</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {volunteerHighlights.map((highlight, index) => (
              <li key={`${highlight.title}-${index}`}>
                • {highlight.title}
                {highlight.description ? (
                  <span className="ml-1 text-muted-foreground">— {highlight.description}</span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-3xl border border-border bg-muted/60 p-6">
          <VolunteerSignupForm />
        </div>
      </section>

      {/* Fuel Kingdom Infrastructure - Giving */}
      <section
        id="support"
        className="grid gap-8 rounded-3xl border border-border bg-card p-8 text-foreground md:grid-cols-[1.2fr,1fr]"
      >
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Fuel Kingdom Infrastructure</h2>
          <p className="text-sm text-muted-foreground">
            Every dollar fuels truth systems—Scripture-rooted storytelling, discernment tools, and
            emerging infrastructure. Give monthly or one-time to help builders, creators, and leaders
            take the next step.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Monthly Builder Support
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">$75+ / month</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Sustains the teams crafting decentralized networks and Scripture memory tools that
                keep this movement rooted in truth.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>• Local-first community platforms</li>
                <li>• Scripture memorization & study apps</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-muted/60 p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Project Catalyst
              </div>
              <div className="mt-2 text-lg font-semibold text-foreground">$250+ one-time</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Funds media pipelines, testimony archives, and prayer platforms that launch fresh truth
                systems.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                <li>• Media production & testimony capture</li>
                <li>• Prayer and intercession platforms</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_20px_60px_rgba(43,37,30,0.08)]">
          <DonationForm processorUrl={donationFormUrl} />
        </div>
      </section>

      {/* Called to Lead? */}
      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <div className="max-w-2xl space-y-4">
          <h2 className="text-2xl font-semibold">Called to Lead?</h2>
          <p className="text-sm text-zinc-700 dark:text-white/80">
            Some are called to participate. Others are called to lead, replicate, or build outreach where they live.
          </p>
          <p className="text-sm text-zinc-700 dark:text-white/80">
            If you sense God calling you beyond volunteering—to plant something, lead something, or carry this fire into your city—we want to equip and send you.
          </p>
          <LocalizedLink href="/carry">
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-800 dark:text-white/90 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Learn More →
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
