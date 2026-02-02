import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";
import { SYSTEM_PROMPT, formatContextForPrompt } from '@ruach/ai/chat';
import { getRelevantContext } from '@/lib/ai/rag';
import { createConversation, saveMessage } from '@/lib/db/ai';

// Type definitions for chat messages
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  name?: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  conversationId?: number;
  mode?: 'pastoral' | 'study' | 'creative' | 'ops';
}

// Pre-built signup prompts for unauthenticated users (no AI usage)
const SIGNUP_PROMPTS: Record<string, string[]> = {
  en: [
    "Welcome to Ruach! 🌟 I'd love to help you on your spiritual journey. To get personalized guidance and access our AI assistant, please create a free account or sign in.\n\n[Create Account](/en/signup) | [Sign In](/en/login)",
    "Great question! Our AI assistant can provide in-depth biblical insights and personalized spiritual guidance. Sign up for free to unlock this feature.\n\n[Get Started Free](/en/signup)",
  ],
  es: [
    "¡Bienvenido a Ruach! 🌟 Me encantaría ayudarte en tu camino espiritual. Para obtener orientación personalizada, crea una cuenta gratuita o inicia sesión.\n\n[Crear Cuenta](/es/signup) | [Iniciar Sesión](/es/login)",
  ],
  fr: [
    "Bienvenue chez Ruach! 🌟 J'aimerais vous aider dans votre cheminement spirituel. Créez un compte gratuit ou connectez-vous.\n\n[Créer un Compte](/fr/signup) | [Se Connecter](/fr/login)",
  ],
  pt: [
    "Bem-vindo ao Ruach! 🌟 Adoraria ajudá-lo em sua jornada espiritual. Crie uma conta gratuita ou faça login.\n\n[Criar Conta](/pt/signup) | [Entrar](/pt/login)",
  ],
};

function getSignupPrompt(locale: string): string {
  const prompts = SIGNUP_PROMPTS[locale] || SIGNUP_PROMPTS.en;
  return prompts[Math.floor(Math.random() * prompts.length)]!;
}

// Create signup stream response (no AI usage)
function createSignupStream(locale: string): Response {
  const message = getSignupPrompt(locale);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const words = message.split(' ');
      let index = 0;

      const sendWord = () => {
        if (index < words.length) {
          const chunk = (index === 0 ? '' : ' ') + words[index];
          controller.enqueue(encoder.encode(`0:"${chunk.replace(/"/g, '\\"')}"\n`));
          index++;
          setTimeout(sendWord, 30 + Math.random() * 20);
        } else {
          controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`));
          controller.close();
        }
      };
      sendWord();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Auth-Required': 'true',
    },
  });
}

// Proxy to AI Gateway
async function proxyToGateway(
  body: string,
  userId: string,
  tier: string,
  locale: string
): Promise<Response> {
  const gatewayUrl = process.env.AI_GATEWAY_URL;
  if (!gatewayUrl) throw new Error('AI_GATEWAY_URL not configured');

  const response = await fetch(`${gatewayUrl}/v1/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-auth': process.env.AI_GATEWAY_SHARED_SECRET!,
      'x-user-id': userId,
      'x-user-tier': tier,
      'x-user-locale': locale,
    },
    body,
  });

  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}

// Type guards
function isChatMessage(msg: unknown): msg is ChatMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Partial<ChatMessage>;
  return (
    (m.role === 'user' || m.role === 'assistant' || m.role === 'system') &&
    typeof m.content === 'string' &&
    m.content.length > 0 &&
    (m.name === undefined || typeof m.name === 'string')
  );
}

function assertChatRequestBody(body: unknown): asserts body is ChatRequestBody {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body');
  }

  const b = body as Partial<ChatRequestBody>;

  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    throw new Error('Messages array required and must not be empty');
  }

  if (!b.messages.every(isChatMessage)) {
    throw new Error('Invalid message format. Each message must have role and content.');
  }

  if (b.conversationId !== undefined && typeof b.conversationId !== 'number') {
    throw new Error('conversationId must be a number');
  }
}

/**
 * AI Chat Endpoint
 * Provides streaming responses from the Ruach AI Assistant
 *
 * - Unauthenticated users: Returns signup prompt (no AI usage)
 * - Authenticated users: Uses AI Gateway if configured, else direct Anthropic
 *
 * POST /api/chat
 * Body: { messages: Message[], conversationId?: number, mode?: string }
 */
