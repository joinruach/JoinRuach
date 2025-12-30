# Login UX Audit Report

**Date:** 2025-12-29
**Issue:** Users unable to access account/profile pages after login
**Severity:** 🔴 Critical - Affects core user authentication flow

---

## Executive Summary

A **race condition** in the login redirect flow causes users to be redirected back to the login page immediately after successful authentication, creating a frustrating loop that prevents account access.

**Root Cause:** Manual `window.location.href` redirect fires before NextAuth session cookie is fully established in the browser.

**Impact:**
- Users cannot access `/members/account` after login
- Perceived as "login not working"
- Poor UX, potential user drop-off

---

## Technical Analysis

### Current Login Flow (apps/ruach-next/src/app/[locale]/login/page.tsx)

```typescript
// Line 35-43
const res = await signIn("credentials", { email, password, redirect: false });

if (!res || res?.error) {
  setErr(res?.error || "Login failed");
  setLoading(false);
} else {
  // ISSUE: Immediate redirect before session is established
  window.location.href = res?.url || `/${locale}/members/account`;
}
```

### Race Condition Sequence

1. **T+0ms:** `signIn("credentials", ...)` called
2. **T+200ms:** Strapi API returns `{ jwt, user }`
3. **T+250ms:** NextAuth begins setting session cookie
4. **T+260ms:** `signIn()` promise resolves with success
5. **T+260ms:** ⚠️ Code fires `window.location.href` redirect
6. **T+300ms:** Browser navigates to `/members/account`
7. **T+350ms:** Account page server component calls `await auth()`
8. **T+360ms:** ❌ Session cookie not yet readable → `auth()` returns `null`
9. **T+370ms:** Account page redirects to `/login?callbackUrl=.../account`
10. **T+400ms:** NextAuth finishes setting cookie (too late!)

### Account Page Protection (apps/ruach-next/src/app/[locale]/members/account/page.tsx)

```typescript
// Line 277-284
const session = await auth() as StrapiSession | null;
const jwt = session?.strapiJwt ?? undefined;

if (!jwt) {
  redirect(
    `/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/members/account`)}`
  );
}
```

**Why this fails:**
- Server component calls `await auth()` on page load
- If session cookie isn't readable yet, returns `null`
- Immediately redirects back to login

### Why This Happens

NextAuth session handling involves:
1. JWT encoding/signing
2. HTTP cookie setting (`Set-Cookie` header)
3. Browser cookie storage
4. Cookie availability on next request

**Manual redirect with `window.location.href` doesn't wait for these steps to complete.**

---

## Evidence

### Git History

```bash
commit 40226b4 - fix(login): Redirect to account page after successful login
```

This commit changed the redirect target from homepage (`/${locale}`) to account page (`/${locale}/members/account`), exposing the latent race condition that was always present but less visible.

### Missing E2E Test Coverage

File: `e2e/auth.spec.ts`

**Current tests:**
- ✅ Display login page
- ✅ Show sign in form
- ✅ Handle sign in navigation
- ❌ **Missing:** Full login → account access flow
- ❌ **Missing:** Verify session established after login
- ❌ **Missing:** Verify account page renders after login

**Test gap:** No automated test catches this race condition.

---

## Proposed Solutions

### ✅ Option 1: Use NextAuth Built-in Redirect (Recommended)

**Change:** Let NextAuth handle the redirect instead of manual `window.location.href`

**Implementation:**

```typescript
// apps/ruach-next/src/app/[locale]/login/page.tsx
async function submit(e: React.FormEvent) {
  e.preventDefault();
  if (loading) return;

  setErr(null);
  setLoading(true);

  try {
    // Let NextAuth handle redirect with callbackUrl
    await signIn("credentials", {
      email,
      password,
      callbackUrl: `/${locale}/members/account`,
      redirect: true  // Changed from false
    });
    // No manual redirect needed - NextAuth handles it
  } catch (error) {
    setErr("Something went wrong. Please try again.");
    setLoading(false);
  }
}
```

**Pros:**
- ✅ NextAuth ensures session is set before redirect
- ✅ Built-in error handling
- ✅ Simpler code

**Cons:**
- ⚠️ Less control over loading state during redirect
- ⚠️ Error handling moves to URL params instead of inline

---

### ✅ Option 2: Wait for Session Confirmation

**Change:** Verify session exists before manual redirect

**Implementation:**

```typescript
// apps/ruach-next/src/app/[locale]/login/page.tsx
import { useSession } from "next-auth/react";

