import LocalizedLink from "@/components/navigation/LocalizedLink";
import DonationForm from "@ruach/components/components/ruach/DonationForm";
import StripeSubscriptionButtons from "@/components/ruach/StripeSubscriptionButtons";
import TrackedLink from "@/components/ruach/TrackedLink";
import SEOHead from "@/components/ruach/SEOHead";
import DonateCheckoutButton from "@/components/ruach/DonateCheckoutButton";

type GivePageSearchParams = { checkout?: string };

export default async function GivePage({
  searchParams,
}: {
  searchParams?: Promise<GivePageSearchParams | undefined>;
}) {
  const resolvedSearchParams = (await searchParams) ?? {};
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://joinruach.org";
  const membershipPortalHref = "/members/account";
  const isCheckoutCancelled = resolvedSearchParams.checkout === "cancelled";

  const memberResources = [
    {
      title: "Members-Only Posts",
      description: "Get weekly testimonies, prophetic encouragement, and ministry updates crafted exclusively for partners.",
      cta: "Access posts",
      href: "/members/posts",
      eventKey: "posts"
    },
    {
      title: "Members-Only Podcast",
      description: "Stream extended conversations, prayer sets, and behind-the-scenes audio sessions released just for our community.",
      cta: "Listen now",
      href: "/members/podcasts",
      eventKey: "podcasts"
    },
    {
      title: "Members-Only Downloads",
      description: "Download eBooks, study guides, and media files bundled with your plan or offered as standalone partner products.",
      cta: "Browse downloads",
      href: "/members/downloads",
      eventKey: "downloads"
    }
  ] as const;

  const faqItems = [
    {
      question: "Who can access members-only resources?",
      answer: "Any partner signed in with an active subscription can open the full library of posts, podcast episodes, and digital downloads."
    },
    {
      question: "Where do I manage my downloads and standalone purchases?",
      answer: "Log in to the member portal to view every resource you've unlocked, re-download files, and see add-ons available for individual purchase."
    },
    {
      question: "How do I update or cancel my membership?",
      answer: "Visit the membership portal to upgrade plans, update payment methods, or end your subscription without losing access to your receipts."
    }
  ] as const;

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

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-10 text-zinc-900 dark:text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Partner with Ruach</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">Your generosity fuels freedom.</h1>
        <p className="mt-3 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          Every gift helps us produce cinematic testimonies, launch discipleship courses, and fund outreach campaigns that lead people into encounters with Jesus.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <DonateCheckoutButton className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 disabled:opacity-60" />
          <LocalizedLink href="#donate">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Give custom amount
            </span>
          </LocalizedLink>
          <LocalizedLink href="/community-outreach#support">
            <span className="rounded-full border border-zinc-300 dark:border-white/20 px-5 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Sponsor outreach
            </span>
          </LocalizedLink>
        </div>
        </section>

      {isCheckoutCancelled ? (
        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-900 shadow-sm">
          <h3 className="text-lg font-semibold tracking-[0.35em] text-amber-700">Donation paused</h3>
          <p className="mt-2 text-sm text-amber-900/80">
            No charges were made. When you’re ready, try again or reach out to <a className="underline" href="mailto:support@joinruach.org">support@joinruach.org</a> for help completing your gift.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <LocalizedLink href="#donate">
              <span className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
                Try again
              </span>
            </LocalizedLink>
            <LocalizedLink href="/contact">
              <span className="rounded-full border border-amber-700/60 px-5 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100">
                Contact support
              </span>
            </LocalizedLink>
          </div>
        </section>
      ) : null}

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Give through Stripe</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
          Choose an amount, toggle monthly support if you feel led, and we’ll redirect you to Stripe Checkout for secure processing.
          Receipts, matching, and donor catalogs are handled on our side so every gift is tracked and stewarded.
        </p>
        <div className="mt-6 max-w-md">
          <DonationForm campaign="ruach_general" />
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Why Stripe?</h2>
          <p className="text-sm text-zinc-600 dark:text-white/70">
            Stripe keeps every card payment, donation, or subscription PCI-compliant and issues receipts for your records.
            We rely on outing the Stripe checkout link and keep the donation metadata in Strapi so we can divvy funds between media, outreach, and curriculum.
          </p>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-white/70">
            <li>🔒 No card details touch our servers—we redirect directly to Stripe Checkout.</li>
            <li>📑 Receipts and statements are available automatically through Stripe.</li>
            <li>🤝 Ask your employer about matching and share the checkout receipt to double the impact.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white p-6 text-neutral-900 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Memberships & Recurring Support</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Want to go deeper with partner-only content? Use Stripe to start a monthly membership and unlock exclusive resources, or manage your billing anytime.
          </p>
          <div className="mt-4 space-y-3">
            <StripeSubscriptionButtons
              className="w-full"
              orientation="column"
              checkoutLabel="Start monthly giving"
              manageLabel="Manage billing"
              manageVariant="white"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">1</div>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Become a Partner</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">Join our monthly support team for behind-the-scenes updates, exclusive films, and partner-only prayer calls.</p>
          <StripeSubscriptionButtons
            className="mt-4"
            orientation="row"
            checkoutLabel="Set up monthly giving"
            showManage={false}
          />
        </div>
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">2</div>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Sponsor a Course</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">Fund curriculum writing, filming, and translation so the global church can access discipleship for free.</p>
          <LocalizedLink href="/courses">
            <span className="mt-4 inline-flex items-center rounded-full border border-zinc-300 dark:border-white/20 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              View active courses
            </span>
          </LocalizedLink>
        </div>
        <div className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
          <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-white/60">3</div>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900 dark:text-white">Support Outreach</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">Give to meals, supplies, and follow-up discipleship that keeps freedom flowing on the streets.</p>
          <LocalizedLink href="/community-outreach#support">
            <span className="mt-4 inline-flex items-center rounded-full border border-zinc-300 dark:border-white/20 px-4 py-2 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-white hover:text-zinc-900 dark:hover:text-white">
              Fund community outreach
            </span>
          </LocalizedLink>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Members</span>
        <h2 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-white">Unlock partner-only resources</h2>
        <p className="mt-2 max-w-3xl text-sm text-zinc-600 dark:text-white/70">
          Members need to be signed in with an active subscription to access every post, podcast episode, and download in the partner library.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {memberResources.map((resource) => (
            <div key={resource.title} className="flex h-full flex-col rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{resource.title}</h3>
              <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">{resource.description}</p>
              <TrackedLink
                href={resource.href || membershipPortalHref}
                className="mt-auto inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300"
                event="MemberResourceClick"
                eventProps={{ resource: resource.eventKey }}
              >
                {resource.cta}
              </TrackedLink>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-8 text-zinc-900 dark:text-white">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Member FAQ</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-white/70">
          Have questions about accessing your partner perks? Start here, then jump into the portal for the full knowledge base and real-time support.
        </p>
        <div className="mt-6 space-y-4">
          {faqItems.map((item) => (
            <details key={item.question} className="group rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-5 transition hover:border-zinc-300/80 dark:hover:border-white/30">
              <summary className="cursor-pointer text-base font-semibold text-zinc-900 dark:text-white transition group-open:text-amber-300">
                {item.question}
              </summary>
              <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href={membershipPortalHref}>
            <span className="rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-black transition hover:bg-amber-300">
              Sign in to member portal
            </span>
          </LocalizedLink>
          <StripeSubscriptionButtons
            className="flex-shrink-0"
            orientation="row"
            checkoutLabel="Start a membership"
            showManage={false}
          />
        </div>
      </section>
    </div>
  );
}
