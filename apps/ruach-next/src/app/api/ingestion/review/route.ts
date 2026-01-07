import { auth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.strapiJwt) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { versionId, action, notes, reviewData } = body;

    if (!versionId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: versionId, action' },
        { status: 400 }
      );
    }

    if (!['approved', 'rejected', 'needs_review'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approved, rejected, or needs_review' },
        { status: 400 }
      );
    }

    const response = await fetch(`${STRAPI_URL}/api/ingestion/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.strapiJwt}`,
      },
      body: JSON.stringify({
        versionId,
        action,
        notes,
        reviewData,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Review action failed: ${error}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Review action error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Review failed' },
      { status: 500 }
    );
  }
}
