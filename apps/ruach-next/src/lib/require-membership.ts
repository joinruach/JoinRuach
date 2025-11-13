import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchStrapiMembership, isMembershipActive, type StrapiMembership } from "@/lib/strapi-membership";
import type { AuthOptions } from "next-auth";

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

export async function requireActiveMembership(callbackPath: string): Promise<RequireMemberResult> {
  const session = await getServerSession(authOptions as AuthOptions);
  const jwt = (session as ExtendedSession | null)?.strapiJwt;

  if (!jwt) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  const jwtString = jwt!;
  const membership = await fetchStrapiMembership(jwtString);
  if (!isMembershipActive(membership)) {
    const params = new URLSearchParams();
    params.set("required", "membership");
    params.set("redirect", callbackPath);
    redirect(`/members/account?${params.toString()}`);
  }

  return { session, jwt: jwtString, membership: membership! };
}
