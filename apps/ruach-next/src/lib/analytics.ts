declare global {
  interface Window {
    plausible?: (e: string, o?: any) => void;
    gtag?: (command: string, event: string, params?: Record<string, any>) => void;
  }
}

export function track(event: string, props?: Record<string, any>) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, { props });
  }
}
