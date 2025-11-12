/**
 * Helper functions for fetching Strapi user information
 */
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

const STRAPI = process.env.NEXT_PUBLIC_STRAPI_URL!;

export interface StrapiUser {
  id: number;
  username: string;
  email: string;
  role?: {
    id: number;
    name: string;
    description: string;
    type: string;
  };
}

/**
 * Fetch full user details from Strapi including role information
 * @param jwt - Strapi JWT token
 * @returns User object with role information
 */
export async function fetchStrapiUser(jwt: string): Promise<StrapiUser | null> {
  try {
    const response = await fetch(`${STRAPI}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch Strapi user:", response.status);
      return null;
    }

    const user = await response.json();
    return user as StrapiUser;
  } catch (error) {
    console.error("Error fetching Strapi user:", error);
    return null;
  }
}

/**
 * Check if a user has moderator or admin permissions
 * @param jwt - Strapi JWT token
 * @returns true if user is moderator or admin
 */
export async function isModerator(jwt: string): Promise<boolean> {
  const user = await fetchStrapiUser(jwt);
  if (!user || !user.role) return false;

  const roleName = user.role.name.toLowerCase();
  return roleName === "moderator" || roleName === "admin" || roleName === "super admin";
}

/**
 * Check if a user has a specific role
 * @param jwt - Strapi JWT token
 * @param roleName - Role name to check (case-insensitive)
 * @returns true if user has the specified role
 */
export async function hasRole(jwt: string, roleName: string): Promise<boolean> {
  const user = await fetchStrapiUser(jwt);
  if (!user || !user.role) return false;

  return user.role.name.toLowerCase() === roleName.toLowerCase();
}

/**
 * Convenience helper to pull the current NextAuth session and fetch the Strapi user.
 * Returns null when the visitor is unauthenticated or the Strapi request fails.
 */
export async function getUser(): Promise<StrapiUser | null> {
  const session = await getServerSession(authOptions);
  const jwt = (session as any)?.strapiJwt as string | undefined;
  if (!jwt) return null;
  return fetchStrapiUser(jwt);
}
