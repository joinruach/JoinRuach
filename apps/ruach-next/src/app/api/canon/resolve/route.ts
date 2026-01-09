import { env } from "@/lib/env";
import { NextResponse } from "next/server";

const STRAPI_ENDPOINT = `${env.NEXT_PUBLIC_STRAPI_URL}/api/canon/resolve`;

// Specify runtime for Next.js 16
export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid JSON payload", details: error instanceof Error ? error.message : "unknown" },
      { status: 400 }
    );
  }

  let response;
  try {
    response = await fetch(STRAPI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Proxy error",
        details: error instanceof Error ? error.message : "unknown",
      },
      { status: 502 }
    );
  }

  const body = await response.text();
  const status = response.status;

  if (!response.ok) {
    return NextResponse.json(
      { error: "Upstream error", details: body },
      { status }
    );
  }

  try {
    const data = JSON.parse(body);
    return NextResponse.json(data, { status });
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON from Strapi" },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  const headers = new Headers();
  headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type");
  return new NextResponse(null, { status: 204, headers });
}

export async function GET() {
  return NextResponse.json({ error: "Use POST to resolve citations" }, { status: 405 });
}
