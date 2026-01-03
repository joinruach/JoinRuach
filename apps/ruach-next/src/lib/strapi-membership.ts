export const STRAPI_API_URL = process.env.NEXT_PUBLIC_STRAPI_URL!;

export type StrapiMembership = {
  id: number;
  email?: string;
  username?: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  membershipStatus?: string | null;
  membershipPlanName?: string | null;
  membershipTier?: string | null;
  accessLevel?: string | null;
  membershipCurrentPeriodEnd?: string | null;
  membershipStartedAt?: string | null;
  membershipEndedAt?: string | null;
  activeMembership?: boolean;
};

export const ACTIVE_MEMBERSHIP_STATUSES = new Set([
  "trialing",
  "active",
  "past_due",
  "paused",
]);

export function isMembershipActive(membership: StrapiMembership | null | undefined) {
  if (!membership) return false;
  if (membership.activeMembership) return true;
  if (membership.membershipStatus && ACTIVE_MEMBERSHIP_STATUSES.has(membership.membershipStatus)) {
    return true;
  }
  return false;
}

const MEMBERSHIP_FIELDS = [
  "email",
  "username",
  "stripeCustomerId",
  "stripeSubscriptionId",
  "membershipStatus",
  "membershipPlanName",
  "membershipTier",
  "accessLevel",
  "membershipCurrentPeriodEnd",
  "membershipStartedAt",
  "membershipEndedAt",
  "activeMembership",
] as const;

export async function fetchStrapiMembership(jwt: string | undefined): Promise<StrapiMembership | null> {
  if (!jwt) return null;

  const params = new URLSearchParams();
  MEMBERSHIP_FIELDS.forEach((field, index) => {
    params.set(`fields[${index}]`, field);
  });

  const res = await fetch(`${STRAPI_API_URL}/api/users/me?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as StrapiMembership;
}
