import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest } from 'next/server';
import { SYSTEM_PROMPT, formatContextForPrompt } from '@ruach/ai/chat';

/**
 * AI Chat Endpoint
 * Provides streaming responses from the Ruach AI Assistant
 *
 * POST /api/chat
 * Body: { messages: Message[], userId?: number }
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, userId } = await req.json();

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

    // Get last user message for context
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage?.content || '';

    // TODO: Implement RAG context retrieval
    // For now, use a simple context message
    const context = formatContextForPrompt([], []);

    const systemPrompt = SYSTEM_PROMPT + (context ? '\n\n' + context : '');

    // Stream response using Anthropic Claude
    const result = await streamText({
      model: createAnthropic({ apiKey })('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxTokens: 1000,
    });

    // TODO: Save conversation to database
    // saveConversation(userId, messages, result);

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
