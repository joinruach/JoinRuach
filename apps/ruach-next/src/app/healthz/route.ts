import { NextResponse } from "next/server";
import { env } from "@/lib/env";

function normalizeBaseUrl(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

type ProbeResult = {
  ok: boolean;
  status: number | null;
  error: string | undefined;
};

async function probe(url: string): Promise<ProbeResult> {
  try {
    const response = await fetch(url, { method: "GET" });
    return { ok: response.ok, status: response.status, error: undefined };
  } catch (error) {
    return { ok: false, status: null, error: (error as Error).message };
  }
}

export async function GET() {
  const base = normalizeBaseUrl(env.NEXT_PUBLIC_STRAPI_URL);
  const checks: ProbeResult[] = [];

  const candidates = [`${base}/_health`, `${base}/admin`, base];
  let strapiResult: ProbeResult = { ok: false, status: null, error: undefined };

  for (const candidate of candidates) {
    const result = await probe(candidate);
    checks.push(result);
    if (result.ok) {
      strapiResult = result;
      break;
    }
    if (result.error && !strapiResult.error) {
      strapiResult.error = result.error;
    }
  }

  const statusCode = strapiResult.ok ? 200 : 503;

  return NextResponse.json(
    {
      ok: strapiResult.ok,
      timestamp: new Date().toISOString(),
      strapi: strapiResult,
      attempted: checks,
    },
    { status: statusCode }
  );
}
