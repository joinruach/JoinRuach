import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchStrapiMembership, isMembershipActive, type StrapiMembership } from "@/lib/strapi-membership";
import type { AuthOptions } from "next-auth";
import { defaultLocale } from "@/i18n";

// Extended session type with Strapi JWT
interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

type RequireMemberResult = {
  session: Awaited<ReturnType<typeof getServerSession>>;
  jwt: string;
  membership: StrapiMembership;
};

export async function requireActiveMembership(
  callbackPath: string,
  locale?: string
): Promise<RequireMemberResult> {
  const session = await getServerSession(authOptions as AuthOptions);
  const jwt = (session as ExtendedSession | null)?.strapiJwt;
  const resolvedLocale = locale ?? defaultLocale;
  const localizedCallbackPath = `/${resolvedLocale}${callbackPath}`;
  const loginPath = `/${resolvedLocale}/login`;
  const membersAccountPath = `/${resolvedLocale}/members/account`;

  if (!jwt) {
    redirect(`${loginPath}?callbackUrl=${encodeURIComponent(localizedCallbackPath)}`);
  }

  const jwtString = jwt!;
  const membership = await fetchStrapiMembership(jwtString);
  if (!isMembershipActive(membership)) {
    const params = new URLSearchParams();
    params.set("required", "membership");
    params.set("redirect", localizedCallbackPath);
    redirect(`${membersAccountPath}?${params.toString()}`);
  }

  return { session, jwt: jwtString, membership: membership! };
}
