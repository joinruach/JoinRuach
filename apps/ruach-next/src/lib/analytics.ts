declare global {
  interface Window {
    plausible?: (e: string, o?: { props?: Record<string, string> }) => void;
    gtag?: (command: string, event: string, params?: Record<string, string>) => void;
  }
}

export function track(event: string, props?: Record<string, string>) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, { props });
  }
}
