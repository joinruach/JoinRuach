export type DonationProvider = "givebutter" | "stripe" | "patreon";

export function getProvider(): DonationProvider {
  const v = (process.env.NEXT_PUBLIC_DONATION_PROVIDER || "givebutter").toLowerCase();
  if (v === "stripe" || v === "patreon") return v;
  return "givebutter";
}

export function getProcessorUrl(): string {
  const p = getProvider();
  if (p === "patreon") return process.env.NEXT_PUBLIC_PATREON_URL || "#";
  return process.env.NEXT_PUBLIC_GIVEBUTTER_URL || "https://givebutter.com/your-campaign";
}

export function getStripeCheckoutPath(): string {
  return process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_SESSION_PATH || "/api/stripe/create-checkout-session";
}

export function getStripePortalPath(): string {
  return process.env.NEXT_PUBLIC_STRIPE_BILLING_PORTAL_PATH || "/api/stripe/create-billing-portal-session";
}
