import Link from "next-intl/link";

export const dynamic = "force-static";

const defaultContacts = [
  {
    title: "Media & Testimonies",
    description: "Have a story of deliverance or healing that will strengthen the Church? Share it with the Ruach Studios team.",
    email: process.env.NEXT_PUBLIC_CONTACT_STORIES_EMAIL ?? "stories@joinruach.org",
  },
  {
    title: "Events & Outreach",
    description: "Invite Ruach to minister at your church, conference, or community outreach. We love serving local leaders.",
    email: process.env.NEXT_PUBLIC_CONTACT_EVENTS_EMAIL ?? "events@joinruach.org",
  },
  {
    title: "Partners & Support",
    description: "Questions about giving, monthly partnership, or logistical support? Our partner care team is ready to help.",
    email: process.env.NEXT_PUBLIC_CONTACT_PARTNERS_EMAIL ?? "partners@joinruach.org",
  },
];

const encouragements = [
  "Ruach Ministries is a 501(c)(3) stewarding testimonies, teaching, and compassion initiatives across the nations.",
  "Every message is prayed over by our team. Let us know how we can stand with you in freedom, deliverance, or discipleship.",
  "If you or someone you know is hungry for transformation, reach out. We believe Jesus is still breathing life today.",
];

export default async function Contact({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  // Await params (Next.js 15 requirement)
  await params;

  const testimonyHref = process.env.NEXT_PUBLIC_TESTIMONY_FORM_URL ?? "mailto:stories@joinruach.org?subject=Testimony%20Submission";
  const isInternalTestimonyLink = testimonyHref.startsWith("/");

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-transparent p-10 text-white shadow-2xl">
        <span className="text-xs uppercase tracking-[0.35em] text-white/60">Connect With Ruach</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Let the breath of God move through your story, city, and community.</h1>
        <p className="mt-4 max-w-2xl text-sm text-white/75">
          Whether you are carrying a testimony, planning an outreach, or needing prayer, our team wants to partner with what the Holy Spirit is doing in your life.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {isInternalTestimonyLink ? (
            <Link href={testimonyHref}>
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
                Submit a testimony →
              </span>
            </Link>
          ) : (
            <a
              href={testimonyHref}
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
            >
              Submit a testimony →
            </a>
          )}
          <a
            href="mailto:hello@joinruach.org"
            className="inline-flex items-center justify-center rounded-full border border-white/20 px-6 py-2 text-sm font-semibold text-white/80 transition hover:border-white hover:text-white"
          >
            Email our team
          </a>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {defaultContacts.map((channel) => (
          <div key={channel.title} className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white">
            <div className="text-sm font-semibold text-white">{channel.title}</div>
            <p className="mt-3 text-sm text-white/70">{channel.description}</p>
            <a
              href={`mailto:${channel.email}`}
              className="mt-5 inline-flex items-center text-sm font-semibold text-amber-300 hover:text-amber-200"
            >
              {channel.email}
            </a>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-white/10 bg-white p-8 text-neutral-900">
          <h2 className="text-2xl font-semibold text-neutral-900">How we can walk with you</h2>
          <p className="text-sm text-neutral-700">
            We respond within a few days to every message. Share as much context as you feel comfortable—our team safeguards sensitive stories with honor and confidentiality.
          </p>
          <ul className="space-y-4 text-sm text-neutral-700">
            <li className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">Share a testimony of deliverance, healing, or salvation that will edify believers worldwide.</li>
            <li className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">Schedule a call about hosting Ruach for regional outreaches, conferences, or training intensives.</li>
            <li className="rounded-2xl border border-neutral-200/70 bg-neutral-50 p-4">Request prayer, pastoral covering, or practical guidance for your church or small group.</li>
          </ul>
        </div>
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
          <h3 className="text-lg font-semibold text-white">What you can expect</h3>
          <div className="mt-4 space-y-4 text-sm text-white/70">
            {encouragements.map((item) => (
              <p key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {item}
              </p>
            ))}
          </div>
          <p className="mt-6 text-sm text-white/60">
            Prefer to share later? Save <span className="text-white">hello@joinruach.org</span> in your contacts so you can reach out anytime.
          </p>
        </aside>
      </section>

      <section className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white">
        <div className="grid gap-6 md:grid-cols-[1fr,1.2fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-white">Partner on mission</h2>
            <p className="mt-3 text-sm text-white/70">
              Your support fuels testimonies, equips disciples, and mobilizes compassion projects across the globe. We would love to connect and dream with you.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link href="/give">
                <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 font-semibold text-black transition hover:bg-amber-300">
                  Give to Ruach
                </span>
              </Link>
              <Link href="/community-outreach">
                <span className="inline-flex items-center justify-center rounded-full border border-white/20 px-5 py-2 font-semibold text-white/80 transition hover:border-white hover:text-white">
                  Join Outreach
                </span>
              </Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
            <h3 className="text-lg font-semibold text-white">Visit or Mail</h3>
            <p className="mt-3">
              Ruach Ministries HQ<br />
              7321 Magnolia Beach Rd.<br />
              Denham Springs, LA 70727
            </p>
            <p className="mt-4">
              Office visits by appointment only. Let us know when you&apos;re coming—we&apos;d love to host you and pray together.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
