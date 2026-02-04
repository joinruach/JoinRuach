# Studio Authorization System

## Overview

The Ruach Studio application implements role-based access control (RBAC) to restrict access to authorized employees and studio-approved users only. This system provides defense-in-depth with multiple layers of protection.

## Architecture

### Authorization Layers

1. **Middleware** (`/src/middleware.ts`)
   - First line of defense
   - Runs before any page is rendered
   - Checks authentication and role-based access
   - Redirects unauthorized users immediately

2. **Layout Protection** (`/src/app/[locale]/studio/layout.tsx`)
   - Second layer of defense
   - Server-side check in React Server Component
   - Ensures authorization even if middleware is bypassed

3. **Type Safety** (`/src/types/next-auth.d.ts`)
   - TypeScript definitions for role and userId fields
   - Compile-time safety for role checks

## User Roles

Roles are defined in `/src/lib/authorization.ts`:

```typescript
type UserRole = 'public' | 'authenticated' | 'partner' | 'studio' | 'admin';
```

### Role Hierarchy

- **public** - Anonymous/guest users
- **authenticated** - Logged-in users (basic access)
- **partner** - Ministry partners
- **studio** - Studio staff members ✅ **Has studio access**
- **admin** - Administrators ✅ **Has studio access**

## Studio Access Requirements

Only users with **studio** or **admin** roles can access `/studio` routes.

### Access Check Function

```typescript
function hasStudioAccess(role?: string): boolean {
  if (!role) return false;
  const studioRoles: UserRole[] = ['studio', 'admin'];
  return studioRoles.includes(role as UserRole);
}
```

## Authentication Flow

### 1. Login Process

When a user logs in via `/login`:

1. Credentials sent to Strapi `/api/auth/login`
2. On success, Strapi returns JWT and user info
3. `fetchUserRole()` calls Strapi to get user's role
4. Role stored in NextAuth session and JWT token

**Code Location:** `/src/lib/auth.ts` - `authorize()` callback

```typescript
// After successful Strapi login
const userRole = await fetchUserRole(STRAPI, jwt, userId);
return {
  id: userId,
  email: email,
  strapiJwt: jwt,
  role: userRole, // Stored in session
  userId: userId,
};
```

### 2. Session Storage

Role information flows through NextAuth:

- **JWT Token** - Encrypted, stored in httpOnly cookie
- **Session Object** - Available to application via `auth()`

**Code Location:** `/src/lib/auth.ts` - callbacks

```typescript
// jwt() callback - Store role in token
if (user) {
  return {
    ...token,
    role: extendedUser.role,
    userId: extendedUser.userId,
  };
}

// session() callback - Expose role to application
return {
  ...session,
  role: typedToken.role,
  userId: typedToken.userId,
};
```

### 3. Authorization Check

On every request to `/studio/*`:

1. **Middleware runs first**
   - Checks if session exists
   - Checks if user has studio role
   - Redirects if unauthorized

2. **Layout runs second**
   - Additional server-side check
   - Same role verification
   - Fallback if middleware is bypassed

## User Experience

### Authorized User (studio/admin)

```
User logs in → Role: 'studio' → Access granted → Studio Dashboard
```

### Unauthorized User (authenticated/partner)

```
User logs in → Role: 'authenticated'
    ↓
Visits /studio → Middleware blocks → Redirect to /unauthorized
    ↓
Sees error page with:
  - "Studio Access Required" message
  - Current user email and role
  - Link to return home
  - Link to contact support
```

### Unauthenticated User

```
Visits /studio → Middleware blocks → Redirect to /login?callbackUrl=/studio
    ↓
After login:
  - If has studio role → Access granted
  - If no studio role → Redirect to /unauthorized
```

## Strapi Configuration

### Required Setup

1. **User-Permissions Plugin**
   - Must be enabled in Strapi
   - Provides user roles and authentication

2. **Custom Roles**
   - Create custom roles in Strapi admin:
     - `studio` - For staff members
     - `admin` - For administrators
   - Roles stored in `role.type` or `role.name` field

3. **API Endpoint**
   - Must support: `GET /api/users/:id?populate=role`
   - Returns user with populated role field

### Role Structure

Strapi returns role in this format:

```json
{
  "id": 1,
  "email": "staff@joinruach.org",
  "role": {
    "id": 3,
    "name": "Studio Staff",
    "type": "studio"
  }
}
```

The authorization system uses `role.type` or falls back to `role.name`.

## Security Considerations

### Defense in Depth

Multiple layers ensure security even if one layer fails:
- Middleware (edge protection)
- Layout check (server-side verification)
- Type safety (compile-time checks)

### Token Security

- JWT tokens encrypted and httpOnly
- Tokens expire after 1 hour
- Refresh tokens stored in httpOnly cookies
- Role information included in encrypted token

### Fail-Safe Defaults

- Unknown roles default to 'authenticated' (no studio access)
- Missing role defaults to no access
- API failures default to 'authenticated' role

