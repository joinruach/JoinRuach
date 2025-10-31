import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const confirmation = request.nextUrl.searchParams.get("confirmation");
  const redirectUrl = new URL("/confirmed", request.nextUrl.origin);

  if (confirmation) {
    redirectUrl.searchParams.set("confirmation", confirmation);
  }

  return NextResponse.redirect(redirectUrl);
}
