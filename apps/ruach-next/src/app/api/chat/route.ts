import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { SYSTEM_PROMPT, formatContextForPrompt } from '@ruach/ai/chat';
import { getRelevantContext } from '@/lib/ai/rag';
import { createConversation, saveMessage } from '@/lib/db/ai';

/**
 * AI Chat Endpoint
 * Provides streaming responses from the Ruach AI Assistant
 *
 * POST /api/chat
 * Body: { messages: Message[], conversationId?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Messages array required' }, { status: 400 });
    }

    // Check for API key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json(
        { error: 'AI assistant not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Get user session for personalization
    const session = await getServerSession();
    const userId = session?.user?.email ? hashEmail(session.user.email) : undefined;

    // Get last user message for context
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content || '';

    // RAG: Get relevant context from knowledge base
    let context = '';
    try {
      const useSemanticSearch =
        process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED === 'true' &&
        !!process.env.OPENAI_API_KEY;

      const { searchResults, userHistory } = await getRelevantContext(query, {
        userId,
        limit: 5,
        useSemanticSearch,
      });

      context = formatContextForPrompt(searchResults, userHistory);
    } catch (error) {
      console.error('RAG context error:', error);
      // Continue without context
    }

    const systemPrompt = SYSTEM_PROMPT + (context ? '\n\n' + context : '');

    // Stream response using Anthropic Claude
    const result = await streamText({
      model: createAnthropic({ apiKey })('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // Save conversation to database (async, non-blocking)
    if (userId) {
      saveConversationAsync(userId, conversationId, messages, query).catch((err) =>
        console.error('Failed to save conversation:', err)
      );
    }

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

/**
 * Save conversation asynchronously
 */
async function saveConversationAsync(
  userId: number,
  conversationId: number | undefined,
  messages: any[],
  query: string
) {
  try {
    // Create conversation if new
    let convId = conversationId;
    if (!convId) {
      const title = query.substring(0, 50) + (query.length > 50 ? '...' : '');
      const conv = await createConversation(userId, title);
      convId = conv.id;
    }

    // Save the last user message
    if (convId) {
      await saveMessage({
        conversationId: convId,
        role: 'user',
        content: query,
      });
    }
  } catch (error) {
    console.error('Error saving conversation:', error);
    // Don't throw - this is non-critical
  }
}

/**
 * Simple hash function for email to numeric ID
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
