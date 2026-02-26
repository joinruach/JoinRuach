import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export async function GET() {
  const session = await auth();

  if (!session?.strapiJwt) {
    return NextResponse.json({ likes: [] });
  }

  try {
    const response = await fetch(`${strapiUrl}/api/content-likes/user`, {
      headers: { Authorization: `Bearer ${session.strapiJwt}` },
    });

    if (!response.ok) {
      return NextResponse.json({ likes: [] });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ likes: [] });
  }
}
