export type DonationProvider = "givebutter" | "memberful" | "patreon";

export function getProvider(): DonationProvider {
  const v = (process.env.NEXT_PUBLIC_DONATION_PROVIDER || "givebutter").toLowerCase();
  if (v === "memberful" || v === "patreon") return v;
  return "givebutter";
}

export function getProcessorUrl(): string {
  const p = getProvider();
  if (p === "memberful") return process.env.NEXT_PUBLIC_MEMBERFUL_CHECKOUT_URL || "#";
  if (p === "patreon") return process.env.NEXT_PUBLIC_PATREON_URL || "#";
  return process.env.NEXT_PUBLIC_GIVEBUTTER_URL || "https://givebutter.com/your-campaign";
}
