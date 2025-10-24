# Authentication & Session Security Documentation

## Overview

This application uses a secure authentication system with the following features:

- **NextAuth.js v4** with JWT strategy for frontend authentication
- **Strapi** backend for user management and authentication
- **HTTPOnly cookies** for secure token storage
- **Refresh token rotation** to prevent token reuse attacks
- **Token blacklist** for immediate token revocation
- **Explicit token expiration** (1 hour access tokens, 7 day refresh tokens)
- **Automatic token refresh** via NextAuth callbacks

## Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Browser   │         │  Next.js    │         │   Strapi    │
│             │         │  Frontend   │         │   Backend   │
└─────────────┘         └─────────────┘         └─────────────┘
      │                        │                        │
      │  1. POST /login        │                        │
      │───────────────────────>│                        │
      │                        │  2. POST /api/auth/login
      │                        │───────────────────────>│
      │                        │                        │
      │                        │  3. JWT + User         │
      │                        │<───────────────────────│
      │                        │  4. Set refresh token  │
      │                        │    (HTTPOnly cookie)   │
      │  5. Set session cookie │                        │
      │<───────────────────────│                        │
      │     + refresh token    │                        │
      │                        │                        │
      │  6. Access protected   │                        │
      │     resources with     │                        │
      │     session            │                        │
      │───────────────────────>│                        │
      │                        │                        │
      │  7. Token expires      │                        │
      │                        │  8. GET /api/auth/     │
      │                        │     refresh-token      │
      │                        │───────────────────────>│
      │                        │  9. Validate & rotate  │
      │                        │    refresh token       │
      │                        │<───────────────────────│
      │  10. New tokens        │                        │
      │<───────────────────────│                        │
      │                        │                        │
      │  11. POST /logout      │                        │
      │───────────────────────>│  12. POST /api/auth/   │
      │                        │      logout            │
      │                        │───────────────────────>│
      │                        │  13. Blacklist token   │
      │                        │      Clear cookie      │
      │  14. Clear all tokens  │<───────────────────────│
      │<───────────────────────│                        │
```

## Security Features

### 1. HTTPOnly Cookies

**What**: Refresh tokens are stored in HTTPOnly cookies that cannot be accessed by JavaScript.

**Why**: Prevents XSS attacks from stealing tokens.

**Implementation**:
```javascript
ctx.cookies.set("refreshToken", refreshToken, {
  httpOnly: true,                    // Cannot be accessed by JavaScript
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "Strict",                // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000   // 7 days
});
```

### 2. Refresh Token Rotation

**What**: Each time a refresh token is used, it's invalidated and a new one is issued.

**Why**: Prevents token reuse attacks. If a token is stolen and used, the legitimate user will be logged out, alerting them to the breach.

**Implementation**:
- Refresh tokens are stored in `/ruach-ministries-backend/src/services/refresh-token-store.js`
- When a token is used, it's marked as `used: true`
- If a used token is attempted again, ALL tokens for that user are revoked

**Detection**: If token reuse is detected, the system logs:
```
Refresh token reuse detected for user {userId}!
```

### 3. Token Blacklist

**What**: A blacklist of revoked tokens that are no longer valid.

**Why**: Allows immediate token revocation on logout, even before natural expiration.

**Implementation**:
- Blacklist managed in `/ruach-ministries-backend/src/services/token-blacklist.js`
- Tokens are added on logout
- Automatic cleanup of expired tokens every 5 minutes

### 4. Explicit Token Expiration

**Access Tokens**: 1 hour
- Short-lived to minimize damage if stolen
- Automatically refreshed when expired

**Refresh Tokens**: 7 days
- Longer-lived for better UX
- Rotated on each use
- Stored securely in HTTPOnly cookies

### 5. Automatic Token Refresh

**What**: NextAuth automatically refreshes expired access tokens using the refresh token.

**When**: When the access token expires (checked on each request)

**How**: The `jwt()` callback in `/apps/ruach-next/src/lib/auth.ts` checks token expiration and calls the refresh endpoint.

## Key Files

### Frontend (Next.js)

| File | Purpose |
|------|---------|
| `/apps/ruach-next/src/lib/auth.ts` | NextAuth configuration with refresh token logic |
| `/apps/ruach-next/src/lib/validate-env.ts` | Environment variable validation |
| `/apps/ruach-next/src/app/login/page.tsx` | Login page |
| `/apps/ruach-next/src/app/logout/page.tsx` | Logout page |
| `/apps/ruach-next/src/middleware.ts` | Protected route middleware |

### Backend (Strapi)

| File | Purpose |
|------|---------|
| `/ruach-ministries-backend/src/api/auth/controllers/custom-auth.js` | Login, refresh, logout handlers |
| `/ruach-ministries-backend/src/api/auth/routes/custom-auth.js` | Auth route definitions |
| `/ruach-ministries-backend/src/services/token-blacklist.js` | Token blacklist service |
| `/ruach-ministries-backend/src/services/refresh-token-store.js` | Refresh token storage with rotation |

## Environment Variables

### Frontend (.env.local)

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<32+ character cryptographically random string>

# Strapi Backend
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337

# Optional: Redis for distributed blacklist (recommended for production)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

**Generating NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

### Backend (.env)

```bash
# Strapi JWT Secret (must match across all Strapi instances)
JWT_SECRET=<32+ character cryptographically random string>

