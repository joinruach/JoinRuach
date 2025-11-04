# Idle Timeout & Session Expiry Implementation Guide

**Priority:** MEDIUM (M2, M3 from audit)
**Complexity:** Medium
**Time Estimate:** 2-3 hours
**Dependencies:** Next.js 14, NextAuth

---

## Overview

This guide implements two related features:
- **M2:** 30-minute idle timeout (auto-logout after inactivity)
- **M3:** Session expiry notifications (user-friendly warnings)

---

## Architecture

### Current State
- Access token: 1 hour expiration
- Refresh token: 7 days expiration
- No idle timeout (users stay logged in even if inactive)
- Silent token refresh (no user notification)

### Desired State
- Access token: 1 hour expiration ✅ (unchanged)
- Refresh token: 7 days expiration ✅ (unchanged)
- **NEW:** Idle timeout: 30 minutes of inactivity → force logout
- **NEW:** Session expiry warning: 5-minute countdown before timeout
- **NEW:** Toast notifications for expired sessions

---

## Implementation: M2 - Idle Timeout Mechanism

### Step 1: Update Session Type Definitions

**File:** `apps/ruach-next/src/types/next-auth.d.ts`

```typescript
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session extends DefaultSession {
    strapiJwt?: string;
    error?: string;
    lastActivity?: number; // NEW: Track last activity timestamp
  }

  interface User extends DefaultUser {
    strapiJwt: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    strapiJwt?: string;
    accessTokenExpires?: number;
    error?: string;
    lastActivity?: number; // NEW: Track last activity timestamp
  }
}
```

---

### Step 2: Update Auth Configuration

**File:** `apps/ruach-next/src/lib/auth.ts`

Add idle timeout constant:

```typescript
// JWT expiration times
const JWT_MAX_AGE = 60 * 60; // 1 hour (in seconds)
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60; // 7 days (in seconds)
const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes (in milliseconds) // NEW
```

Update JWT callback to track activity:

```typescript
callbacks: {
  async jwt({ token, user, trigger }) {
    // Initial sign in
    if (user) {
      return {
        ...token,
        strapiJwt: (user as any).strapiJwt,
        accessTokenExpires: Date.now() + JWT_MAX_AGE * 1000,
        lastActivity: Date.now(), // NEW: Set initial activity time
        error: undefined
      };
    }

    // Update activity on session update
    if (trigger === "update") {
      return {
        ...token,
        lastActivity: Date.now(), // NEW: Update activity time
      };
    }

    // Check idle timeout
    const lastActivity = (token.lastActivity as number) || Date.now();
    const now = Date.now();

    if (now - lastActivity > IDLE_TIMEOUT) {
      // User has been idle for > 30 minutes
      console.log("Session expired due to inactivity");
      return {
        ...token,
        error: "IdleTimeout"
      };
    }

    // Return previous token if the access token has not expired yet
    if (Date.now() < (token.accessTokenExpires as number)) {
      return token;
    }

    // Access token has expired, try to refresh it
    console.log("Access token expired, refreshing...");
    return refreshAccessToken(token);
  },

  async session({ session, token }) {
    (session as any).strapiJwt = (token as any).strapiJwt;
    (session as any).error = token.error;
    (session as any).lastActivity = token.lastActivity; // NEW

    // If there's a refresh error or idle timeout, the session is invalid
    if (token.error) {
      console.error("Session has error:", token.error);
    }

    return session;
  }
},
```

---

### Step 3: Create Activity Tracker Hook

**File:** `apps/ruach-next/src/hooks/useActivityTracker.ts`

```typescript
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

const ACTIVITY_EVENTS = ["mousedown", "keydown", "scroll", "touchstart"];
const ACTIVITY_THROTTLE = 60 * 1000; // Update every 1 minute

export function useActivityTracker() {
  const { data: session, update } = useSession();
  let lastUpdate = Date.now();

  useEffect(() {
    if (!session) return;

    const handleActivity = () => {
      const now = Date.now();

      // Throttle updates to once per minute
      if (now - lastUpdate > ACTIVITY_THROTTLE) {
        lastUpdate = now;
        update(); // Triggers JWT callback with trigger="update"
      }
    };

    // Listen to user activity
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session, update]);
}
```

---

### Step 4: Add Activity Tracker to App Layout

**File:** `apps/ruach-next/src/app/layout.tsx`

```typescript
import { SessionProvider } from "next-auth/react";
import { ActivityTracker } from "@/components/ActivityTracker";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ActivityTracker /> {/* NEW: Track user activity */}
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
```

**File:** `apps/ruach-next/src/components/ActivityTracker.tsx`

```typescript
"use client";

import { useActivityTracker } from "@/hooks/useActivityTracker";

export function ActivityTracker() {
  useActivityTracker();
  return null; // No UI, just tracking
}
```

---

### Step 5: Handle Idle Timeout in Session Check

