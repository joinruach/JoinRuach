import { Hono } from "hono";
import { streamText } from "ai";
import { stream } from "hono/streaming";
import { nanoid } from "nanoid";
import { ChatRequestSchema, type ChatRequest } from "../types/index.js";
import { getAuthContext } from "../core/auth.js";
import type { AuthContext } from "../types/index.js";
import { checkTokenBudget, incrementTokenUsage } from "../core/ratelimit.js";
import { createUsageRecord, logUsage } from "../core/cost.js";
import { selectProvider, getSystemPrompt, buildContext } from "../core/provider-router.js";

const chat = new Hono();

/**
 * Pre-built responses for unauthenticated users
 * These guide users to sign up without using real AI
 */
const UNAUTHENTICATED_RESPONSES: Record<string, string[]> = {
  en: [
    "Welcome to Ruach! I'd love to help you on your spiritual journey. To get personalized guidance and access our AI assistant, please create a free account or sign in.",
    "Great question! Our AI assistant can provide in-depth biblical insights and personalized spiritual guidance. Sign up for free to unlock this feature.",
    "I'm here to help! To give you the best experience with tailored responses and saved conversations, please log in or create an account. It only takes a moment!",
  ],
  es: [
    "¡Bienvenido a Ruach! Me encantaría ayudarte en tu camino espiritual. Para obtener orientación personalizada y acceder a nuestro asistente de IA, crea una cuenta gratuita o inicia sesión.",
    "¡Gran pregunta! Nuestro asistente de IA puede proporcionar conocimientos bíblicos profundos y orientación espiritual personalizada. Regístrate gratis para desbloquear esta función.",
    "¡Estoy aquí para ayudarte! Para darte la mejor experiencia con respuestas personalizadas, inicia sesión o crea una cuenta. ¡Solo toma un momento!",
  ],
  fr: [
    "Bienvenue chez Ruach! J'aimerais vous aider dans votre cheminement spirituel. Pour obtenir des conseils personnalisés et accéder à notre assistant IA, créez un compte gratuit ou connectez-vous.",
    "Excellente question! Notre assistant IA peut fournir des aperçus bibliques approfondis et des conseils spirituels personnalisés. Inscrivez-vous gratuitement pour débloquer cette fonctionnalité.",
    "Je suis là pour vous aider! Pour vous offrir la meilleure expérience avec des réponses personnalisées, connectez-vous ou créez un compte. Cela ne prend qu'un instant!",
  ],
  pt: [
    "Bem-vindo ao Ruach! Adoraria ajudá-lo em sua jornada espiritual. Para obter orientação personalizada e acessar nosso assistente de IA, crie uma conta gratuita ou faça login.",
    "Ótima pergunta! Nosso assistente de IA pode fornecer insights bíblicos profundos e orientação espiritual personalizada. Cadastre-se gratuitamente para desbloquear este recurso.",
    "Estou aqui para ajudar! Para oferecer a melhor experiência com respostas personalizadas, faça login ou crie uma conta. Leva apenas um momento!",
  ],
};

/**
 * Get a response for unauthenticated users
 */
function getUnauthenticatedResponse(locale: string): string {
  const responses = (
    UNAUTHENTICATED_RESPONSES[locale as keyof typeof UNAUTHENTICATED_RESPONSES] ??
    UNAUTHENTICATED_RESPONSES.en
  ) as string[];
  return responses[Math.floor(Math.random() * responses.length)]!;
}

/**
 * Handle chat for unauthenticated users - no AI, just guidance
 */
function handleUnauthenticatedChat(locale: string): Response {
  const message = getUnauthenticatedResponse(locale);

  // Return as SSE format for consistency
  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    start(controller) {
      // Send the message as a single chunk
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: "text",
        text: message
      })}\n\n`));

      // Send auth required flag
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: "auth_required",
        action: "signup",
        message: "Please sign up or log in to continue"
      })}\n\n`));

      // Close the stream
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
    },
  });
}

/**
 * POST /v1/chat/stream
 * Streaming chat endpoint with SSE
 */
chat.post("/stream", async (c) => {
  const startTime = Date.now();
  const sessionId = nanoid();

  // Check if user is authenticated
  let auth: AuthContext;
  try {
    auth = getAuthContext(c);
  } catch {
    // No auth context - return signup prompt
    const locale = c.req.header("x-user-locale") || "en";
    return handleUnauthenticatedChat(locale);
  }

  // If we have auth but user is "anonymous" or similar, also redirect
  if (!auth.userId || auth.userId === "anonymous" || auth.userId === "guest") {
    return handleUnauthenticatedChat(auth.locale);
  }

  // Parse and validate request body
  let body: ChatRequest;
  try {
    const rawBody = await c.req.json();
    body = ChatRequestSchema.parse(rawBody);
  } catch (error) {
    return c.json({ error: "Invalid request body", details: error }, 400);
  }

  // Check token budget
  const estimatedTokens = body.messages.reduce((acc, m) => acc + m.content.length / 4, 0);
  const budget = await checkTokenBudget(auth.userId, auth.tier, Math.ceil(estimatedTokens));

  if (!budget.allowed) {
    return c.json(
      {
        error: "Daily token budget exceeded",
        used: budget.used,
        limit: budget.limit,
      },
      429
    );
  }

  // Select provider and model
  const { provider, model, languageModel } = selectProvider(body.mode, auth.tier);

  // Build system prompt
  const systemPrompt = getSystemPrompt(body.mode, body.locale);

  // Build RAG context if available
  const lastUserMessage = body.messages.filter((m) => m.role === "user").pop();
  const ragContext = lastUserMessage
    ? await buildContext(lastUserMessage.content, body.locale, body.mode)
    : null;

  // Prepare messages
  const messages = [
    { role: "system" as const, content: systemPrompt + (ragContext ? `\n\nContext:\n${ragContext}` : "") },
    ...body.messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  // Stream the response
  try {
    const result = streamText({
      model: languageModel as Parameters<typeof streamText>[0]["model"],
      messages,
      maxTokens: body.maxTokens,
      onFinish: async ({ usage }) => {
        // Log usage after completion
        const latencyMs = Date.now() - startTime;
        const usageRecord = createUsageRecord({
          userId: auth.userId,
          sessionId,
          provider,
          model,
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          latencyMs,
          mode: body.mode,
          locale: body.locale,
        });

        await logUsage(usageRecord);
        await incrementTokenUsage(auth.userId, usage.totalTokens);
      },
    });

    // Return SSE stream
    return stream(c, async (stream) => {
      // Send session ID first
      await stream.write(`data: ${JSON.stringify({ type: "session", sessionId })}\n\n`);

      // Stream text chunks
      for await (const chunk of result.textStream) {
        await stream.write(`data: ${JSON.stringify({ type: "text", text: chunk })}\n\n`);
      }

      // Send completion
      await stream.write("data: [DONE]\n\n");
    });
  } catch (error) {
    console.error("[CHAT ERROR]", error);
    return c.json({ error: "Failed to generate response" }, 500);
  }
});

/**
 * GET /v1/chat/health
 * Health check endpoint
 */
chat.get("/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export { chat };
