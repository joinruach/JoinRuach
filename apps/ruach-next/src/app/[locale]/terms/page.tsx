import LocalizedLink from "@/components/navigation/LocalizedLink";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service — Ruach Ministries",
  description: "Terms that govern donations, memberships, and digital content from Ruach Ministries.",
  openGraph: {
    title: "Terms of Service — Ruach Ministries",
    description: "How Ruach Ministries serves you through donations, memberships, and digital courses.",
  },
};

export default async function Terms({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const lastUpdated = "December 2024";

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Terms of Service</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">
          Welcome to Ruach Ministries
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          These Terms govern your use of joinruach.org, including donations, memberships, and digital course access. By engaging with our platform, you agree to partner with the values, practices, and expectations described below.
        </p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          <strong>Last Updated:</strong> {lastUpdated}
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          1. Our Services
        </h2>
        <p className="mt-4 text-sm text-zinc-700 dark:text-white/80">
          Ruach Ministries is a 501(c)(3) nonprofit. We provide prophetic media, discipleship content, community memberships known as "Builders", and educational courses for spiritual growth worldwide.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          2. Payments & Billing (Stripe)
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            All financial transactions are processed securely through Stripe. We never retain full credit card data on our servers.
          </p>
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Donations:</strong> One-time and recurring gifts are voluntary expressions of support.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Memberships:</strong> Signing up for a tier authorizes recurring charges until you cancel.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Courses:</strong> One-time purchases grant access to the content defined at checkout.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Security:</strong> Payment information is handled by Stripe (PCI-DSS compliant).</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          3. Refunds & Cancellations
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            Donations and purchases support ministry operations, so refunds are limited. Reach out promptly if a technical error occurs.
          </p>
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Donations:</strong> Generally non-refundable; contact <a href="mailto:support@joinruach.org" className="underline">support@joinruach.org</a> within 7 days for duplicate charges or errors.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Memberships:</strong> Cancel anytime through the Stripe Customer Portal; your access stays active until the end of the billing period without prorated refunds.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Courses:</strong> Digital content is final sale once accessed or downloaded.</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          4. Digital Access & Accounts
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Account Responsibility:</strong> Safeguard credentials; access is limited to the individual account holder.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Revocation:</strong> We may revoke access to Builders or courses for policy violations (harassment, piracy, unauthorized sharing).</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          5. Intellectual Property
        </h2>
        <p className="mt-4 text-sm text-zinc-700 dark:text-white/80">
          All videos, PDFs, prophetic teachings, and course materials belong to Ruach Ministries. Your membership or purchase grants a limited, non-transferable license for personal use only. Recording, redistributing, or reselling our content is prohibited without written permission.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          6. Ministry Disclaimer
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p><strong>Spiritual Nature:</strong> Our content equips and encourages believers through prophetic media and teaching.</p>
          <p><strong>Not Professional Advice:</strong> Pastoral care is not a substitute for medical, legal, or psychological counsel—seek licensed professionals in crises.</p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          7. Limitation of Liability
        </h2>
        <p className="mt-4 text-sm text-zinc-700 dark:text-white/80">
          Ruach Ministries and its team are not liable for indirect, incidental, or consequential damages arising from your use of the site or reliance on ministry content. The platform is provided "as-is."
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          8. Governing Law
        </h2>
        <p className="mt-4 text-sm text-zinc-700 dark:text-white/80">
          These Terms are governed by the laws of the United States and the state of Louisiana.
        </p>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Need Assistance?
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          Email <a href="mailto:support@joinruach.org" className="underline">support@joinruach.org</a> or visit our <LocalizedLink href="/contact"><span className="text-amber-900 dark:text-amber-100">contact page</span></LocalizedLink> for help with payments, access, or account questions.
        </p>
      </section>
    </div>
  );
}
