import LocalizedLink from "@/components/navigation/LocalizedLink";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Financial Transparency — Ruach Ministries",
  description: "How Ruach Ministries stewards your partnership. Annual reports, governance structure, and financial accountability.",
  openGraph: {
    title: "Financial Transparency — Ruach Ministries",
    description: "See how your partnership fuels media, discipleship, and outreach worldwide.",
  },
};

export default async function Transparency({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  // TODO: Update this date when financial information changes
  const lastUpdated = "December 2024";
  // TODO: Replace with actual EIN number
  const ein = "33-3149173";

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Financial Transparency</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">Stewarding Your Partnership with Integrity</h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          Ruach Ministries is a <strong>501(c)(3) nonprofit organization</strong> committed to biblical stewardship and financial accountability. Every dollar you give fuels testimonies, equips disciples, and mobilizes outreach teams worldwide.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <p className="text-sm text-zinc-600 dark:text-white/70">
            <strong>EIN:</strong> {ein}
          </p>
          <span className="text-zinc-300 dark:text-white/20">•</span>
          <p className="text-sm text-zinc-600 dark:text-white/70">
            <strong>Last Updated:</strong> {lastUpdated}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <LocalizedLink href="/give">
            <span className="inline-block rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-400">
              Become a Partner
            </span>
          </LocalizedLink>
          <a
            href="mailto:partners@joinruach.org"
            className="inline-block rounded-full border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:border-zinc-400 dark:border-white/20 dark:text-white/90 dark:hover:border-white/40"
          >
            Contact Partners Team
          </a>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">How We Use Your Gifts</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          Your partnership directly supports three core ministry areas:
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="mb-3 text-3xl font-bold text-amber-600 dark:text-amber-400">40%</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Media & Content</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Producing testimonies, courses, and prophetic media that equip believers worldwide. Includes filming, editing, platform hosting, and distribution.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="mb-3 text-3xl font-bold text-amber-600 dark:text-amber-400">35%</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Formation Systems & Discipleship</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Building Scripture-rooted formation pathways that guide believers into truth, discernment, and mature obedience. Includes curriculum development, formation frameworks, platform development, and the systems required to sustain long-term spiritual growth.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
            <div className="mb-3 text-3xl font-bold text-amber-600 dark:text-amber-400">25%</div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Operations & Team</h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-white/70">
              Supporting staff salaries, technology infrastructure, legal compliance, and administrative overhead to sustain long-term ministry effectiveness.
            </p>
          </div>
        </div>
        <p className="mt-6 text-xs text-zinc-500 dark:text-white/60">
          Percentages are approximate and reflect annual averages. Actual allocation may vary based on seasonal ministry priorities and donor designations.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Annual Reports</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
            Each year we publish a summary of income, expenses, and ministry impact. These reports demonstrate how your partnership advances the Kingdom.
          </p>
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">2024 Annual Report</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-white/60">Coming Soon</div>
                </div>
                <button disabled className="rounded-full bg-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-500 dark:bg-white/10 dark:text-white/50">
                  Download PDF
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-zinc-900 dark:text-white">2023 Annual Report</div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-white/60">Available for download</div>
                </div>
                <a
                  href="#"
                  className="rounded-full bg-amber-500 px-4 py-2 text-xs font-semibold text-black transition hover:bg-amber-400"
                >
                  Download PDF
                </a>
              </div>
            </div>
          </div>
          <p className="mt-6 text-xs text-zinc-500 dark:text-white/60">
            Need older reports or detailed financial statements? Email <a href="mailto:partners@joinruach.org" className="underline">partners@joinruach.org</a>
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Governance & Accountability</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
            Ruach Ministries operates under a board of directors who provide spiritual oversight, financial accountability, and strategic guidance.
          </p>
          <div className="mt-6 space-y-4 text-sm text-zinc-700 dark:text-white/70">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <strong className="text-zinc-900 dark:text-white">Board of Directors</strong>
              <p className="mt-2">
                Our board meets quarterly to review finances, approve budgets, and ensure alignment with our mission and biblical values.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <strong className="text-zinc-900 dark:text-white">Independent Review</strong>
              <p className="mt-2">
                Annual financial statements are reviewed by an independent CPA to verify accuracy and compliance with nonprofit standards.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <strong className="text-zinc-900 dark:text-white">Conflict of Interest Policy</strong>
              <p className="mt-2">
                All staff and board members disclose potential conflicts annually and recuse themselves from decisions where conflicts exist.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Donation Policy</h2>
        <div className="mt-4 space-y-4 text-sm text-zinc-700 dark:text-white/70">
          <p>
            <strong className="text-zinc-900 dark:text-white">All gifts are tax-deductible.</strong> Ruach Ministries is recognized by the IRS as a 501(c)(3) public charity. You will receive a receipt for all donations for tax purposes.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Donor privacy.</strong> We never sell, rent, or share donor information with third parties. Your personal data is protected and used solely for ministry communication and tax receipts.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Designated vs. general giving.</strong> Unless you specify otherwise, all gifts are used for general ministry operations at the discretion of leadership. If you designate a gift for a specific project and funds exceed the need, we reserve the right to redirect excess funds to similar ministry efforts.
          </p>
          <p>
            <strong className="text-zinc-900 dark:text-white">Refunds.</strong> All gifts are final. If you believe an error occurred, contact <a href="mailto:partners@joinruach.org" className="underline">partners@joinruach.org</a> within 30 days.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">Questions?</h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          If you have questions about our finances, governance, or how your partnership is being stewarded, we want to answer them clearly and directly.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:partners@joinruach.org"
            className="inline-block rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Email Partners Team
          </a>
          <LocalizedLink href="/give">
            <span className="inline-block rounded-full border border-amber-700 px-6 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-300 dark:text-amber-100 dark:hover:bg-amber-500/20">
              Become a Partner
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
