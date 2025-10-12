import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { fetchStrapiMembership, isMembershipActive, type StrapiMembership } from "@/lib/strapi-membership";

type RequireMemberResult = {
  session: Awaited<ReturnType<typeof getServerSession>>;
  jwt: string;
  membership: StrapiMembership;
};

export async function requireActiveMembership(callbackPath: string): Promise<RequireMemberResult> {
  const session = await getServerSession(authOptions as any);
  const jwt = (session as any)?.strapiJwt as string | undefined;

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
