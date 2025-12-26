import LocalizedLink from "@/components/navigation/LocalizedLink";
import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Privacy Policy — Ruach Ministries",
  description: "How Ruach Ministries collects, uses, and protects your personal information. Your privacy matters to us.",
  openGraph: {
    title: "Privacy Policy — Ruach Ministries",
    description: "Transparency in how we handle your data and respect your privacy.",
  },
};

export default async function Privacy({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  await params;

  const lastUpdated = "December 2024";

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-zinc-200 bg-white p-10 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <span className="text-xs uppercase tracking-[0.35em] text-zinc-500 dark:text-white/60">Privacy Policy</span>
        <h1 className="mt-4 text-3xl font-semibold text-zinc-900 dark:text-white">
          Your Privacy Matters
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-700 dark:text-white/80">
          At Ruach Ministries, we believe stewardship extends to how we handle your personal information. This Privacy Policy explains what data we collect, how we use it, and how we protect it.
        </p>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          <strong>Last Updated:</strong> {lastUpdated}
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          What Information We Collect
        </h2>
        <div className="mt-6 space-y-4 text-sm text-zinc-700 dark:text-white/80">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Information You Provide</h3>
            <ul className="mt-2 space-y-2 pl-4 text-zinc-600 dark:text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Account Information:</strong> Name, email address, and password when you create an account.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Newsletter Signups:</strong> Email address when you subscribe to our newsletter.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Donations:</strong> Name, email, billing address, and payment details (processed securely by Stripe/Givebutter—we do not store full credit card numbers).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Contact Forms & Messages:</strong> Any information you share when reaching out via email or forms (name, email, message content).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Testimony Submissions:</strong> Stories, names, and media you submit voluntarily (we ask permission before publishing anything publicly).</span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Automatically Collected Information</h3>
            <ul className="mt-2 space-y-2 pl-4 text-zinc-600 dark:text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Usage Data:</strong> Pages visited, content viewed, time spent, device type, browser, and approximate location (city/country level).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Cookies:</strong> Small text files stored on your device to remember preferences, login sessions, and improve site performance. You can disable cookies in your browser settings.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Analytics:</strong> We use privacy-focused analytics tools (like Plausible or similar) to understand site traffic—no personal identifiers are tracked.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          How We Use Your Information
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            We only use your information for legitimate ministry purposes. We will <strong>never</strong> sell, rent, or share your personal data with third parties for marketing purposes.
          </p>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
            <h3 className="font-semibold text-zinc-900 dark:text-white">Specific Uses:</h3>
            <ul className="mt-2 space-y-2 pl-4 text-zinc-600 dark:text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Ministry Communication:</strong> Sending newsletters, course updates, event invitations, and prayer requests (you can unsubscribe anytime).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Donation Receipts:</strong> Providing tax-deductible receipts and stewardship updates for financial partners.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>User Accounts:</strong> Managing logins, saved progress in courses, and personalized content recommendations.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Prayer & Support:</strong> Responding to prayer requests, pastoral questions, and testimony submissions.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 dark:text-amber-300">•</span>
                <span><strong>Improving the Site:</strong> Understanding how people use the platform to make it better, fix bugs, and create more helpful content.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Newsletter & Email Communication
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            When you subscribe to our newsletter, we will send you <strong>1–2 emails per month</strong> with:
          </p>
          <ul className="space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span>New testimonies and featured media</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span>Course launches and discipleship resources</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span>Upcoming events, outreaches, and conferences</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span>Ministry updates and partnership opportunities</span>
            </li>
          </ul>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-300/30 dark:bg-amber-500/10">
            <p className="font-semibold text-amber-900 dark:text-amber-200">
              You can unsubscribe at any time.
            </p>
            <p className="mt-2 text-zinc-700 dark:text-white/80">
              Every email includes an unsubscribe link. Clicking it will immediately remove you from our list. No questions asked. We respect your inbox.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Data Security & Protection
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            We take reasonable measures to protect your personal information from unauthorized access, loss, or misuse:
          </p>
          <ul className="mt-3 space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Encrypted Connections:</strong> All data transmitted between your browser and our site is encrypted using HTTPS/SSL.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Secure Payment Processing:</strong> Donations are processed by Stripe and Givebutter—PCI-compliant platforms. We do not store full credit card numbers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Access Controls:</strong> Only authorized team members can access user data, and they are trained on privacy best practices.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Data Minimization:</strong> We only collect what we need and delete outdated or unnecessary data regularly.</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-zinc-600 dark:text-white/70">
            No system is 100% secure. If a data breach occurs, we will notify affected users promptly and take corrective action.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Third-Party Services
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            We use trusted third-party services to operate Ruach Ministries. These services may collect or process data on our behalf:
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Stripe & Givebutter</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-white/70">
                Payment processing for donations. They handle all credit card data securely.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Email Platform</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-white/70">
                Newsletter delivery and email automation (e.g., ConvertKit, Mailchimp, or similar).
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Analytics</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-white/70">
                Privacy-focused analytics to understand site traffic without invasive tracking.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-white/10 dark:bg-white/5">
              <h3 className="font-semibold text-zinc-900 dark:text-white">Hosting & CDN</h3>
              <p className="mt-2 text-xs text-zinc-600 dark:text-white/70">
                Vercel, AWS, or similar platforms for fast, secure content delivery worldwide.
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-zinc-600 dark:text-white/70">
            These partners are carefully chosen for their privacy practices and security standards. We do not give them permission to use your data for their own purposes.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Your Rights & Choices
        </h2>
        <div className="mt-4 space-y-3 text-sm text-zinc-700 dark:text-white/80">
          <p>
            You have control over your personal information. Here's what you can do:
          </p>
          <ul className="mt-3 space-y-2 pl-4">
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Access:</strong> Request a copy of the data we have about you.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Correct:</strong> Update or fix inaccurate information in your account.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Delete:</strong> Request deletion of your account and associated data (some records may be retained for legal/tax compliance).</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Unsubscribe:</strong> Stop receiving newsletters or marketing emails anytime.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500 dark:text-amber-300">•</span>
              <span><strong>Object:</strong> Ask us to stop processing your data for certain purposes (e.g., marketing).</span>
            </li>
          </ul>
          <p className="mt-4">
            To exercise any of these rights, email <a href="mailto:privacy@joinruach.org" className="underline">privacy@joinruach.org</a> or <a href="mailto:hello@joinruach.org" className="underline">hello@joinruach.org</a>.
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Children's Privacy
        </h2>
        <p className="mt-3 text-sm text-zinc-700 dark:text-white/80">
          Ruach Ministries does not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data without parental consent, please contact us immediately so we can delete it.
        </p>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-8 text-zinc-900 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Changes to This Policy
        </h2>
        <p className="mt-3 text-sm text-zinc-700 dark:text-white/80">
          We may update this Privacy Policy from time to time to reflect changes in our practices, technology, or legal requirements. When we make significant changes, we will:
        </p>
        <ul className="mt-3 space-y-2 pl-4 text-sm text-zinc-700 dark:text-white/80">
          <li className="flex items-start gap-2">
            <span className="text-amber-500 dark:text-amber-300">•</span>
            <span>Update the "Last Updated" date at the top of this page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-amber-500 dark:text-amber-300">•</span>
            <span>Notify you via email or a prominent notice on the site</span>
          </li>
        </ul>
        <p className="mt-3 text-sm text-zinc-700 dark:text-white/80">
          Continued use of the site after changes means you accept the updated policy.
        </p>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center text-zinc-900 shadow-sm dark:border-amber-300/30 dark:bg-amber-500/10 dark:text-white dark:shadow-none">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-white">
          Questions or Concerns?
        </h2>
        <p className="mt-3 text-sm text-zinc-600 dark:text-white/70">
          If you have questions about this Privacy Policy, how we handle your data, or want to exercise your privacy rights, we're here to help.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:privacy@joinruach.org"
            className="inline-block rounded-full bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Email Privacy Team
          </a>
          <LocalizedLink href="/transparency">
            <span className="inline-block rounded-full border border-amber-700 px-6 py-3 text-sm font-semibold text-amber-900 transition hover:bg-amber-100 dark:border-amber-300 dark:text-amber-100 dark:hover:bg-amber-500/20">
              View Financial Transparency
            </span>
          </LocalizedLink>
        </div>
      </section>
    </div>
  );
}
