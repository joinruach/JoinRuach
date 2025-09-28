type PlausibleFn = (event: string, options?: { props?: Record<string, unknown> }) => void;

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, { props });
  }
}