export async function POST(req: NextRequest): Promise<Response> {
  // Get locale from URL or header
  const locale = req.headers.get('x-locale') ||
    req.nextUrl.pathname.split('/')[1] ||
    'en';

  // Check authentication FIRST
  const session = await auth();

  // Unauthenticated users get signup prompt (NO AI USAGE)
  if (!session?.user?.email) {
    return createSignupStream(locale);
  }

  let body: unknown;
  let rawBody: string;
  try {
    rawBody = await req.text();
    body = JSON.parse(rawBody);
  } catch (error) {
    return Response.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  try {
    assertChatRequestBody(body);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Invalid request' },
      { status: 400 }
    );
  }

  const { messages, conversationId } = body;

  // Check if AI Gateway is configured
  const useGateway = !!process.env.AI_GATEWAY_URL && !!process.env.AI_GATEWAY_SHARED_SECRET;

  if (useGateway) {
    try {
      const userId = session.user.id || session.user.email;
      const tier = (session.user as { tier?: string }).tier || 'free';
      return await proxyToGateway(rawBody, userId, tier, locale);
    } catch (error) {
      console.error('[Chat] Gateway error, falling back to direct:', error);
      // Fall through to direct implementation
    }
  }

  try {
    // Check for API key (direct mode)
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not configured');
      return Response.json(
        { error: 'AI assistant not configured. Please contact support.' },
        { status: 503 }
      );
    }

    // Get user session for personalization
    const userEmail = session.user.email;
    const userId = userEmail ? hashEmail(userEmail) : undefined;

    // Get last user message for context
    const lastMessage = messages[messages.length - 1];
    const query = lastMessage.content;

    // RAG: Get relevant context from knowledge base
    let context = '';
    let sources: Array<{ title: string; url: string }> = [];
    try {
      const useSemanticSearch =
        (process.env.SEMANTIC_SEARCH_ENABLED === 'true' ||
          process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED === 'true') &&
        !!process.env.OPENAI_API_KEY;

      const rag = await getRelevantContext(query, {
        userId,
        limit: 5,
        useSemanticSearch,
      });

      context = rag.contextText || formatContextForPrompt(rag.searchResults, rag.userHistory);
      sources = rag.sources;

      const contextChars = context?.length || 0;

      // structured observability
      console.info(
        JSON.stringify({
          event: 'rag.context',
          mode: rag.metrics.mode,
          fallbackUsed: rag.metrics.fallbackUsed,
          semanticEnabled: rag.metrics.semantic.enabled,
          semanticAttempted: rag.metrics.semantic.attempted,
          semanticChunks: rag.metrics.semantic.chunks,
          semanticEmpty: rag.metrics.semantic.empty,
          semanticError: rag.metrics.semantic.error,
          keywordAttempted: rag.metrics.keyword.attempted,
          keywordHits: rag.metrics.keyword.hits,
          chunksReturned: rag.effectiveChunksReturned,
          semanticChunksReturned: rag.semanticChunksReturned,
          keywordChunksReturned: rag.keywordHits,
          contextChars,
          retrievalOk: contextChars > 0,
          useSemanticSearch,
        })
      );
    } catch (error) {
      console.error('RAG context error:', error);
      // Continue without context
    }

    const citeNote = context ? '\n\nUse the provided SOURCE blocks for facts and include brief citations like [S1].' : '';
    const systemPrompt = SYSTEM_PROMPT + citeNote + (context ? '\n\n' + context : '');

    // Stream response using Anthropic Claude
    const result = await streamText({
      model: createAnthropic({ apiKey })('claude-3-5-sonnet-20241022'),
      system: systemPrompt,
      messages,
      temperature: 0.7,
      maxOutputTokens: 1000,
    });

    // Save conversation to database (async, non-blocking)
    if (userId !== undefined) {
      saveConversationAsync(userId, conversationId, messages, query).catch((err) =>
        console.error('Failed to save conversation:', err)
      );
    }

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process chat request' },
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
  messages: ChatMessage[],
  query: string
): Promise<void> {
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
  if (typeof email !== 'string' || email.length === 0) {
    throw new Error('Invalid email for hashing');
  }

  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
