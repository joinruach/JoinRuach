// apps/ruach-next/src/app/[locale]/impact/page.tsx
import type { Metadata } from "next";
import LocalizedLink from "@/components/navigation/LocalizedLink";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Impact & Stories — Ruach Ministries",
  description:
    "See the fruit of obedience. Real stories of transformation, testimonies published, outreach campaigns, and lives reached through Ruach Ministries.",
  openGraph: {
    title: "Impact & Stories — Ruach Ministries",
    description:
      "Witness the fruit of faithful obedience—transformed lives, testimonies, and Kingdom impact across the globe.",
  },
};

// PLACEHOLDER: Update these metrics annually
const IMPACT_METRICS = [
  {
    value: "250+",
    label: "Testimonies Published",
    description: "Stories of transformation captured and shared",
  },
  {
    value: "50K+",
    label: "People Reached",
    description: "Through media, outreach, and discipleship",
  },
  {
    value: "20+",
    label: "Outreach Campaigns",
    description: "Street evangelism, city-wide initiatives",
  },
  {
    value: "1,500+",
    label: "Disciples Equipped",
    description: "Through courses, teaching, and mentorship",
  },
];

// PLACEHOLDER: Replace with real impact stories (photos, names with consent)
const FEATURED_STORIES = [
  {
    title: "From Addiction to Freedom",
    location: "Los Angeles, CA",
    summary:
      "After 15 years of addiction, Marcus encountered Christ through a Ruach street outreach. Today, he leads a recovery ministry and disciples other men walking out of bondage.",
    quote:
      "I wasn't looking for God—but He was looking for me. The team from Ruach didn't preach at me. They prayed with me, listened, and came back every week. That consistency broke me.",
    image: "/placeholder-story-1.jpg",
    attribution: "— Marcus T., Los Angeles",
  },
  {
    title: "A Church Awakened",
    location: "Austin, TX",
    summary:
      "Grace Community Church partnered with Ruach to launch their first evangelism training. Within six months, 40+ salvations and a culture shift toward outreach over events.",
    quote:
      "Ruach didn't just train us—they showed us what bold, Spirit-led evangelism looks like. Our people went from scared to expectant.",
    image: "/placeholder-story-2.jpg",
    attribution: "— Pastor David R., Austin",
  },
  {
    title: "Identity Restored",
    location: "Online / Global",
    summary:
      "Sarah discovered Ruach's teaching on identity in Christ after years of performance-driven faith. She now mentors other women in freedom from religious performance.",
    quote:
      "I spent a decade trying to earn God's love through ministry. Ruach's teaching on Bride identity shattered that lie. I finally understand what it means to be loved, not used.",
    image: "/placeholder-story-3.jpg",
    attribution: "— Sarah K., Global",
  },
  {
    title: "Campus Revival",
    location: "Phoenix, AZ",
    summary:
      "A Ruach-trained student launched a weekly testimony night on campus. Over 100 students attended in the first semester, with 12 salvations and ongoing discipleship.",
    quote:
      "I didn't know how to start. Ruach gave me the tools, the courage, and the scriptural foundation to step out. Now it's not just me—it's a movement.",
    image: "/placeholder-story-4.jpg",
    attribution: "— Jordan M., Phoenix",
  },
];

// PLACEHOLDER: Update with actual regions/cities
const GEOGRAPHIC_REACH = [
  { region: "North America", cities: ["Los Angeles", "Austin", "Phoenix", "New York", "Atlanta"] },
  { region: "Europe", cities: ["London", "Berlin", "Amsterdam"] },
  { region: "Asia Pacific", cities: ["Manila", "Singapore", "Seoul"] },
  { region: "Latin America", cities: ["Mexico City", "São Paulo", "Bogotá"] },
];