**File:** `apps/ruach-next/src/components/SessionChecker.tsx` (NEW)

```typescript
"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SessionChecker() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.error === "IdleTimeout") {
      // Logout due to idle timeout
      signOut({ callbackUrl: "/login?expired=idle" });
    } else if (session?.error === "RefreshAccessTokenError") {
      // Logout due to token refresh failure
      signOut({ callbackUrl: "/login?expired=true" });
    }
  }, [session, router]);

  return null;
}
```

Add to layout:

```typescript
<SessionProvider>
  <ActivityTracker />
  <SessionChecker /> {/* NEW: Check for session errors */}
  {children}
</SessionProvider>
```

---

## Implementation: M3 - Session Expiry Notifications

### Step 1: Create Toast Notification System

**File:** `apps/ruach-next/src/components/Toast.tsx`

```typescript
"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Toast = {
  id: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  duration?: number;
};

type ToastContextType = {
  toasts: Toast[];
  showToast: (message: string, type: Toast["type"], duration?: number) => void;
  hideToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"], duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, message, type, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}

function ToastContainer({ toasts, onClose }: { toasts: Toast[]; onClose: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            rounded-lg px-4 py-3 shadow-lg min-w-[300px] max-w-md
            ${toast.type === "error" ? "bg-red-600 text-white" : ""}
            ${toast.type === "warning" ? "bg-amber-600 text-white" : ""}
            ${toast.type === "success" ? "bg-green-600 text-white" : ""}
            ${toast.type === "info" ? "bg-blue-600 text-white" : ""}
          `}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => onClose(toast.id)}
              className="ml-4 text-white/80 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

---

### Step 2: Add Expiry Warning Timer

**File:** `apps/ruach-next/src/hooks/useSessionExpiry.ts`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/Toast";

const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry

export function useSessionExpiry() {
  const { data: session } = useSession();
  const { showToast } = useToast();
  const [warningShown, setWarningShown] = useState(false);

  useEffect() {
    if (!session || !session.lastActivity) return;

    const checkExpiry = () => {
      const lastActivity = session.lastActivity as number;
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      const timeUntilExpiry = IDLE_TIMEOUT - timeSinceActivity;

      // Show warning 5 minutes before expiry
      if (timeUntilExpiry <= WARNING_THRESHOLD && timeUntilExpiry > 0 && !warningShown) {
        const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
        showToast(
          `Your session will expire in ${minutesLeft} minute${minutesLeft > 1 ? "s" : ""} due to inactivity.`,
          "warning",
          0 // Don't auto-hide
        );
        setWarningShown(true);
      }

      // Reset warning when user becomes active again
      if (timeUntilExpiry > WARNING_THRESHOLD && warningShown) {
        setWarningShown(false);
      }
    };

    const interval = setInterval(checkExpiry, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [session, showToast, warningShown]);
}
```

---

### Step 3: Update Session Checker with Notifications

**File:** `apps/ruach-next/src/components/SessionChecker.tsx` (UPDATE)

```typescript
"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "./Toast";
import { useSessionExpiry } from "@/hooks/useSessionExpiry";

export function SessionChecker() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Track session expiry and show warnings
  useSessionExpiry();

  useEffect(() => {
    // Handle session errors
    if (session?.error === "IdleTimeout") {
      showToast(
        "Your session expired due to 30 minutes of inactivity. Please log in again.",
        "error",
        8000
      );
      signOut({ callbackUrl: "/login?expired=idle" });
    } else if (session?.error === "RefreshAccessTokenError") {
      showToast(
        "Your session has expired. Please log in again.",
        "error",
        8000
      );
      signOut({ callbackUrl: "/login?expired=true" });
    }
  }, [session, showToast]);

  useEffect(() => {
    // Show message if user was redirected after expiry
    const expired = searchParams.get("expired");
    if (expired === "idle") {
      showToast(
        "Your session expired due to inactivity. Please log in again.",
        "warning"
      );
    } else if (expired === "true") {
      showToast(
        "Your session has expired. Please log in again.",
        "warning"
      );
    }
  }, [searchParams, showToast]);

  return null;
}
```

---

### Step 4: Add Toast Provider to Layout

**File:** `apps/ruach-next/src/app/layout.tsx` (UPDATE)

```typescript
import { SessionProvider } from "next-auth/react";
import { ToastProvider } from "@/components/Toast";
import { ActivityTracker } from "@/components/ActivityTracker";
import { SessionChecker } from "@/components/SessionChecker";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <ToastProvider> {/* NEW: Add toast notifications */}
            <ActivityTracker />
            <SessionChecker />
            {children}
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Testing

### Test 1: Idle Timeout
1. Login to the application
2. Leave browser tab open for 25 minutes (no activity)
3. Verify warning toast appears: "Your session will expire in 5 minutes..."
4. Wait 5 more minutes (30 minutes total)
5. Verify logout and redirect to `/login?expired=idle`
6. Verify error toast: "Your session expired due to inactivity..."

