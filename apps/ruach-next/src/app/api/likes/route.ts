import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

/**
 * Toggle a like (authenticated users only)
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.strapiJwt) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { contentType, contentId } = body;

  if (!contentType || !contentId) {
    return NextResponse.json(
      { error: 'contentType and contentId are required' },
      { status: 400 }
    );
  }

  const response = await fetch(`${strapiUrl}/api/content-likes/toggle`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.strapiJwt}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contentType, contentId }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: response.status }
    );
  }

  const data = await response.json();
  return NextResponse.json(data);
}

/**
 * Get like count (public) or check if user liked (authenticated)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const contentType = searchParams.get('contentType');
  const contentId = searchParams.get('contentId');
  const action = searchParams.get('action') || 'count';

  if (!contentType || !contentId) {
    return NextResponse.json(
      { error: 'contentType and contentId are required' },
      { status: 400 }
    );
  }

  if (action === 'check') {
    const session = await auth();
    if (!session?.strapiJwt) {
      return NextResponse.json({ liked: false });
    }

    const response = await fetch(
      `${strapiUrl}/api/content-likes/check/${contentType}/${contentId}`,
      {
        headers: { Authorization: `Bearer ${session.strapiJwt}` },
      }
    );

    if (!response.ok) {
      return NextResponse.json({ liked: false });
    }

    const data = await response.json();
    return NextResponse.json(data);
  }

  // Public count — no auth needed
  const response = await fetch(
    `${strapiUrl}/api/content-likes/count/${contentType}/${contentId}`
  );

  if (!response.ok) {
    return NextResponse.json({ count: 0 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