## Testing

### Test Different User Roles

1. **Create test users in Strapi:**
   - user1@test.com - Role: 'authenticated'
   - user2@test.com - Role: 'studio'
   - user3@test.com - Role: 'admin'

2. **Test access patterns:**
   ```
   Login as user1 → Visit /studio → Should see unauthorized page
   Login as user2 → Visit /studio → Should see dashboard
   Login as user3 → Visit /studio → Should see dashboard
   ```

3. **Check console logs:**
   ```
   [Auth] Login successful for user: 1
   [Auth] User role determined: studio
   [Authorization] User role fetched: studio
   ```

### Verify Middleware

Check that middleware blocks unauthorized access:
```bash
# Should redirect to /unauthorized
curl -L http://localhost:3000/en/studio \
  -H "Cookie: next-auth.session-token=<authenticated-user-token>"
```

## Troubleshooting

### User Can't Access Studio

1. **Check user role in Strapi:**
   - Go to Strapi admin → Users
   - Edit user → Verify role is 'studio' or 'admin'

2. **Check console logs:**
   - Look for `[Auth] User role determined: <role>`
   - Should show 'studio' or 'admin'

3. **Verify Strapi API:**
   ```bash
   curl http://localhost:1337/api/users/:id?populate=role \
     -H "Authorization: Bearer <jwt>"
   ```

### Middleware Not Working

1. **Check matcher config** in `/src/middleware.ts`
2. **Verify middleware is enabled** in `next.config.js`
3. **Check console for middleware errors**

### Role Not Persisting

1. **Clear NextAuth cookies** and re-login
2. **Check JWT token** includes role field
3. **Verify session callback** returns role

## API Reference

### Authorization Functions

Located in `/src/lib/authorization.ts`:

#### `hasStudioAccess(role?: string): boolean`

Check if user has studio access (studio or admin role).

```typescript
import { hasStudioAccess } from '@/lib/authorization';

const canAccess = hasStudioAccess(session.role);
```

#### `hasAdminAccess(role?: string): boolean`

Check if user has admin access (admin role only).

```typescript
import { hasAdminAccess } from '@/lib/authorization';

const isAdmin = hasAdminAccess(session.role);
```

#### `isAuthenticated(role?: string): boolean`

Check if user is logged in (any role except 'public').

```typescript
import { isAuthenticated } from '@/lib/authorization';

const loggedIn = isAuthenticated(session.role);
```

#### `getRoleName(role?: string): string`

Get user-friendly role name for display.

```typescript
import { getRoleName } from '@/lib/authorization';

const displayName = getRoleName(session.role);
// Returns: "Studio Staff", "Administrator", etc.
```

#### `fetchUserRole(strapiUrl: string, jwt: string, userId: string): Promise<string>`

Fetch user's role from Strapi API (used during login).

```typescript
import { fetchUserRole } from '@/lib/authorization';

const role = await fetchUserRole(STRAPI_URL, jwt, userId);
```

## Future Enhancements

### Granular Permissions

Current system uses role-based access. Consider adding permission-based access for finer control:

```typescript
type Permission =
  | 'render_pipeline:view'
  | 'render_pipeline:create'
  | 'render_pipeline:delete'
  | 'content:publish';

function hasPermission(role: string, permission: Permission): boolean {
  // Check if role has specific permission
}
```

### Audit Logging

Log all authorization decisions:
```typescript
function hasStudioAccess(role?: string): boolean {
  const hasAccess = studioRoles.includes(role as UserRole);
  auditLog({
    action: 'studio_access_check',
    role,
    result: hasAccess,
    timestamp: Date.now(),
  });
  return hasAccess;
}
```

### IP Whitelisting

Add additional security for studio access:
```typescript
const ALLOWED_IP_RANGES = ['192.168.1.0/24'];

function isAllowedIP(ip: string): boolean {
  // Check if IP is in allowed ranges
}
```

## Maintenance

### Adding New Roles

1. Update `UserRole` type in `/src/lib/authorization.ts`
2. Create role in Strapi admin
3. Update `hasStudioAccess()` if role needs studio access
4. Update `getRoleName()` for display name

### Protecting New Routes

To protect additional routes:

1. **Via Layout** - Add role check in layout file
2. **Via Middleware** - Update matcher pattern
3. **Via Component** - Check role in Server Component

### Updating Strapi Integration

If Strapi API changes:
1. Update `fetchUserRole()` in `/src/lib/authorization.ts`
2. Test with different role formats
3. Update error handling

---

## Summary

The studio authorization system provides secure, role-based access control with:

✅ Multi-layer defense (middleware + layout)
✅ Type-safe role checking
✅ Clear user feedback
✅ Fail-safe defaults
✅ Strapi integration
✅ Audit trail via console logs

Only users with **studio** or **admin** roles can access `/studio` routes. All other users are redirected to an unauthorized page with helpful information.