function LoginForm() {
  const { data: session, update } = useSession();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    setErr(null);
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (!res || res?.error) {
        setErr(res?.error || "Login failed");
        setLoading(false);
      } else {
        // Wait for session to be established
        await update(); // Triggers session refresh

        // Verify session exists
        const updatedSession = await new Promise((resolve) => {
          const checkSession = setInterval(async () => {
            const { data } = useSession();
            if (data) {
              clearInterval(checkSession);
              resolve(data);
            }
          }, 100);

          // Timeout after 5 seconds
          setTimeout(() => {
            clearInterval(checkSession);
            resolve(null);
          }, 5000);
        });

        if (updatedSession) {
          window.location.href = `/${locale}/members/account`;
        } else {
          setErr("Session verification failed. Please try again.");
          setLoading(false);
        }
      }
    } catch (error) {
      setErr("Something went wrong. Please try again.");
      setLoading(false);
    }
  }
}
```

**Pros:**
- ✅ Ensures session exists before redirect
- ✅ Maintains current error handling UI
- ✅ Full control over loading state

**Cons:**
- ⚠️ More complex code
- ⚠️ Potential 100-500ms delay before redirect
- ⚠️ Requires SessionProvider wrapper

---

### ✅ Option 3: Server-Side Redirect After Login

**Change:** Handle login/redirect entirely server-side

**Implementation:**

Create Server Action:
```typescript
// apps/ruach-next/src/app/[locale]/login/actions.ts
"use server";

import { signIn } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const locale = formData.get("locale") as string;

  try {
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: result.error };
    }

    // Server-side redirect after session is set
    redirect(`/${locale}/members/account`);
  } catch (error) {
    return { error: "Something went wrong. Please try again." };
  }
}
```

Update form:
```typescript
// apps/ruach-next/src/app/[locale]/login/page.tsx
import { useFormState } from "react-dom";
import { loginAction } from "./actions";

function LoginForm() {
  const [state, formAction] = useFormState(loginAction, null);

  return (
    <form action={formAction}>
      <input type="hidden" name="locale" value={locale} />
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      {state?.error && <p className="text-red-600">{state.error}</p>}
      <button type="submit">Login</button>
    </form>
  );
}
```

**Pros:**
- ✅ Session guaranteed to be set before redirect
- ✅ Server-side execution eliminates race conditions
- ✅ Progressive enhancement (works without JS)

**Cons:**
- ⚠️ Larger refactor of existing code
- ⚠️ Different UX pattern (form submission vs XHR)

---

## Recommendation

**Implement Option 1: Use NextAuth Built-in Redirect**

**Rationale:**
1. Simplest implementation (< 5 lines changed)
2. Leverages NextAuth's built-in session handling
3. Most reliable solution (framework-provided)
4. Easiest to test and maintain

**Estimated effort:** 15 minutes

---

## Additional Improvements

### 1. Add E2E Test for Login Flow

```typescript
// e2e/auth.spec.ts
test('should redirect to account page after successful login', async ({ page }) => {
  await page.goto('/en/login');

  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Wait for redirect to account page
  await page.waitForURL(/\/en\/members\/account/, { timeout: 5000 });

  // Verify account page loaded
  await expect(page.locator('h1')).toContainText('Welcome back');
});

test('should handle failed login gracefully', async ({ page }) => {
  await page.goto('/en/login');

  await page.fill('input[type="email"]', 'wrong@example.com');
  await page.fill('input[type="password"]', 'wrongpassword');
  await page.click('button[type="submit"]');

  // Should show error message
  await expect(page.locator('.text-red-600')).toBeVisible();

  // Should NOT redirect
  await expect(page.url()).toContain('/login');
});
```

### 2. Add Loading State During Redirect

```typescript
// Show spinner during redirect
<Button type="submit" variant="black" disabled={loading}>
  {loading ? (
    <>
      <Spinner className="mr-2" />
      Signing in...
    </>
  ) : (
    "Login"
  )}
</Button>
```

### 3. Add Session Debug Logging

```typescript
// apps/ruach-next/src/app/[locale]/members/account/page.tsx
const session = await auth() as StrapiSession | null;
const jwt = session?.strapiJwt ?? undefined;

// Debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('[Account Page] Session:', session ? 'present' : 'missing');
  console.log('[Account Page] JWT:', jwt ? 'present' : 'missing');
}

if (!jwt) {
  console.warn('[Account Page] No JWT found, redirecting to login');
  redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/members/account`)}`);
}
```

---

## Implementation Checklist

- [ ] Implement Option 1 (NextAuth built-in redirect)
- [ ] Test login flow manually in dev
- [ ] Add E2E test for successful login → account access
- [ ] Add E2E test for failed login error handling
- [ ] Add loading state/spinner during redirect
- [ ] Add session debug logging (dev mode only)
- [ ] Test on staging environment
- [ ] Deploy to production

---

## Related Files

- `apps/ruach-next/src/app/[locale]/login/page.tsx:27-48` - Login form submit handler
- `apps/ruach-next/src/app/[locale]/members/account/page.tsx:271-284` - Account page auth check
- `apps/ruach-next/src/lib/auth.ts:89-229` - NextAuth configuration
- `apps/ruach-next/src/middleware.ts:7-53` - Route protection middleware
- `e2e/auth.spec.ts:1-97` - E2E authentication tests

---

## Conclusion

The login redirect race condition is a **critical UX issue** that prevents users from accessing their account after successful authentication. The recommended fix (Option 1) is simple, reliable, and leverages NextAuth's built-in session handling to eliminate the race condition.

**Estimated fix time:** 15 minutes
**Testing time:** 15 minutes
**Total time to resolution:** 30 minutes

---

**Next Steps:** Implement Option 1 and add E2E test coverage to prevent regression.
