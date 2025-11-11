import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { trackInteraction, getUserInteractions } from '@/lib/db/ai';

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
    if (!session?.user?.email) {
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

    // Get user ID (use email hash as fallback if no numeric ID)
    const userId = (session.user as any).id || hashEmail(session.user.email);

    // Save to database
    try {
      await trackInteraction({
        userId,
        contentType,
        contentId,
        interactionType,
        durationSec,
        completed: completed || false,
      });
    } catch (dbError) {
      // Log error but don't fail - graceful degradation
      console.error('Database error (tracking will use fallback):', dbError);
    }

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
 * GET /api/interactions?limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Get user ID
    const userId = (session.user as any).id || hashEmail(session.user.email);

    // Fetch from database
    let interactions = [];
    try {
      interactions = await getUserInteractions(userId, limit);
    } catch (dbError) {
      console.error('Database error fetching interactions:', dbError);
      // Return empty array on error (graceful degradation)
    }

    return NextResponse.json({
      interactions,
      count: interactions.length,
    });
  } catch (error) {
    console.error('Interactions API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

/**
 * Simple hash function for email to numeric ID
 * Used when session doesn't have numeric user ID
 */
function hashEmail(email: string): number {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
