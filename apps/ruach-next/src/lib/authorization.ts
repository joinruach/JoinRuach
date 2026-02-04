/**
 * Role-Based Access Control for Ruach Studio
 *
 * Defines roles and permissions for different parts of the application
 */

export type UserRole = 'public' | 'authenticated' | 'partner' | 'studio' | 'admin';

/**
 * Check if a user has studio access
 *
 * TEMPORARY: Currently allows all authenticated users
 * TODO: Configure proper 'studio' and 'admin' roles in Strapi
 *
 * Studio access should be granted to: studio role, admin role
 * But for now we allow: authenticated, partner, studio, admin
 */
export function hasStudioAccess(role?: string): boolean {
  if (!role) return false;

  // TEMPORARY: Allow all authenticated users until roles are configured in Strapi
  const studioRoles: UserRole[] = ['authenticated', 'partner', 'studio', 'admin'];
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
 *
 * Uses /api/users/me for better security (user can only access their own data)
 */
export async function fetchUserRole(
  strapiUrl: string,
  jwt: string,
  userId: string
): Promise<string> {
  try {
    // Try /api/users/me first (more secure, commonly available)
    let response = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    // Fallback to /api/users/:id if /me is not available
    if (!response.ok && response.status === 404) {
      console.log('[Authorization] /api/users/me not available, trying /api/users/:id');
      response = await fetch(`${strapiUrl}/api/users/${userId}?populate=role`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
    }

    if (!response.ok) {
      console.error('[Authorization] Failed to fetch user role:', response.status);
      return 'authenticated'; // Default to basic authenticated role
    }

    const data = await response.json();

    // Strapi can return role in different formats:
    // - role.type (sometimes used for custom roles)
    // - role.name (common for custom roles, as shown in admin UI)
    // We check both and log what we found for debugging
    const roleName = data.role?.type || data.role?.name || 'authenticated';

    console.log('[Authorization] User role fetched:', roleName);
    console.log('[Authorization] Full role object:', JSON.stringify(data.role, null, 2));

    return roleName;
  } catch (error) {
    console.error('[Authorization] Error fetching user role:', error);
    return 'authenticated'; // Default to basic authenticated role on error
  }
}
