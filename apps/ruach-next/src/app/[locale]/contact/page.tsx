import LocalizedLink from "@/components/navigation/LocalizedLink";
import ContactForm from "./ContactForm";

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
      <section className="rounded-3xl border border-border bg-card p-10 text-foreground shadow-[0_30px_90px_rgba(43,37,30,0.08)]">
        <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">Connect With Ruach</span>
        <h1 className="mt-4 text-3xl font-semibold sm:text-4xl">Let the breath of God move through your story, city, and community.</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Whether you are carrying a testimony, planning an outreach, or needing prayer, our team wants to partner with what the Holy Spirit is doing in your life.
        </p>
      </section>

      {/* Intent-Based Contact Form */}
      <section>
        <ContactForm />
      </section>

      {/* Direct Contact Options (Fallback) */}
      <section className="rounded-3xl border border-border bg-muted/60 p-8 text-center">
        <h2 className="text-lg font-semibold text-foreground">Prefer Email?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You can also reach us directly at:
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
          {defaultContacts.map((channel) => (
            <a
              key={channel.email}
              href={`mailto:${channel.email}`}
              className="inline-flex items-center font-semibold text-foreground underline decoration-[hsl(var(--primary))] decoration-2 underline-offset-4"
            >
              {channel.email}
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
        <div className="space-y-4 rounded-3xl border border-border bg-card p-8 text-foreground">
          <h2 className="text-2xl font-semibold text-foreground">How we can walk with you</h2>
          <p className="text-sm text-muted-foreground">
            We respond within a few days to every message. Share as much context as you feel comfortable—our team safeguards sensitive stories with honor and confidentiality.
          </p>
          <ul className="space-y-4 text-sm text-muted-foreground">
            <li className="rounded-2xl border border-border bg-muted/60 p-4">Share a testimony of deliverance, healing, or salvation that will edify believers worldwide.</li>
            <li className="rounded-2xl border border-border bg-muted/60 p-4">Schedule a call about hosting Ruach for regional outreaches, conferences, or training intensives.</li>
            <li className="rounded-2xl border border-border bg-muted/60 p-4">Request prayer, pastoral covering, or practical guidance for your church or small group.</li>
          </ul>
        </div>
        <aside className="rounded-3xl border border-border bg-muted/60 p-8 text-foreground">
          <h3 className="text-lg font-semibold text-foreground">What you can expect</h3>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            {encouragements.map((item) => (
              <p key={item} className="rounded-2xl border border-border bg-card p-4">
                {item}
              </p>
            ))}
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            Prefer to share later? Save <span className="text-foreground">hello@joinruach.org</span> in your contacts so you can reach out anytime.
          </p>
        </aside>
      </section>

      <section className="rounded-3xl border border-border bg-card p-8 text-foreground">
        <div className="grid gap-6 md:grid-cols-[1fr,1.2fr] md:items-center">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Partner on mission</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Your support fuels testimonies, equips disciples, and mobilizes compassion projects across the globe. We would love to connect and dream with you.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <LocalizedLink href="/partners">
                <span className="inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] px-5 py-2 font-semibold text-[hsl(var(--primary-foreground))] transition hover:bg-[#C7A574]">
                  Become a Partner
                </span>
              </LocalizedLink>
              <LocalizedLink href="/community-outreach">
                <span className="inline-flex items-center justify-center rounded-full border border-border px-5 py-2 font-semibold text-foreground transition hover:bg-[rgba(43,43,43,0.05)]">
                  Join Outreach
                </span>
              </LocalizedLink>
            </div>
          </div>
          <div className="rounded-3xl border border-border bg-muted/60 p-6 text-sm text-muted-foreground">
            <h3 className="text-lg font-semibold text-foreground">Visit or Mail</h3>
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