# Admin JWT Secret (separate from user JWT)
ADMIN_JWT_SECRET=<32+ character cryptographically random string>

# App Keys (comma-separated, 2+ keys)
APP_KEYS="key1,key2"

# Token Salts
API_TOKEN_SALT=<32+ character random string>
TRANSFER_TOKEN_SALT=<32+ character random string>
```

## API Endpoints

### POST /api/auth/login

**Purpose**: Authenticate user and issue tokens

**Request**:
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "jwt": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "username": "user"
  }
}
```

**Side Effects**:
- Sets `refreshToken` HTTPOnly cookie (7 day expiration)
- Stores refresh token in token store

### GET /api/auth/refresh-token

**Purpose**: Refresh expired access token

**Request**: No body (uses refresh token from cookie)

**Response**:
```json
{
  "jwt": "eyJhbGc..."
}
```

**Side Effects**:
- Marks old refresh token as used
- Issues new refresh token
- Updates `refreshToken` HTTPOnly cookie

**Error Cases**:
- `401 Unauthorized`: No refresh token provided
- `401 Unauthorized`: Token expired or invalid
- `401 Unauthorized`: Token reuse detected (security breach)

### POST /api/auth/logout

**Purpose**: Revoke tokens and end session

**Request**: No body (uses refresh token from cookie)

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Side Effects**:
- Adds refresh token to blacklist
- Removes refresh token from store
- Clears `refreshToken` HTTPOnly cookie

## Usage Examples

### Login

```typescript
import { signIn } from "next-auth/react";

const handleLogin = async (email: string, password: string) => {
  const result = await signIn("credentials", {
    email,
    password,
    redirect: false
  });

  if (result?.error) {
    console.error("Login failed:", result.error);
  } else {
    // Redirect to dashboard or home
    window.location.href = "/dashboard";
  }
};
```

### Logout

```typescript
import { signOut } from "next-auth/react";

const handleLogout = async () => {
  await signOut({ callbackUrl: "/" });
};
```

### Access Session

```typescript
import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  if (status === "unauthenticated") {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {session?.user?.name}</h1>
      <p>Email: {session?.user?.email}</p>
    </div>
  );
}
```

### Protected API Route

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const strapiJwt = (session as any).strapiJwt;

  // Make authenticated request to Strapi
  const response = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/users/me`, {
    headers: {
      Authorization: `Bearer ${strapiJwt}`
    }
  });

  const data = await response.json();
  return NextResponse.json(data);
}
```

### Protected Page with Middleware

Add protected routes to `/apps/ruach-next/src/middleware.ts`:

```typescript
export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/profile/:path*"
  ]
};
```

## Security Best Practices

### 1. NEVER Store Tokens in localStorage

❌ **BAD**:
```typescript
localStorage.setItem("token", jwt);
```

✅ **GOOD**: Use HTTPOnly cookies (handled automatically by backend)

### 2. NEVER Commit Secrets to Git

❌ **BAD**: Using default secrets in production

✅ **GOOD**: Generate unique secrets per environment
```bash
openssl rand -base64 32
```

