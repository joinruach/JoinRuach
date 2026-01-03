const STRAPI_BASE_URL = process.env.NEXT_PUBLIC_STRAPI_URL;

if (!STRAPI_BASE_URL) {
  throw new Error("NEXT_PUBLIC_STRAPI_URL must be configured to communicate with Strapi.");
}

type StripeSyncEndpoint = "sync-latest" | "sync-customer";

export async function postStripeSync(jwt: string, endpoint: StripeSyncEndpoint) {
  const res = await fetch(`${STRAPI_BASE_URL}/api/stripe/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${jwt}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    console.warn(`[stripe-sync] ${endpoint} failed:`, res.status, errorText);
  }
}
