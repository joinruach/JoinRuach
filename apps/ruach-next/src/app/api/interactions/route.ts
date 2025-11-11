import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

/**
 * User Interactions Tracking API
 * Tracks user behavior for recommendations
 *
 * POST /api/interactions
 * Body: { contentType, contentId, interactionType, durationSec?, completed? }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contentType, contentId, interactionType, durationSec, completed } = body;

    // Validate required fields
    if (!contentType || !contentId || !interactionType) {
      return NextResponse.json(
        { error: 'Missing required fields: contentType, contentId, interactionType' },
        { status: 400 }
      );
    }

    // Validate interaction type
    const validTypes = ['view', 'complete', 'like', 'bookmark'];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: `Invalid interactionType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // TODO: Save to database
    // await db.userInteractions.create({
    //   userId: session.user.id,
    //   contentType,
    //   contentId,
    //   interactionType,
    //   durationSec,
    //   completed: completed || false,
    //   createdAt: new Date(),
    // });

    console.log('User interaction tracked:', {
      userId: session.user.email,
      contentType,
      contentId,
      interactionType,
    });

    return NextResponse.json({
      success: true,
      message: 'Interaction tracked successfully',
    });
  } catch (error) {
    console.error('Interactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to track interaction' },
      { status: 500 }
    );
  }
}

/**
 * GET user's interaction history
 * GET /api/interactions?userId=123&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // TODO: Fetch from database
    // const interactions = await db.userInteractions.findMany({
    //   where: { userId: session.user.id },
    //   orderBy: { createdAt: 'desc' },
    //   limit,
    // });

    return NextResponse.json({
      interactions: [], // Empty for now
      count: 0,
    });
  } catch (error) {
    console.error('Interactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
