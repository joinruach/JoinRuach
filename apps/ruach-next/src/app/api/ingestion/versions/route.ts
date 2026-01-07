import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.strapiJwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const contentType = searchParams.get('contentType');

    const queryParams = new URLSearchParams();
    if (status) queryParams.set('status', status);
    if (contentType) queryParams.set('contentType', contentType);

    const response = await fetch(
      `${STRAPI_URL}/api/ingestion/versions?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.strapiJwt}`,
        },
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch versions' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Fetch versions error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fetch failed' },
      { status: 500 }
    );
  }
}
