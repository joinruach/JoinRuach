// apps/ruach-next/src/app/[locale]/partners/page.tsx
import type { Metadata } from "next";
import LocalizedLink from "@/components/navigation/LocalizedLink";

export const metadata: Metadata = {
  title: "Partner With Ruach — Ruach Ministries",
  description:
    "This is not a transaction. It's an alignment. Walk with Ruach in obedience to what God is doing through testimony, teaching, and Spirit-led media.",
  openGraph: {
    title: "Partner With Ruach — Ruach Ministries",
    description:
      "Partnership is about walking together in obedience, not access or perks. Discern if you're called to stand with this work.",
  },
};

const PARTNER_TESTIMONIALS = [
  {
    quote:
      "Ruach helped us put language to what our people were already feeling—confusion, hunger, and a need for truth without performance.",
    attribution: "— Church Partner",
  },
  {
    quote: "This isn't content. It's confrontation—in the best way.",
    attribution: "— Individual Partner",
  },
  {
    quote:
      "Partnering with Ruach reminded us that obedience matters more than optics.",
    attribution: "— Ministry Leader",
  },
];

export default function PartnersPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      {/* Hero Section */}
      <header className="mb-16 space-y-6 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Partner With Ruach
        </h1>

        <div className="space-y-4">
          <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
            This Is Not a Transaction
          </p>
          <p className="text-xl text-zinc-700 dark:text-zinc-300">
            It's an Alignment
          </p>
        </div>

        <div className="mx-auto max-w-2xl space-y-4 text-base text-zinc-700 dark:text-zinc-300">
          <p>
            Ruach exists to awaken identity, restore truth, and disciple people
            through testimony, teaching, and Spirit-led media.
          </p>
          <p>
            Partnership is not about access, perks, or tiers.
            <br />
            It's about walking together in obedience to what God is doing.
          </p>
          <p>
            Some are called to watch.
            <br />
            Some are called to pray.
            <br />
            Some are called to build, send, and stand.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-900/30 dark:bg-amber-950/20">
          <p className="text-lg font-medium text-zinc-900 dark:text-white">
            If you're here, we invite you to pause—not rush—and ask:
          </p>
          <p className="mt-2 text-xl font-semibold italic text-zinc-800 dark:text-zinc-200">
            "Am I meant to walk with this work?"
          </p>
        </div>
      </header>

      {/* Why Partnership Exists */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none sm:p-12">
        <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
          Why Partnership Exists
        </h2>

        <div className="space-y-4 text-base text-zinc-700 dark:text-zinc-300">
          <p>Ruach is sustained by people and churches who believe that:</p>

          <ul className="ml-6 space-y-2">
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              <span>Truth must be spoken clearly in an age of confusion</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              <span>Testimony is a weapon against deception and shame</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              <span>Discipleship must go deeper than inspiration</span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              <span>
                Media can be used as a tool for awakening, not distraction
              </span>
            </li>
            <li className="flex gap-3">
              <span className="text-amber-500">•</span>
              <span>The Church must be equipped, not entertained</span>
            </li>
          </ul>

          <p className="pt-4">Partnership allows this work to remain:</p>

          <ul className="ml-6 space-y-2">
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Rooted in Scripture</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Free from compromise</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Responsive to the Spirit</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>Focused on fruit, not scale</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Individual Partnership */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 dark:border-white/10 dark:bg-zinc-900/50 sm:p-12">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-white">
          Individual Partnership
        </h2>
        <p className="mb-6 text-lg italic text-zinc-700 dark:text-zinc-300">
          Some are called to stand in the unseen places.
        </p>

        <div className="space-y-6 text-base text-zinc-700 dark:text-zinc-300">
          <p>
            Individual partners form the prayer and support covering that makes
            this work possible.
          </p>

          <div>
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-white">
              As an Individual Partner, You Help Sustain:
            </h3>
            <ul className="ml-6 space-y-2">
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Testimony capture and distribution</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Teaching resources and discipleship content</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Outreach efforts and media production</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Ongoing prayer and discernment over the ministry</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-white">
              What Partnership Looks Like:
            </h3>
            <ul className="ml-6 space-y-2">
              <li className="flex gap-3">
                <span className="text-zinc-400">•</span>
                <span>Consistent prayer covering</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-400">•</span>
                <span>Monthly mission updates</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-400">•</span>
                <span>Early insight into what God is doing behind the scenes</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-400">•</span>
                <span>Opportunities to participate, testify, or serve</span>
              </li>
              <li className="flex gap-3">
                <span className="text-zinc-400">•</span>
                <span>
                  Connection to a community grounded in truth and humility
                </span>
              </li>
            </ul>
          </div>

          <p className="pt-4 font-medium italic text-zinc-900 dark:text-white">
            There is no hierarchy here. Only faithfulness.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <LocalizedLink href="/give">
            <span className="inline-block rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900">
              Explore Individual Partnership
            </span>
          </LocalizedLink>
          <LocalizedLink href="/prayer">
            <span className="inline-block rounded-full border border-zinc-300 px-8 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-white/20 dark:text-white/90 dark:hover:border-white/40">
              Request Prayer
            </span>
          </LocalizedLink>
        </div>
      </section>

      {/* Church & Organizational Partnership */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm dark:border-white/10 dark:from-amber-950/20 dark:to-white/5 dark:shadow-none sm:p-12">
        <h2 className="mb-4 text-2xl font-semibold text-zinc-900 dark:text-white">
          Church & Organizational Partnership
        </h2>
        <p className="mb-6 text-lg italic text-zinc-700 dark:text-zinc-300">
          Some are called to carry this work into cities, congregations, and
          regions.
        </p>

        <div className="space-y-6 text-base text-zinc-700 dark:text-zinc-300">
          <p>
            Church and organizational partners walk with Ruach in shared
            mission, not branding or platform-building.
          </p>

          <div>
            <h3 className="mb-3 font-semibold text-zinc-900 dark:text-white">
              These Partnerships May Include:
            </h3>
            <ul className="ml-6 space-y-2">
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Hosting screenings, teachings, or gatherings</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Co-sponsoring outreach or discipleship initiatives</span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>
                  Custom teaching or testimony resources for your community
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>
                  Equipping leaders with tools for identity restoration and
                  discernment
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-amber-500">•</span>
                <span>Long-term alignment for regional impact</span>
              </li>
            </ul>
          </div>

          <p className="pt-4 font-medium italic text-zinc-900 dark:text-white">
            Every partnership is prayerfully discerned.
            <br />
            We do not mass-produce relationships.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="mailto:partners@joinruach.org?subject=Church Partnership Inquiry"
            className="inline-block rounded-full bg-zinc-900 px-8 py-3 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-zinc-900"
          >
            Contact Partnership Team
          </a>
          <LocalizedLink href="/team">
            <span className="inline-block rounded-full border border-zinc-300 px-8 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-white/20 dark:text-white/90 dark:hover:border-white/40">
              Meet Our Team
            </span>
          </LocalizedLink>
        </div>
      </section>

      {/* Testimony From Partners */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-2xl font-semibold text-zinc-900 dark:text-white">
          Testimony From Partners
        </h2>

        <div className="space-y-6">
          {PARTNER_TESTIMONIALS.map((testimonial, index) => (
            <blockquote
              key={index}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-white/5"
            >
              <p className="text-base italic text-zinc-700 dark:text-zinc-300">
                "{testimonial.quote}"
              </p>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {testimonial.attribution}
              </p>
            </blockquote>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Full testimonies available on the{" "}
          <LocalizedLink href="/impact">
            <span className="underline hover:text-zinc-900 dark:hover:text-white">
              Impact page
            </span>
          </LocalizedLink>
          .
        </p>
      </section>

      {/* Giving Is a Response */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 dark:border-white/10 dark:bg-zinc-900/50 sm:p-12">
        <h2 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-white">
          Giving Is a Response, Not a Requirement
        </h2>

        <div className="space-y-4 text-base text-zinc-700 dark:text-zinc-300">
          <p>
            Financial giving is one way partnership is expressed—but it is
            never the measure of faithfulness.
          </p>

          <ul className="ml-6 space-y-2">
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>We do not sell access.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>We do not gate truth.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-zinc-400">•</span>
              <span>We do not pressure response.</span>
            </li>
          </ul>

          <p className="pt-4 font-medium text-zinc-900 dark:text-white">
            We invite prayerful, willing participation.
          </p>
        </div>
      </section>

      {/* How to Respond */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none sm:p-12">
        <h2 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-white">
          How to Respond
        </h2>

        <p className="mb-8 text-center text-base text-zinc-700 dark:text-zinc-300">
          If you feel stirred, here are a few next steps:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <LocalizedLink href="/prayer">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Request Prayer
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If you need covering or clarity
              </p>
            </div>
          </LocalizedLink>

          <LocalizedLink href="/give">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Explore Individual Partnership
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If you feel called to stand with the mission
              </p>
            </div>
          </LocalizedLink>

          <a href="mailto:partners@joinruach.org?subject=Church Partnership Inquiry">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Explore Church Partnership
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If your church or organization senses alignment
              </p>
            </div>
          </a>

          <LocalizedLink href="/contact">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Share a Testimony
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                If God has used this work in your life
              </p>
            </div>
          </LocalizedLink>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Every message is read.
          <br />
          Every conversation begins with prayer.
        </p>
      </section>

      {/* Final Word */}
      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-white dark:border-white/10 dark:from-white dark:to-zinc-100 dark:text-zinc-900 sm:p-12">
        <h2 className="mb-6 text-center text-2xl font-semibold">A Final Word</h2>

        <div className="mx-auto max-w-2xl space-y-4 text-center text-base">
          <p>
            Not everyone who encounters Ruach is meant to partner—and that's
            okay.
          </p>

          <div className="space-y-2 py-4">
            <p>But if you feel the weight of this work,</p>
            <p>If truth matters more to you than comfort,</p>
            <p>If obedience resonates deeper than consumption,</p>
          </div>

          <p className="text-lg font-semibold">You're welcome to walk with us.</p>

          <div className="space-y-1 pt-4 text-sm opacity-90">
            <p>Not as donors.</p>
            <p>Not as customers.</p>
            <p className="font-semibold">But as co-laborers in truth.</p>
          </div>
        </div>
      </section>

      {/* Trust Footer */}
      <div className="mt-12 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Ruach Ministries is a 501(c)(3) nonprofit organization (EIN:
          33-3149173).
        </p>
        <p className="mt-2">
          All donations are tax-deductible.{" "}
          <LocalizedLink href="/transparency">
            <span className="underline hover:text-zinc-900 dark:hover:text-white">
              View financial reports
            </span>
          </LocalizedLink>
        </p>
      </div>
    </main>
  );
}
