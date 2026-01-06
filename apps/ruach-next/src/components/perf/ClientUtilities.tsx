"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const InstallPrompt = dynamic(() => import("@/components/pwa/InstallPrompt"), {
  ssr: false,
  loading: () => null,
});

const OfflineIndicator = dynamic(() => import("@/components/offline/OfflineIndicator"), {
  ssr: false,
  loading: () => null,
});

/**
 * Defers non-critical, global client utilities until after initial paint/idle.
 * This helps reduce initial JS work on first load.
 */
export default function ClientUtilities() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const delayMs = 1500;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(() => setMounted(true), { timeout: delayMs + 500 });
      return () => {
        // requestIdleCallback cancel API isn't always present/typed; ignore if missing
        (window as any).cancelIdleCallback?.(id);
      };
    }

    const t = window.setTimeout(() => setMounted(true), delayMs);
    return () => window.clearTimeout(t);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <InstallPrompt />
      <OfflineIndicator />
    </>
  );
}

