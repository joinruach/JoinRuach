declare global {
  interface Window {
    plausible?: (e: string, o?: { props?: Record<string, string | number | undefined> }) => void;
  }
}

export function track(event: string, props?: Record<string, string | number | undefined>) {
  if (typeof window !== "undefined" && typeof window.plausible === "function") {
    window.plausible(event, { props });
  }
}
