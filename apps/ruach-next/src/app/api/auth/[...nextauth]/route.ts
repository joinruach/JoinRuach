import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authOptions } from "@/lib/auth";

const authHandler = NextAuth(authOptions);

export async function GET(request: NextRequest, context: { params: { nextauth?: string[] } }) {
  const [action] = context.params.nextauth ?? [];

  if (action === "email-confirmation") {
    const confirmation = request.nextUrl.searchParams.get("confirmation");
    const redirectUrl = new URL("/confirmed", request.nextUrl.origin);

    if (confirmation) {
      redirectUrl.searchParams.set("confirmation", confirmation);
    }

    return NextResponse.redirect(redirectUrl);
  }

  return authHandler(request, context);
}

export async function POST(request: NextRequest, context: { params: { nextauth?: string[] } }) {
  return authHandler(request, context);
}
