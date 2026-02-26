import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Proxy to Strapi ruach-publisher/jobs endpoint.
 * Keeps Strapi URL + JWT server-side so client components can fetch safely.
 */
export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.strapiJwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get('status') || '';
  const page = searchParams.get('page') || '1';
  const limit = searchParams.get('limit') || '20';

  const params = new URLSearchParams({ page, limit });
  if (status) params.set('status', status);

  const response = await fetch(
    `${strapiUrl}/api/ruach-publisher/jobs?${params}`,
    {
      cache: 'no-store',
      headers: { Authorization: `Bearer ${session.strapiJwt}` },
    }
  );

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch publishing jobs' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}