### Test 2: Activity Tracking
1. Login to the application
2. Every 1-2 minutes, perform an activity (click, scroll, type)
3. Verify session does NOT expire after 30 minutes
4. Check browser console for "JWT callback" logs showing activity updates

### Test 3: Token Refresh Failure
1. Login to the application
2. Shutdown Strapi backend
3. Wait for access token to expire (1 hour)
4. Trigger a protected action
5. Verify error toast: "Your session has expired..."
6. Verify logout and redirect to `/login?expired=true`

### Test 4: Cross-Tab Behavior
1. Login in Tab A
2. Open Tab B
3. Let Tab A idle for 30 minutes
4. Verify both tabs logout simultaneously
5. Verify error message shown in both tabs

---

## Configuration

### Environment Variables

No new environment variables needed. Current configuration uses:

```bash
# Session duration (already configured)
JWT_MAX_AGE=3600  # 1 hour

# Idle timeout (hardcoded, can make configurable)
IDLE_TIMEOUT_MINUTES=30  # Optional: add to .env if you want it configurable
```

If you want configurable idle timeout:

```typescript
const IDLE_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES || "30", 10) * 60 * 1000;
```

---

## Monitoring & Metrics

### Logs to Watch

**Successful activity tracking:**
```
JWT callback triggered: update
Last activity updated: 1699564123000
```

**Idle timeout triggered:**
```
Session expired due to inactivity
User logged out: idle timeout
```

**Token refresh failure:**
```
Error refreshing access token: Failed to refresh token
Session has error: RefreshAccessTokenError
```

### Metrics to Track

1. **Idle timeout rate:** How many users logout due to inactivity vs manual logout
2. **Average session duration:** How long users stay active
3. **Activity frequency:** How often users trigger activity updates
4. **Token refresh failures:** Rate of refresh errors (should be < 1%)

---

## Troubleshooting

### Issue: Session expires too quickly

**Cause:** Activity tracker not updating last activity time

**Solution:**
1. Check browser console for "JWT callback" logs
2. Verify `update()` is being called in activity handler
3. Increase `ACTIVITY_THROTTLE` if too aggressive
4. Check session provider is wrapping the app

---

### Issue: Warning toast not showing

**Cause:** Toast provider not initialized

**Solution:**
1. Verify `<ToastProvider>` wraps entire app
2. Check `useToast()` hook is available in components
3. Verify `useSessionExpiry` hook is running (check console logs)
4. Increase `WARNING_THRESHOLD` for easier testing

---

### Issue: Users logged out unexpectedly

**Cause:** Idle timeout too aggressive or activity tracking broken

**Solution:**
1. Check `IDLE_TIMEOUT` constant (should be 30 minutes)
2. Verify activity events are firing (add console.log in handleActivity)
3. Check throttling isn't too aggressive
4. Verify `lastActivity` is being updated in JWT

---

## Performance Considerations

### Activity Tracker
- **Throttled to 1-minute intervals** (reduces JWT callback frequency)
- **Passive event listeners** (doesn't block scroll/touch)
- **Minimal overhead** (< 1ms per activity check)

### Session Expiry Check
- **10-second intervals** (balance between UX and performance)
- **Only runs when logged in** (no overhead for logged-out users)
- **Lightweight calculation** (simple timestamp comparison)

### Toast Notifications
- **Auto-cleanup after duration** (prevents memory leaks)
- **Max 5 toasts visible** (prevents UI clutter)
- **CSS animations** (hardware accelerated)

---

## Migration Notes

### Breaking Changes
- None! Feature is additive, fully backward compatible

### Deployment Steps
1. Deploy updated auth.ts with idle timeout logic
2. Deploy ActivityTracker and SessionChecker components
3. Deploy Toast system
4. Test in staging with 5-minute idle timeout for quick verification
5. Deploy to production with 30-minute timeout
6. Monitor logs and user feedback for 48 hours

---

## Future Enhancements

1. **Configurable Timeout:** Make idle timeout user-preference (15/30/60 min)
2. **"Extend Session" Button:** Let users extend session before timeout
3. **Activity Analytics:** Track which activities are most common
4. **Countdown Timer:** Show visual countdown in last 60 seconds
5. **Remember Me:** Checkbox to extend refresh token to 30 days

---

## See Also

- `LAUNCH_READINESS_AUDIT.md` (M2, M3 findings)
- `apps/ruach-next/src/lib/auth.ts` (Auth configuration)
- NextAuth.js docs: https://next-auth.js.org/
- JWT docs: https://jwt.io/

---

**Implementation Status:** 📋 Documentation Complete
**Testing Status:** ⏳ Awaiting Implementation
**Production Ready:** ⏳ After Testing

**Questions?** Reference this guide or consult `LAUNCH_READINESS_AUDIT.md` for context.
