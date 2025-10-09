type PlausibleFn = (event: string, options?: { props?: Record<string, unknown> }) => void;

declare global {
  interface Window {
    plausible?: (event: string, options?: any) => void;
  }
}

export function track(event: string, props?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    const plausible = window.plausible as PlausibleFn;
    plausible(event, { props });
  }
}