### 3. Use HTTPS in Production

❌ **BAD**: HTTP in production (tokens sent in plain text)

✅ **GOOD**: HTTPS everywhere (cookies marked `secure: true`)

### 4. Validate Environment Variables

The application automatically validates environment variables on startup:

```typescript
import { requireValidEnvironment } from "@/lib/validate-env";

// This runs automatically in production
requireValidEnvironment();
```

### 5. Monitor for Token Reuse

The system automatically detects and logs token reuse attempts:

```
Refresh token reuse detected for user {userId}!
```

Set up alerts for this log message in production.

### 6. Regular Token Rotation

- Access tokens: 1 hour (cannot be configured longer)
- Refresh tokens: 7 days (can be adjusted)
- Refresh token rotation: On every use

### 7. Implement Rate Limiting

Rate limiting is already configured for auth endpoints:

```typescript
// In /api/login
await requireRateLimit(signupLimiter, ipAddress);
```

## Testing

### Test Login Flow

```bash
# Start backend
cd ruach-monorepo/ruach-ministries-backend
npm run develop

# Start frontend
cd ruach-monorepo/apps/ruach-next
npm run dev

# Navigate to http://localhost:3000/login
# Login with test credentials
```

### Test Token Refresh

1. Login successfully
2. Wait 1+ hours (or modify `ACCESS_TOKEN_EXPIRY` to 60 seconds for testing)
3. Make an authenticated request
4. Check network tab - should see automatic refresh

### Test Logout

1. Login successfully
2. Click logout
3. Verify refresh token cookie is cleared
4. Verify old refresh token is blacklisted
5. Attempt to use old refresh token - should fail with 401

### Test Token Reuse Detection

1. Login successfully
2. Capture refresh token from cookie
3. Use refresh token to get new tokens
4. Try using the same refresh token again
5. Should fail with "Invalid or expired refresh token"
6. All user's tokens should be revoked

## Troubleshooting

### "NEXTAUTH_SECRET must be at least 24 characters"

**Solution**: Generate a new secret:
```bash
openssl rand -base64 32
```

### "No refresh token provided"

**Causes**:
- Cookie not being sent (check CORS settings)
- Cookie expired (7 day limit)
- Browser blocking cookies (check SameSite settings)

**Solution**: Check browser DevTools > Application > Cookies

### "Invalid refresh token"

**Causes**:
- Token expired (7+ days old)
- Token was revoked (logout)
- Token reuse detected
- JWT_SECRET changed on backend

**Solution**: Login again to get new tokens

### "Access token expired, refreshing..." (in console)

**Status**: Normal behavior, automatic refresh in progress

### Tokens not persisting across browser restarts

**Cause**: Using in-memory token store (development only)

**Solution**: Implement Redis or database persistence for production

## Migration Guide

### From localStorage to HTTPOnly Cookies

If you have existing code using localStorage:

❌ **Remove**:
```typescript
localStorage.setItem("jwt", token);
const token = localStorage.getItem("jwt");
```

✅ **Replace with**:
```typescript
import { useSession } from "next-auth/react";

const { data: session } = useSession();
const jwt = (session as any)?.strapiJwt;
```

### From Strapi JWT to NextAuth

If you were using Strapi JWT directly:

❌ **Old**:
```typescript
const response = await fetch(`${STRAPI}/api/auth/local`, {
  method: "POST",
  body: JSON.stringify({ identifier, password })
});
```

✅ **New**:
```typescript
import { signIn } from "next-auth/react";

await signIn("credentials", { email, password });
```

## Production Checklist

- [ ] Generate strong NEXTAUTH_SECRET (32+ characters)
- [ ] Generate strong JWT_SECRET (32+ characters)
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (cookies will have `secure: true`)
- [ ] Configure CORS to only allow your domain
- [ ] Set up Redis for distributed token store (optional)
- [ ] Set up monitoring/alerts for token reuse detection
- [ ] Test login, logout, and refresh flows
- [ ] Run environment validation: `npm run validate-env`
- [ ] Review rate limiting settings
- [ ] Set up session monitoring/analytics

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments in key files
3. Check logs for error messages
4. Open an issue on the project repository

## License

This authentication system is part of the Ruach Ministries application.
