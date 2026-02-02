import Link from "next/link";
import type { StrapiMembership } from "@/lib/strapi-membership";
import LocalizedLink from "@/components/navigation/LocalizedLink";

type Props = {
  membership: StrapiMembership | null;
  isActive: boolean;
  locale: string;
};

export default function MembershipStatusCard({ membership, isActive, locale }: Props) {
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return null;
    }
  };

  const renewalDate = formatDate(membership?.membershipCurrentPeriodEnd);
  const tier = membership?.membershipTier || membership?.membershipPlanName || "Free";
  const status = isActive ? "Active" : membership?.membershipStatus || "Inactive";

  return (
    <section className="rounded-3xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-white/60">
            Membership
          </h3>
          <p className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-white">{tier}</p>
        </div>
        <div
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isActive
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-zinc-100 text-zinc-600 dark:bg-white/10 dark:text-white/60"
          }`}
        >
          {status}
        </div>
      </div>

      {renewalDate && isActive && (
        <p className="mt-4 text-sm text-zinc-600 dark:text-white/70">
          Renews {renewalDate}
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2">
        <LocalizedLink href="/members/account">
          <span className="inline-flex w-full items-center justify-center rounded-full bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-amber-400">
            Manage Account
          </span>
        </LocalizedLink>

        {!isActive && (
          <LocalizedLink href="/give">
            <span className="inline-flex w-full items-center justify-center rounded-full border border-zinc-300 dark:border-white/20 px-4 py-2.5 text-sm font-semibold text-zinc-700 dark:text-white/80 transition hover:border-zinc-400 dark:hover:border-white/30">
              Become a Partner
            </span>
          </LocalizedLink>
        )}
      </div>
    </section>
  );
}
