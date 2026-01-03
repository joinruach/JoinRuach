"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fetchStrapiMembership, STRAPI_API_URL } from "@/lib/strapi-membership";
import { defaultLocale } from "@/i18n";

interface ExtendedSession {
  strapiJwt?: string;
  [key: string]: unknown;
}

async function hasCourseLicense(courseSlug: string, userId: number, jwt: string) {
  const params = new URLSearchParams({
    "filters[courseSlug][$eq]": courseSlug,
    "filters[user][id][$eq]": String(userId),
    "pagination[pageSize]": "1",
  });

  const res = await fetch(`${STRAPI_API_URL}/api/course-licenses?${params.toString()}`, {
    headers: { Authorization: `Bearer ${jwt}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return false;
  }

  const json = await res.json();
  if (Array.isArray(json?.data) && json.data.length > 0) {
    return true;
  }

  const total = json?.meta?.pagination?.total;
  if (typeof total === "number" && total > 0) {
    return true;
  }

  return false;
}

export async function requireCourseLicense(
  courseSlug: string,
  callbackPath: string,
  locale?: string
) {
  const resolvedLocale = locale ?? defaultLocale;
  const session = await auth();
  const jwt = (session as ExtendedSession | null)?.strapiJwt;
  const localizedCallbackPath = `/${resolvedLocale}${callbackPath}`;
  const loginPath = `/${resolvedLocale}/login`;

  if (!jwt) {
    redirect(`${loginPath}?callbackUrl=${encodeURIComponent(localizedCallbackPath)}`);
  }

  const membership = await fetchStrapiMembership(jwt);
  const userId = membership?.id;
  if (!userId) {
    redirect(`${loginPath}?callbackUrl=${encodeURIComponent(localizedCallbackPath)}`);
  }

  const hasLicense = await hasCourseLicense(courseSlug, userId, jwt);
  if (!hasLicense) {
    const coursePath = `/${resolvedLocale}/courses/${courseSlug}`;
    redirect(`${coursePath}?required=license`);
  }

  return { session, jwt, membership };
}

