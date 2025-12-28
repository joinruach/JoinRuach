/* eslint-disable react/no-unescaped-entities */
import { ReactNode } from "react";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Start Here — Ruach Ministries",
  description: "Ruach is a prophetic media ministry that forms, equips, and sends believers to carry freedom and establish Kingdom communities.",
  openGraph: {
    title: "Start Here — Ruach Ministries",
    description: "Discover what Ruach is, who it's for, and where you fit in the journey from awakening to activation.",
  },
};

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white/90 p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
      <div className="mb-6 space-y-2">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">{title}</h2>
        {description ? <p className="text-sm text-zinc-600 dark:text-white/70">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function JourneyStep({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
          {number}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{children}</p>
        </div>
      </div>
    </div>
  );
}

function PathwayCard({ icon, title, description, link }: { icon: string; title: string; description: string; link: string }) {
  return (
    <LocalizedLink href={link}>
      <div className="group rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:border-amber-200/70 hover:bg-amber-50 dark:border-white/10 dark:bg-white/5 dark:shadow-none dark:hover:border-amber-300/30 dark:hover:bg-white/10">
        <div className="mb-4 text-4xl">{icon}</div>
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{description}</p>
        <div className="mt-4 text-sm font-medium text-amber-700 group-hover:text-amber-800 dark:text-amber-300 dark:group-hover:text-amber-200">
          Start here →
        </div>
      </div>
    </LocalizedLink>
  );
}

export default async function StartHere({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">🕊️ Start Here</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">Welcome to Ruach</h1>
        <p className="mt-3 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          <strong>Ruach is a prophetic media ministry that forms, equips, and sends believers to carry freedom and establish Kingdom communities.</strong>
        </p>
        <p className="mt-4 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          We tell testimonies, disciple believers in the Word and the gifts of the Spirit, and mobilize outreach teams—so what God does in private lives is carried into public places.
        </p>
        <p className="mt-4 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          Ruach means <em>breath</em> in Hebrew—the Spirit of God moving through story, truth, and mission. Everything we create and carry flows from that reality.
        </p>
      </section>

      {/* Who This Is For */}
      <Section title="Who This Is For">
        <div className="space-y-4 text-sm text-zinc-700 dark:text-white/70">
          <p className="text-base text-zinc-800 dark:text-white/80">
            <strong>Ruach exists for believers who sense there is more.</strong>
          </p>
          <p>
            You're awake. You're hungry. You refuse to remain passive in these days.
          </p>
          <p>
            You've encountered the presence of God, but you lack biblical framework, freedom from bondage, or clarity about what comes next. You're done with hype, entertainment, and shallow teaching. You want substance, deliverance, and a pathway forward.
          </p>
          <div className="mt-6 space-y-3">
            <p className="text-zinc-700 dark:text-white/80">You may be:</p>
            <ul className="space-y-2 pl-5">
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Seeking freedom from trauma, shame, or spiritual bondage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Hungry for sound doctrine and the power of the Holy Spirit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Looking for a community that values truth over trend</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 text-amber-500 dark:text-amber-300">•</span>
                <span>Called to carry what you've received into your city, church, or sphere</span>
              </li>
            </ul>
          </div>
          <p className="mt-6 text-zinc-800 dark:text-white/80">
            <strong>If this resonates, you're in the right place.</strong>
          </p>
          <p>
            We're gathering a remnant—not an elite, but the willing. Sons and daughters who will walk in holiness, move in power, and build Kingdom communities that reflect the Bride, not Babylon.
          </p>
        </div>
      </Section>

      {/* The Journey */}
      <Section
        title="The Journey"
        description="Ruach is not a content library. It's a pathway from awakening to activation."
      >
        <p className="mb-6 text-sm text-zinc-600 dark:text-white/70">
          Here's how most people move through this ministry:
        </p>
        <div className="space-y-4">
          <JourneyStep number="1" title="Awaken — Encounter truth and testimony">
            Watch stories of real freedom. See what Jesus is still doing. Let the Spirit stir hunger in you.
          </JourneyStep>
          <JourneyStep number="2" title="Be Formed — Ground yourself in the Word and the gifts">
            Take courses that build biblical literacy, prophetic discernment, and spiritual authority. Learn doctrine that delivers, not just entertains.
          </JourneyStep>
          <JourneyStep number="3" title="Receive Freedom — Walk through healing and deliverance">
            Apply what you're learning. Renounce lies, break bondages, and step into the identity Christ has already given you. Freedom here is not spectacle—it is repentance, truth, prayer, and walking out what Jesus has already won.
          </JourneyStep>
          <JourneyStep number="4" title="Walk It Out — Serve, give, and participate in mission">
            Join outreach teams. Partner financially. Become part of a community that moves beyond Sunday services into streets, homes, and nations.
          </JourneyStep>
          <JourneyStep number="5" title="Carry It — Lead, replicate, and send">
            Take what you've received and multiply it. Train others. Plant something. Become a vessel the Spirit can send into your sphere with authority and anointing.
          </JourneyStep>
        </div>
        <p className="mt-6 text-sm text-zinc-500 dark:text-white/60">
          Not everyone moves through these steps at the same pace. Some need freedom first. Others need formation. A few are already equipped and ready to build.
        </p>
        <p className="mt-4 text-base font-medium text-zinc-800 dark:text-white/90">
          The key is this: Ruach is designed to move you from observer to participant to carrier.
        </p>
      </Section>

      {/* Your Next Step */}
      <Section
        title="Your Next Step"
        description="You don't have to do everything at once. Start where you are."
      >
        <div className="grid gap-6 md:grid-cols-3">
          <PathwayCard
            icon="🕊️"
            title="I'm New — Show Me What Ruach Is About"
            description="Watch a featured testimony or explore our media library. See real stories of deliverance, healing, and transformation."
            link="/media"
          />
          <PathwayCard
            icon="📖"
            title="I Need Freedom or Formation"
            description="Browse our courses or dive into deliverance resources. Get equipped in the Word, the Spirit, and the freedom Christ died to give you."
            link="/courses"
          />
          <PathwayCard
            icon="🔥"
            title="I Feel Called to Carry This"
            description="Join community outreach, become a partner, or reach out to our team if you sense God is calling you to lead, replicate, or build something in your city."
            link="/community-outreach"
          />
        </div>
      </Section>

      {/* What Makes Ruach Different */}
      <Section title="What Makes Ruach Different?">
        <p className="mb-6 text-base text-zinc-800 dark:text-white/80">
          <strong>We're not building a platform. We're preparing a people.</strong>
        </p>
        <ul className="space-y-3 text-sm text-zinc-700 dark:text-white/70">
          <li className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <strong className="text-zinc-900 dark:text-white">No hype.</strong> Only truth, power, and presence.
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <strong className="text-zinc-900 dark:text-white">No celebrity.</strong> Only the testimony of Jesus and the glory of His name.
          </li>
          <li className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <strong className="text-zinc-900 dark:text-white">No passive consumption.</strong> Everything here is designed to activate, not just inspire.
          </li>
        </ul>
        <p className="mt-6 text-sm text-zinc-700 dark:text-white/70">
          Ruach operates under a Kingdom philosophy we call <strong className="text-zinc-900 dark:text-white">Bride Over Beast</strong>—building on truth, discernment, and mission instead of control, manipulation, and entertainment. We value intimacy over influence, sending over sitting, and faithfulness over reach.
        </p>
        <p className="mt-4 text-sm text-zinc-700 dark:text-white/70">
          If that's the kind of ministry you've been looking for, welcome home.
        </p>
      </Section>

      {/* Ready? */}
      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Ready?</h2>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <LocalizedLink href="/media">
            <span className="inline-block rounded-full bg-amber-600 px-6 py-3 font-medium text-zinc-900 dark:text-white transition-all hover:bg-amber-700 dark:bg-white/10 dark:hover:bg-white/20">
              Watch a Testimony
            </span>
          </LocalizedLink>
          <LocalizedLink href="/courses">
            <span className="inline-block rounded-full bg-amber-600 px-6 py-3 font-medium text-zinc-900 dark:text-white transition-all hover:bg-amber-700 dark:bg-white/10 dark:hover:bg-white/20">
              Take a Course
            </span>
          </LocalizedLink>
          <a
            href="https://joinruach.org/en/guidebook/enter"
            target="_blank"
            rel="noreferrer"
          >
            <span className="inline-block rounded-full bg-amber-600 px-6 py-3 font-medium text-zinc-900 dark:text-white transition-all hover:bg-amber-700 dark:bg-white/10 dark:hover:bg-white/20">
              The Remnant Guidebook
            </span>
          </a>
          <LocalizedLink href="/give">
            <span className="inline-block rounded-full bg-amber-600 px-6 py-3 font-medium text-zinc-900 dark:text-white transition-all hover:bg-amber-700 dark:bg-white/10 dark:hover:bg-white/20">
              Give
            </span>
          </LocalizedLink>
          <LocalizedLink href="/about">
            <span className="inline-block rounded-full bg-amber-600 px-6 py-3 font-medium text-zinc-900 dark:text-white transition-all hover:bg-amber-700 dark:bg-white/10 dark:hover:bg-white/20">
              Learn More About Us
            </span>
          </LocalizedLink>
        </div>
        <p className="mt-8 text-xs text-zinc-600 dark:text-white/60">
          <strong className="text-zinc-800 dark:text-white">Ruach Ministries</strong>
          <br />
          Breathing life into nations through story, teaching, and compassion.
        </p>
      </section>
    </div>
  );
}
