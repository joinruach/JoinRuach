import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL!;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || "https://joinruach.org";

export async function GET(request: NextRequest) {
  const confirmation = request.nextUrl.searchParams.get("confirmation");

  if (!confirmation) {
    console.error("[Email Confirmation API] No confirmation token provided");
    return NextResponse.json(
      { error: "Missing confirmation token" },
      { status: 400 }
    );
  }

  try {
    console.log("[Email Confirmation API] Confirming token with Strapi:", confirmation.substring(0, 10) + "...");

    // Forward the confirmation request to Strapi
    const strapiResponse = await fetch(
      `${STRAPI_URL}/api/auth/email-confirmation?confirmation=${confirmation}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("[Email Confirmation API] Strapi response status:", strapiResponse.status);

    if (!strapiResponse.ok) {
      const errorText = await strapiResponse.text();
      console.error("[Email Confirmation API] Strapi error:", errorText);

      // Redirect to error page using production URL
      const errorUrl = new URL("/confirmed", NEXTAUTH_URL);
      errorUrl.searchParams.set("error", "confirmation_failed");
      return NextResponse.redirect(errorUrl);
    }

    // Success - redirect to confirmed page using production URL
    console.log("[Email Confirmation API] Email confirmed successfully");
    const successUrl = new URL("/confirmed", NEXTAUTH_URL);
    successUrl.searchParams.set("success", "true");
    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("[Email Confirmation API] Unexpected error:", error);

    const errorUrl = new URL("/confirmed", NEXTAUTH_URL);
    errorUrl.searchParams.set("error", "server_error");
    return NextResponse.redirect(errorUrl);
  }
}
