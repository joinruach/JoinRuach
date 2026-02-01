import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

/**
 * Ruach AI Assistant API Route
 *
 * This route proxies requests to the Strapi ruach-generation endpoint.
 * It handles:
 * - Authentication and authorization
 * - Request validation
 * - Streaming responses
 * - Error handling
 *
 * POST /api/assistant
 * Body: { messages: Array<{ role: 'user' | 'assistant', content: string }> }
 *
 * Returns: Streaming response with AI-generated content
 */

const STRAPI_URL = process.env.STRAPI_URL || process.env.NEXT_PUBLIC_STRAPI_URL;
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AssistantRequest {
  messages: AssistantMessage[];
  mode?: 'Q&A' | 'Study Guide' | 'Sermon Prep';
  streaming?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get user session for authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    let body: AssistantRequest;
    try {
      body = await request.json();
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Validate message structure
    for (const msg of body.messages) {
      if (!msg.role || !msg.content || typeof msg.content !== 'string') {
        return NextResponse.json(
          { error: 'Each message must have role and content fields' },
          { status: 400 }
        );
      }
      if (!['user', 'assistant'].includes(msg.role)) {
        return NextResponse.json(
          { error: 'Message role must be "user" or "assistant"' },
          { status: 400 }
        );
      }
    }

    // Validate Strapi configuration
    if (!STRAPI_URL) {
      console.error('STRAPI_URL is not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Prepare headers for Strapi
    const strapiHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'User-Agent': 'Ruach-Assistant/1.0',
    };

    // Add authentication if available
    if (STRAPI_API_TOKEN) {
      strapiHeaders['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
    }

    // Add user context
    if (session.user?.email) {
      strapiHeaders['X-User-Email'] = session.user.email;
    }

    const strapiUrl = new URL('/api/ruach-generation/chat', STRAPI_URL).toString();

    // Prepare request payload
    const payload = {
      messages: body.messages,
      mode: body.mode || 'Q&A',
      userId: (session.user as any)?.id || undefined,
      userEmail: session.user?.email,
      streaming: body.streaming !== false, // Default to streaming
    };

    // Make request to Strapi backend
    const strapiResponse = await fetch(strapiUrl, {
      method: 'POST',
      headers: strapiHeaders,
      body: JSON.stringify(payload),
    });

    // Handle Strapi errors
    if (!strapiResponse.ok) {
      const errorText = await strapiResponse.text();
      console.error(`Strapi API error: ${strapiResponse.status}`, errorText);

      // Return appropriate error response
      if (strapiResponse.status === 401) {
        return NextResponse.json(
          { error: 'Failed to authenticate with generation service' },
          { status: 500 }
        );
      }

      if (strapiResponse.status === 429) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }

      if (strapiResponse.status === 400) {
        let errorMessage = 'Invalid request to generation service';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Keep default error message
        }
        return NextResponse.json(
          { error: errorMessage },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to generate response. Please try again.' },
        { status: 500 }
      );
    }

    // Check if response is streaming
    const contentType = strapiResponse.headers.get('content-type');
    if (contentType?.includes('text/event-stream')) {
      // Proxy streaming response directly
      return new NextResponse(strapiResponse.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const responseData = await strapiResponse.json();

    // Transform response if needed
    const transformedResponse = {
      success: true,
      data: responseData,
      metadata: {
        userId: (session.user as any)?.id,
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('Assistant API error:', error);

    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/assistant
 *
 * Returns assistant metadata and capabilities
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      capabilities: {
        modes: ['Q&A', 'Study Guide', 'Sermon Prep'],
        maxMessageLength: 4000,
        streaming: true,
        features: {
          citations: true,
          scriptureLookup: true,
          qualityScoring: true,
        },
      },
      userInfo: {
        email: session.user?.email,
        authenticated: true,
      },
    });
  } catch (error) {
    console.error('Assistant metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assistant metadata' },
      { status: 500 }
    );
  }
}
