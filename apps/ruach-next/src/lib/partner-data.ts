import "server-only";
import { getStripeClient } from "./stripe";

interface PartnerMetrics {
  lifetimeTotal: number;
  thisYearTotal: number;
  donationCount: number;
  firstDonationDate: string | null;
}

interface DonationRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: "completed" | "pending" | "failed" | "refunded";
  receiptUrl: string | null;
}

interface PartnerProfile {
  tier: string;
  memberSince: string | null;
  stripeCustomerId: string | null;
}

/**
 * Determine partner tier based on annual giving
 */
function computeTier(annualTotal: number): string {
  if (annualTotal >= 5000) return "Ambassador";
  if (annualTotal >= 1200) return "Advocate";
  if (annualTotal > 0) return "Friend";
  return "Supporter";
}

/**
 * Fetch partner metrics from Stripe charges
 */
export async function getPartnerMetrics(
  stripeCustomerId: string
): Promise<PartnerMetrics> {
  const stripe = getStripeClient();

  const now = new Date();
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const yearStartUnix = Math.floor(yearStart.getTime() / 1000);

  // Fetch all successful charges for this customer
  const allCharges = await stripe.charges.list({
    customer: stripeCustomerId,
    limit: 100,
    expand: ["data.balance_transaction"],
  });

  const successfulCharges = allCharges.data.filter(
    (c) => c.status === "succeeded" && !c.refunded
  );

  const lifetimeTotal = successfulCharges.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const thisYearCharges = successfulCharges.filter(
    (c) => c.created >= yearStartUnix
  );
  const thisYearTotal = thisYearCharges.reduce(
    (sum, c) => sum + c.amount,
    0
  );

  const firstCharge = successfulCharges[successfulCharges.length - 1];
  const firstDonationDate = firstCharge
    ? new Date(firstCharge.created * 1000).toISOString()
    : null;

  return {
    lifetimeTotal: lifetimeTotal / 100, // cents → dollars
    thisYearTotal: thisYearTotal / 100,
    donationCount: successfulCharges.length,
    firstDonationDate,
  };
}

/**
 * Fetch donation history from Stripe
 */
export async function getDonationHistory(
  stripeCustomerId: string,
  limit = 20
): Promise<DonationRecord[]> {
  const stripe = getStripeClient();

  const charges = await stripe.charges.list({
    customer: stripeCustomerId,
    limit,
  });

  return charges.data.map((charge) => ({
    id: charge.id,
    date: new Date(charge.created * 1000).toISOString(),
    amount: charge.amount / 100,
    method: charge.payment_method_details?.type === "card"
      ? `${charge.payment_method_details.card?.brand || "Card"} ****${charge.payment_method_details.card?.last4 || ""}`
      : charge.payment_method_details?.type || "Unknown",
    status: charge.refunded
      ? "refunded"
      : charge.status === "succeeded"
      ? "completed"
      : charge.status === "pending"
      ? "pending"
      : "failed",
    receiptUrl: charge.receipt_url || null,
  }));
}

/**
 * Get partner profile from Strapi user data + Stripe
 */
export async function getPartnerProfile(
  strapiUrl: string,
  jwt: string
): Promise<PartnerProfile> {
  try {
    const res = await fetch(`${strapiUrl}/api/users/me?populate=role`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!res.ok) {
      return { tier: "Supporter", memberSince: null, stripeCustomerId: null };
    }

    const user = await res.json();
    const stripeCustomerId = user.stripeCustomerId || null;
    const memberSince = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : null;

    // Compute tier from Stripe data if we have a customer ID
    let tier = "Supporter";
    if (stripeCustomerId) {
      try {
        const metrics = await getPartnerMetrics(stripeCustomerId);
        tier = computeTier(metrics.thisYearTotal);
      } catch {
        // Fall back to role-based tier
        tier = user.role?.name === "partner" ? "Friend" : "Supporter";
      }
    }

    return { tier, memberSince, stripeCustomerId };
  } catch {
    return { tier: "Supporter", memberSince: null, stripeCustomerId: null };
  }
}