export default function ImpactPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      {/* Hero Section */}
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Impact & Stories
        </h1>
        <p className="mt-4 text-lg text-zinc-700 dark:text-zinc-300">
          This is the fruit of obedience.
        </p>
        <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
          Not our achievement, but His faithfulness working through willing
          partners.
        </p>
      </header>

      {/* Annual Metrics */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none sm:p-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            2024 Summary
          </h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            A humble accounting of what God has done
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="text-center"
            >
              <div className="text-4xl font-bold text-amber-500">
                {metric.value}
              </div>
              <div className="mt-2 text-sm font-semibold text-zinc-900 dark:text-white">
                {metric.label}
              </div>
              <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                {metric.description}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm italic text-zinc-600 dark:text-zinc-400">
          "Unless the Lord builds the house, the builders labor in vain." —
          Psalm 127:1
        </p>
      </section>

      {/* Featured Impact Stories */}
      <section className="mb-16">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Stories of Transformation
          </h2>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            Real people. Real encounters. Real fruit.
          </p>
        </div>

        <div className="space-y-8">
          {FEATURED_STORIES.map((story, index) => (
            <article
              key={index}
              className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none overflow-hidden"
            >
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Story Image - PLACEHOLDER */}
                <div className="lg:col-span-1">
                  <div className="h-64 w-full bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center lg:h-full">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      [Photo: {story.title}]
                    </span>
                  </div>
                </div>

                {/* Story Content */}
                <div className="lg:col-span-2 p-6 lg:p-8">
                  <div className="mb-3">
                    <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">
                      {story.title}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {story.location}
                    </p>
                  </div>

                  <p className="mb-4 text-base text-zinc-700 dark:text-zinc-300">
                    {story.summary}
                  </p>

                  <blockquote className="border-l-4 border-amber-500 pl-4 italic text-zinc-700 dark:text-zinc-300">
                    "{story.quote}"
                  </blockquote>

                  <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                    {story.attribution}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
          {/* PLACEHOLDER: Remove when real stories with photos/consent are added */}
          Note: Story details and images are placeholders pending participant
          consent and photography.
        </p>
      </section>

      {/* Geographic Reach */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-zinc-50 p-8 dark:border-white/10 dark:bg-zinc-900/50 sm:p-12">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
            Where We've Been Sent
          </h2>
          <p className="mt-2 text-base text-zinc-600 dark:text-zinc-400">
            God is raising up a global movement
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {GEOGRAPHIC_REACH.map((area) => (
            <div
              key={area.region}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-white/10 dark:bg-white/5"
            >
              <h3 className="mb-3 font-semibold text-zinc-900 dark:text-white">
                {area.region}
              </h3>
              <ul className="space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
                {area.cities.map((city) => (
                  <li key={city} className="flex items-center gap-2">
                    <span className="text-amber-500">•</span>
                    <span>{city}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Online reach extends globally through media, courses, and testimony distribution.
        </p>
      </section>

      {/* How You Can Participate */}
      <section className="mb-16 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none sm:p-12">
        <h2 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-white">
          Join the Work
        </h2>

        <p className="mb-8 text-center text-base text-zinc-700 dark:text-zinc-300">
          You're not meant to just observe. You're invited to participate.
        </p>

        <div className="grid gap-6 sm:grid-cols-3">
          <LocalizedLink href="/partners">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <div className="mb-3 text-3xl">🤝</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Become a Partner
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Walk with us in sustained prayer and support
              </p>
            </div>
          </LocalizedLink>

          <LocalizedLink href="/community-outreach">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <div className="mb-3 text-3xl">🌍</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Join an Outreach
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Step into the streets and see God move
              </p>
            </div>
          </LocalizedLink>

          <LocalizedLink href="/contact">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 text-center transition hover:border-zinc-300 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20 dark:hover:bg-white/10">
              <div className="mb-3 text-3xl">📖</div>
              <h3 className="mb-2 font-semibold text-zinc-900 dark:text-white">
                Share Your Testimony
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your story could set someone free
              </p>
            </div>
          </LocalizedLink>
        </div>
      </section>

      {/* Final Word */}
      <section className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-900 to-zinc-800 p-8 text-center text-white dark:border-white/10 dark:from-white dark:to-zinc-100 dark:text-zinc-900 sm:p-12">
        <h2 className="mb-4 text-2xl font-semibold">
          This Is Just the Beginning
        </h2>
        <p className="mx-auto max-w-2xl text-base">
          Every story you just read started with one person saying "yes" to
          God's leading. The question is not whether He's calling—it's whether
          you'll respond.
        </p>
        <p className="mt-4 text-sm opacity-90">
          "The harvest is plentiful, but the workers are few." — Matthew 9:37
        </p>

        <div className="mt-6">
          <LocalizedLink href="/partners">
            <span className="inline-block rounded-full bg-white px-8 py-3 text-sm font-semibold text-zinc-900 transition hover:opacity-90 dark:bg-zinc-900 dark:text-white">
              Walk With Us
            </span>
          </LocalizedLink>
        </div>
      </section>

      {/* Transparency Link */}
      <div className="mt-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          Want to see how partnership dollars are stewarded?{" "}
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
