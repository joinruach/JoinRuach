/**
 * Role-Based Access Control for Ruach Studio
 *
 * Defines roles and permissions for different parts of the application
 */

export type UserRole = 'public' | 'authenticated' | 'partner' | 'studio' | 'admin';

/**
 * Check if a user has studio access
 * Studio access is granted to: studio role, admin role
 */
export function hasStudioAccess(role?: string): boolean {
  if (!role) return false;

  const studioRoles: UserRole[] = ['studio', 'admin'];
  return studioRoles.includes(role as UserRole);
}

/**
 * Check if a user has admin access
 */
export function hasAdminAccess(role?: string): boolean {
  if (!role) return false;
  return role === 'admin';
}

/**
 * Check if a user is authenticated (any logged-in user)
 */
export function isAuthenticated(role?: string): boolean {
  return !!role && role !== 'public';
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role?: string): string {
  const roleNames: Record<string, string> = {
    public: 'Guest',
    authenticated: 'Member',
    partner: 'Partner',
    studio: 'Studio Staff',
    admin: 'Administrator',
  };

  return roleNames[role || 'public'] || 'Unknown';
}

/**
 * Fetch user role from Strapi using JWT token
 * This is used during login to get the user's role
 */
export async function fetchUserRole(
  strapiUrl: string,
  jwt: string,
  userId: string
): Promise<string> {
  try {
    const response = await fetch(`${strapiUrl}/api/users/${userId}?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    if (!response.ok) {
      console.error('[Authorization] Failed to fetch user role:', response.status);
      return 'authenticated'; // Default to basic authenticated role
    }

    const data = await response.json();

    // Strapi returns role in the format: { role: { type: 'studio' } }
    const roleName = data.role?.type || data.role?.name || 'authenticated';

    console.log('[Authorization] User role fetched:', roleName);

    return roleName;
  } catch (error) {
    console.error('[Authorization] Error fetching user role:', error);
    return 'authenticated'; // Default to basic authenticated role on error
  }
}
