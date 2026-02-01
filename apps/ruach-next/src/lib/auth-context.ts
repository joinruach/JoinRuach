"use client";

import { useEffect, useState } from "react";

/**
 * Minimal auth helper to expose the Strapi JWT on the client.
 * If you later wire this to NextAuth, replace the localStorage
 * lookup with session data.
 */
export function useAuth() {
  const [strapiJwt, setStrapiJwt] = useState<string | null>(null);

  useEffect(() => {
    // Best-effort read; avoids crashing when storage is unavailable
    try {
      const token = window.localStorage.getItem("strapiJwt");
      if (token) setStrapiJwt(token);
    } catch {
      // ignore
    }
  }, []);

  return { strapiJwt };
}

export type AuthContextValue = ReturnType<typeof useAuth>;
