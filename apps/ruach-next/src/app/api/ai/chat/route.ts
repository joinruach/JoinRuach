import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@/lib/auth";

/**
 * Pre-built responses for unauthenticated users
 * No AI usage - just guiding them to sign up
 */
const SIGNUP_PROMPTS: Record<string, string[]> = {
  en: [
    "Welcome to Ruach! 🌟 I'd love to help you on your spiritual journey. To get personalized guidance and access our AI assistant, please create a free account or sign in.\n\n[Create Account](/en/signup) | [Sign In](/en/login)",
    "Great question! Our AI assistant can provide in-depth biblical insights and personalized spiritual guidance. Sign up for free to unlock this feature.\n\n[Get Started Free](/en/signup)",
    "I'm here to help! To give you the best experience with tailored responses and saved conversations, please log in or create an account. It only takes a moment!\n\n[Join Ruach](/en/signup) | [Log In](/en/login)",
  ],
  es: [
    "¡Bienvenido a Ruach! 🌟 Me encantaría ayudarte en tu camino espiritual. Para obtener orientación personalizada, crea una cuenta gratuita o inicia sesión.\n\n[Crear Cuenta](/es/signup) | [Iniciar Sesión](/es/login)",
    "¡Gran pregunta! Nuestro asistente de IA puede proporcionar conocimientos bíblicos profundos. Regístrate gratis para desbloquear esta función.\n\n[Comenzar Gratis](/es/signup)",
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

/**
 * Return signup prompt as SSE stream (no AI usage)
 */
function createSignupStream(locale: string): Response {
  const message = getSignupPrompt(locale);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Simulate typing effect with chunks
      const words = message.split(' ');
      let index = 0;

      const sendWord = () => {
        if (index < words.length) {
          const chunk = (index === 0 ? '' : ' ') + words[index];
          controller.enqueue(
            encoder.encode(`0:"${chunk.replace(/"/g, '\\"')}"\n`)
          );
          index++;
          setTimeout(sendWord, 30 + Math.random() * 20);
        } else {
          // Send finish message
          controller.enqueue(
            encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":0}}\n`)
          );
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

/**
 * Proxy request to AI Gateway
 */
async function proxyToGateway(
  req: NextRequest,
  userId: string,
  tier: string,
  locale: string
): Promise<Response> {
  const gatewayUrl = process.env.AI_GATEWAY_URL;
  if (!gatewayUrl) {
    throw new Error('AI_GATEWAY_URL not configured');
  }

  const body = await req.text();

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

  // Forward the streaming response
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Content-Type': response.headers.get('Content-Type') || 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit') || '',
      'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining') || '',
    },
  });
}

/**
 * AI Chat Endpoint - Thin Proxy to Gateway
 *
 * - Unauthenticated users: Returns signup prompt (no AI usage)
 * - Authenticated users: Proxies to AI Gateway
 *
 * POST /api/ai/chat
 */
export async function POST(req: NextRequest): Promise<Response> {
  // Get locale from header or default
  const locale = req.headers.get('x-locale') ||
    req.nextUrl.pathname.split('/')[1] ||
    'en';

  // Check authentication
  const session = await auth();

  // No session = unauthenticated
  if (!session?.user?.email) {
    return createSignupStream(locale);
  }

  const userId = session.user.id || session.user.email;
  const tier = (session.user as { tier?: string }).tier || 'free';

  // Check if gateway is configured
  const useGateway = !!process.env.AI_GATEWAY_URL;

  if (useGateway) {
    try {
      return await proxyToGateway(req, userId, tier, locale);
    } catch (error) {
      console.error('[AI Chat] Gateway error:', error);
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }
  }

  // Fallback: Return error if no gateway and no direct implementation
  // The old /api/chat route can still be used as fallback
  return NextResponse.json(
    { error: 'Please use /api/chat for direct AI access' },
    { status: 501 }
  );
}
