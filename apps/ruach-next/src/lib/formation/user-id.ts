/**
 * Anonymous User ID Management
 *
 * Provides persistent user IDs for anonymous users via cookies
 */

"use server";

import { cookies } from "next/headers";
import { auth } from "@/lib/auth";

const COOKIE_NAME = "ruach_anon_user_id";
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

/**
 * Get or create a persistent user ID for the current session
 * - For logged-in users: returns their user ID
 * - For anonymous users: returns or creates a persistent cookie-based ID
 */
export async function getOrCreateUserId(): Promise<{
  userId: string;
  userIdNumber: number | undefined;
  isAnonymous: boolean;
}> {
  // 1. Check if user is logged in
  const session = await auth();
  if (session?.user?.id) {
    return {
      userId: session.user.id,
      userIdNumber: Number(session.user.id),
      isAnonymous: false,
    };
  }

  // 2. For anonymous users, get or create persistent ID
  const cookieStore = await cookies();
  const existingId = cookieStore.get(COOKIE_NAME)?.value;

  if (existingId) {
    // Cookie exists, return it
    return {
      userId: existingId,
      userIdNumber: undefined,
      isAnonymous: true,
    };
  }

  // 3. Create new anonymous ID and persist to cookie
  const newAnonId = `anon-${crypto.randomUUID()}`;

  cookieStore.set(COOKIE_NAME, newAnonId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return {
    userId: newAnonId,
    userIdNumber: undefined,
    isAnonymous: true,
  };
}

/**
 * Clear the anonymous user ID cookie
 * (Useful when user logs in and we want to merge their anonymous data)
 */
export async function clearAnonymousUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Get the current user ID without creating a new one
 * Returns null if no user is logged in and no anonymous cookie exists
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) {
    return session.user.id;
  }

  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}
