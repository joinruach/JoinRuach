import { NextResponse } from "next/server";

// ============================================================================
// TYPE DEFINITIONS - Cover all Telegram update types
// ============================================================================

type TelegramUser = {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_bot?: boolean;
};

type TelegramChat = {
  id: number;
  type: string;
};

type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

type TelegramDocument = {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type TelegramAudio = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  title?: string;
  performer?: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type TelegramVideo = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  width: number;
  height: number;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
};

type TelegramVoice = {
  file_id: string;
  file_unique_id: string;
  duration: number;
  mime_type?: string;
  file_size?: number;
};

type TelegramMessage = {
  message_id: number;
  date: number;
  text?: string;
  caption?: string;
  chat: TelegramChat;
  from?: TelegramUser;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  audio?: TelegramAudio;
  video?: TelegramVideo;
  voice?: TelegramVoice;
  video_note?: {
    file_id: string;
    file_unique_id: string;
    length: number;
    duration: number;
    file_size?: number;
  };
};

type TelegramWebhookUpdate = {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: {
    id: string;
    from: TelegramUser;
    message?: TelegramMessage;
    data?: string;
  };
  inline_query?: {
    id: string;
    from: TelegramUser;
    query: string;
  };
  my_chat_member?: {
    chat: TelegramChat;
    from: TelegramUser;
    date: number;
  };
};

type ActorContext = {
  userId?: number;
  chatId?: number;
  text?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
};

// ============================================================================
// CONFIGURATION - Parsed once at module load for performance
// ============================================================================

const ALLOWED_USER_IDS = (() => {
  const raw = process.env.TELEGRAM_ALLOWED_USER_IDS || "";
  if (!raw.trim()) return null; // null = no whitelist configured

  return raw
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
})();

// Explicit whitelist requirement (overrides NODE_ENV check)
const REQUIRE_WHITELIST = process.env.TELEGRAM_REQUIRE_WHITELIST === "true";

// Log stacks in production (disabled by default for security)
const LOG_STACKS = process.env.LOG_STACKS === "true";

// Redis configuration for deduplication and rate limiting
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_ENABLED = Boolean(REDIS_URL && REDIS_TOKEN);

// Fail-closed mode: require Redis in production
const REQUIRE_REDIS = process.env.TELEGRAM_REQUIRE_REDIS === "true";

// Request limits (flood control)
const MAX_BODY_SIZE = 256 * 1024; // 256 KB
const RATE_LIMIT_USER = 30; // 30 messages per minute per user
const RATE_LIMIT_CHAT = 60; // 60 messages per minute per chat

// Boot-time validation
if (REQUIRE_WHITELIST && ALLOWED_USER_IDS === null) {
  console.error(
    "⚠️  TELEGRAM_REQUIRE_WHITELIST=true but TELEGRAM_ALLOWED_USER_IDS not set. " +
      "Bot will reject all requests."
  );
}

if (process.env.NODE_ENV === "production" && ALLOWED_USER_IDS === null && !REQUIRE_WHITELIST) {
  console.warn(
    "⚠️  Production mode without TELEGRAM_ALLOWED_USER_IDS. " +
      "Set TELEGRAM_REQUIRE_WHITELIST=true to enforce whitelist."
  );
}

if (!REDIS_ENABLED) {
  console.warn(
    "⚠️  Redis not configured - update deduplication and rate limiting disabled. " +
      "Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for production."
  );
}

if (REQUIRE_REDIS && !REDIS_ENABLED) {
  console.error(
    "⚠️  TELEGRAM_REQUIRE_REDIS=true but Redis not configured. " +
      "Bot will reject all requests."
  );
}

// ============================================================================
// FILE HANDLING UTILITIES
// ============================================================================

/**
 * Get MIME type from file extension
 */
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();

  const mimeTypes: Record<string, string> = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',

    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    'json': 'application/json',
    'xml': 'application/xml',

    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'oga': 'audio/ogg',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'flac': 'audio/flac',

    // Video
    'mp4': 'video/mp4',
    'avi': 'video/x-msvideo',
    'mov': 'video/quicktime',
    'wmv': 'video/x-ms-wmv',
    'webm': 'video/webm',
    'mkv': 'video/x-matroska',

    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip',
  };

  return mimeTypes[ext || ''] || 'application/octet-stream';
}

/**
 * Get file metadata from Telegram Bot API
 */
async function getTelegramFile(fileId: string): Promise<{ file_path: string } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const data = await res.json();
    return data.ok ? data.result : null;
  } catch (error) {
    safeLog("error", "Failed to get Telegram file", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
}

/**
 * Download file from Telegram and upload to Strapi
 * Returns Strapi file ID if successful, null otherwise
 */
async function uploadTelegramFileToStrapi(
  fileId: string,
  fileName?: string,
  mimeType?: string
): Promise<number | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const strapiUrl = process.env.STRAPI_URL || "http://localhost:1337";
  const strapiToken = process.env.STRAPI_API_TOKEN;

  if (!token || !strapiToken) return null;

  try {
    // Get file path from Telegram
    const fileData = await getTelegramFile(fileId);
    if (!fileData?.file_path) return null;

    // Download file from Telegram
    const fileUrl = `https://api.telegram.org/file/bot${token}/${fileData.file_path}`;
    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) return null;

    // Get the file as a buffer
    const fileBuffer = await fileRes.arrayBuffer();

    // Determine filename
    const finalFileName = fileName || fileData.file_path.split("/").pop() || "file";

    // Determine MIME type (priority: provided > from filename > from response > default)
    let finalMimeType = mimeType;

    if (!finalMimeType) {
      // Try to get from filename extension
      finalMimeType = getMimeTypeFromExtension(finalFileName);
    }

    if (!finalMimeType || finalMimeType === 'application/octet-stream') {
      // Try to get from response Content-Type header
      const contentType = fileRes.headers.get('content-type');
      if (contentType && contentType !== 'application/octet-stream') {
        finalMimeType = contentType;
      }
    }

    // Default fallback (only if nothing else worked)
    if (!finalMimeType) {
      finalMimeType = 'application/octet-stream';
    }

    // Create FormData for Strapi upload
    const formData = new FormData();
    formData.append("files", new Blob([fileBuffer], { type: finalMimeType }), finalFileName);

    // Upload to Strapi
    const uploadRes = await fetch(`${strapiUrl}/api/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${strapiToken}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      safeLog("error", "Strapi upload failed", { errorPreview: errText.slice(0, 200) });
      return null;
    }

    const uploadedFiles = await uploadRes.json();
    return uploadedFiles?.[0]?.id || null;
  } catch (error) {
    safeLog("error", "Failed to upload file to Strapi", {
      error: error instanceof Error ? error.message : "Unknown error"
    });
    return null;
  }
}

/**
 * Extract and upload all files from a Telegram message
 * Returns array of Strapi file IDs
 */
async function processMessageFiles(message: TelegramMessage): Promise<number[]> {
  const fileIds: number[] = [];

  // Photo (array of sizes, take the largest)
  if (message.photo && message.photo.length > 0) {
    const largestPhoto = message.photo[message.photo.length - 1];
    const id = await uploadTelegramFileToStrapi(
      largestPhoto.file_id,
      `photo_${Date.now()}.jpg`,
      "image/jpeg"
    );
    if (id) fileIds.push(id);
  }

  // Document (PDFs, files, etc.)
  if (message.document) {
    const id = await uploadTelegramFileToStrapi(
      message.document.file_id,
      message.document.file_name,
      message.document.mime_type
    );
    if (id) fileIds.push(id);
  }

  // Audio
  if (message.audio) {
    const fileName = message.audio.file_name || `audio_${Date.now()}.mp3`;
    const id = await uploadTelegramFileToStrapi(
      message.audio.file_id,
      fileName,
      message.audio.mime_type
    );
    if (id) fileIds.push(id);
  }

  // Video
  if (message.video) {
    const fileName = message.video.file_name || `video_${Date.now()}.mp4`;
    const id = await uploadTelegramFileToStrapi(
      message.video.file_id,
      fileName,
      message.video.mime_type
    );
    if (id) fileIds.push(id);
  }

  // Voice message
  if (message.voice) {
    const id = await uploadTelegramFileToStrapi(
      message.voice.file_id,
      `voice_${Date.now()}.ogg`,
      message.voice.mime_type
    );
    if (id) fileIds.push(id);
  }

  // Video note (round videos)
  if (message.video_note) {
    const id = await uploadTelegramFileToStrapi(
      message.video_note.file_id,
      `videonote_${Date.now()}.mp4`,
      "video/mp4"
    );
    if (id) fileIds.push(id);
  }

  return fileIds;
}

// ============================================================================
// MAIN WEBHOOK HANDLER
// ============================================================================

/**
 * POST /api/telegram/webhook
 *
 * Telegram bot webhook for Ruach Capture System
 *
 * Security layers:
 * 0. Request shape validation (method, content-type, size)
 * 1. Webhook secret validation (constant-time)
 * 2. Update deduplication (Redis)
 * 3. User whitelist authorization
 * 4. Rate limiting (flood control)
 * 5. Capture API secret
 * 6. Strapi API token
 */
export async function POST(req: Request) {
  // Layer 0: Validate request shape (prevent abuse)

  // Check Content-Type
  const contentType = req.headers.get("content-type");
  if (!contentType || !contentType.toLowerCase().startsWith("application/json")) {
    safeLog("warn", "Invalid Content-Type", { contentType });
    return NextResponse.json({ ok: false, error: "Invalid content type" }, { status: 400 });
  }

  // Check body size (prevent memory spikes)
  // Note: This is header-based validation. If Content-Length is missing or incorrect,
  // we'll still parse the body. For production, configure your edge/proxy (Cloudflare,
  // nginx, Vercel) to enforce hard limits. This is defense-in-depth, not the primary control.
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
    safeLog("warn", "Request too large", { size: contentLength });
    return NextResponse.json({ ok: false, error: "Payload too large" }, { status: 413 });
  }

  // Layer 1: Verify webhook came from Telegram (constant-time comparison)
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!secretHeader || !expectedSecret || !constantTimeCompare(secretHeader, expectedSecret)) {
    safeLog("warn", "Invalid or missing webhook secret");
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = (await req.json()) as TelegramWebhookUpdate;

    // Layer 2: Deduplicate by update_id (prevents double-processing on retries)
    if (REQUIRE_REDIS && !REDIS_ENABLED) {
      // Fail-closed: Redis required but not available
      safeLog("error", "[tg.blocked.redis_fail_closed] Redis required but not configured", {
        updateId: update.update_id,
        counter: "tg.blocked.redis_fail_closed"
      });
      return NextResponse.json({ ok: true }); // Stealth mode (looks like success)
    }

    if (REDIS_ENABLED) {
      const isDuplicate = await checkAndMarkUpdateProcessed(update.update_id);
      if (isDuplicate) {
        safeLog("info", "[tg.blocked.duplicate] Duplicate update ignored", {
          updateId: update.update_id,
          counter: "tg.blocked.duplicate"
        });
        return NextResponse.json({ ok: true }); // Identical response to success
      }
    }

    // Extract actor (userId) and context from any update type
    const actor = extractActor(update);

    // If no actor (user ID), treat as system update and ignore
    if (!actor.userId) {
      return NextResponse.json({ ok: true });
    }

    // Layer 3: Check user authorization
    if (!isAllowedUser(actor.userId)) {
      safeLog("warn", "[tg.blocked.whitelist] Unauthorized user", {
        userId: actor.userId,
        chatId: actor.chatId,
        updateId: update.update_id,
        counter: "tg.blocked.whitelist"
      });

      // Silent block - prevents revealing bot is restricted
      if (process.env.TELEGRAM_SILENT_BLOCK === "true") {
        return NextResponse.json({ ok: true }); // Identical to success
      }

      // Explicit block - sends message to user
      if (actor.chatId) {
        await sendReply(actor.chatId, "⛔ Unauthorized user. This bot is private.");
      }
      return NextResponse.json({ ok: false }, { status: 403 });
    }

    // Layer 4: Rate limiting (flood control)
    if (REDIS_ENABLED) {
      const isRateLimited = await checkRateLimit(actor.userId, actor.chatId);
      if (isRateLimited) {
        safeLog("warn", "[tg.blocked.ratelimit] Rate limit exceeded", {
          userId: actor.userId,
          chatId: actor.chatId,
          updateId: update.update_id,
          counter: "tg.blocked.ratelimit"
        });

        // Silent block (same as success)
        return NextResponse.json({ ok: true });
      }
    }

    // Only process message-type updates (not callbacks, inline queries, etc.)
    if (!update.message) {
      return NextResponse.json({ ok: true });
    }

    const text = actor.text || "";
    const chatId = actor.chatId!;

    // Handle /start command
    if (text === "/start") {
      await sendReply(
        chatId,
        "✅ Ruach Vault connected!\n\nSend me any thought and I'll store it forever.\n\n" +
          "💡 Quick tip: You can add metadata like this:\n" +
          "type:parable | title:My Title | topics:tag1,tag2 | Your content here..."
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /help command
    if (text === "/help") {
      await sendReply(
        chatId,
        "📖 Ruach Vault Help\n\n" +
          "Just send any text and it will be captured.\n\n" +
          "Optional metadata format:\n" +
          "type:TYPE | title:TITLE | topics:TAG1,TAG2 | CONTENT\n\n" +
          "Types: parable, idea, teaching, quote, outline, prayer, script, dream, warning\n\n" +
          "Example:\n" +
          "type:parable | topics:calling,authority | Power doesn't need permission...\n\n" +
          "Commands:\n" +
          "/start - Connect to vault\n" +
          "/help - Show this help\n" +
          "/whoami - Get your Telegram user ID"
      );
      return NextResponse.json({ ok: true });
    }

    // Handle /whoami command
    if (text === "/whoami") {
      const username = actor.username || "unknown";
      const fullName = `${actor.firstName || ""} ${actor.lastName || ""}`.trim() || "Anonymous";

      await sendReply(
        chatId,
        `👤 Your Telegram Info:\n\n` +
          `User ID: ${actor.userId}\n` +
          `Username: @${username}\n` +
          `Name: ${fullName}\n\n` +
          `💡 To whitelist yourself, add this to .env:\n` +
          `TELEGRAM_ALLOWED_USER_IDS=${actor.userId}`
      );
      return NextResponse.json({ ok: true });
    }

    // Process any file attachments first
    const fileIds = await processMessageFiles(update.message);

    // Require either text or files
    if (!text && fileIds.length === 0) {
      await sendReply(chatId, "📝 Send text, files, or both. I'll store them in the vault.");
      return NextResponse.json({ ok: true });
    }

    // Parse message (supports optional metadata via pipe syntax)
    const parsed = parseSmartMessage(text);

    // Layer 4: Forward to capture API with secret
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const captureRes = await fetch(`${appUrl}/api/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-capture-secret": process.env.CAPTURE_SECRET || "",
      },
      body: JSON.stringify({
        text: parsed.body || "(Media attachment)",
        title: parsed.title,
        type: parsed.type,
        topics: parsed.topics,
        source: "Telegram",
        mediaIds: fileIds.length > 0 ? fileIds : undefined,
      }),
    });

    if (!captureRes.ok) {
      const errText = await captureRes.text();
      // Log safe metadata only
      safeLog("error", "[tg.forwarded.capture_fail] Capture API error", {
        status: captureRes.status,
        userId: actor.userId,
        chatId: actor.chatId,
        updateId: update.update_id,
        errorPreview: errText.slice(0, 200),
        counter: "tg.forwarded.capture_fail"
      });
      await sendReply(chatId, `❌ Capture failed:\n${errText.slice(0, 800)}`);
      return NextResponse.json({ ok: false }, { status: 500 });
    }

    const result = await captureRes.json();

    // Log successful capture
    safeLog("info", "[tg.forwarded.capture_ok] Message captured successfully", {
      userId: actor.userId,
      chatId: actor.chatId,
      updateId: update.update_id,
      counter: "tg.forwarded.capture_ok"
    });

    // Send confirmation
    const title = result?.saved?.title || parsed.title || "Saved";
    const deduped = result?.deduped ? " (already exists)" : "";
    const type = result?.meta?.type || parsed.type || "idea";

    await sendReply(chatId, `✅ Stored${deduped}\n\n📝 "${title}"\n🏷️ Type: ${type}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Log only safe metadata (never message content or secrets)
    const logPayload: Record<string, unknown> = {
      error: error instanceof Error ? error.message : "Unknown error",
    };

    // Only log stacks if explicitly enabled (prevents info leaks)
    if (LOG_STACKS && error instanceof Error) {
      logPayload.stack = error.stack;
    }

    safeLog("error", "Webhook processing failed", logPayload);

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safe logger that enforces "never log content" guardrail
 *
 * Recursively redacts sensitive fields in nested objects/arrays:
 * text, message, body, caption, data, headers, token, secret, password,
 * key, authorization, cookie, jwt, session, bearer
 */
function safeLog(
  level: "info" | "warn" | "error",
  message: string,
  data?: Record<string, unknown>
): void {
  const FORBIDDEN_KEYS = [
    "text",
    "message",
    "body",
    "caption",
    "data",
    "headers",
    "token",
    "secret",
    "password",
    "key",
    "authorization",
    "auth",
    "cookie",
    "set-cookie",
    "jwt",
    "session",
    "bearer",
  ];

  /**
   * Recursively sanitize an object, redacting forbidden keys at any depth
   */
  function sanitize(value: unknown): unknown {
    // Primitives pass through
    if (value === null || value === undefined) return value;
    if (typeof value !== "object") return value;

    // Arrays: sanitize each element
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }

    // Objects: check each key and recurse
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const lowerKey = key.toLowerCase();
      const isForbidden = FORBIDDEN_KEYS.some((forbidden) => lowerKey.includes(forbidden));

      if (isForbidden) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitize(val); // Recurse into nested objects
      }
    }
    return sanitized;
  }

  const sanitized = data ? sanitize(data) : {};

  const logFn = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
  logFn(`[Telegram Webhook] ${message}`, sanitized);
}

/**
 * Rate limiting via Redis fixed-window counter
 *
 * Returns true if rate limit exceeded, false if allowed
 *
 * Limits:
 * - User: 30 messages per minute (fixed window)
 * - Chat: 60 messages per minute (fixed window)
 *
 * Implementation: Redis INCR with 60s TTL per minute bucket
 * Note: This is a fixed window, not a sliding window or token bucket.
 * Edge case: A user could send 30 messages at 00:59 and 30 at 01:00
 * for 60 total in 2 seconds. This is acceptable for our threat model.
 */
async function checkRateLimit(userId: number, chatId?: number): Promise<boolean> {
  if (!REDIS_ENABLED) {
    return false; // No Redis = no rate limiting (fail open)
  }

  const now = Math.floor(Date.now() / 1000);
  const minute = Math.floor(now / 60);

  try {
    // Check user rate limit (30/min)
    const userKey = `tg:rl:user:${userId}:${minute}`;
    const userRes = await fetch(`${REDIS_URL}/incr/${userKey}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const userData = await userRes.json();
    const userCount = userData.result || 0;

    // Set expiry on first increment (60s)
    if (userCount === 1) {
      await fetch(`${REDIS_URL}/expire/${userKey}/60`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      });
    }

    if (userCount > RATE_LIMIT_USER) {
      return true; // User rate limit exceeded
    }

    // Check chat rate limit (60/min) if chatId provided
    if (chatId) {
      const chatKey = `tg:rl:chat:${chatId}:${minute}`;
      const chatRes = await fetch(`${REDIS_URL}/incr/${chatKey}`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      });
      const chatData = await chatRes.json();
      const chatCount = chatData.result || 0;

      // Set expiry on first increment (60s)
      if (chatCount === 1) {
        await fetch(`${REDIS_URL}/expire/${chatKey}/60`, {
          headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
        });
      }

      if (chatCount > RATE_LIMIT_CHAT) {
        return true; // Chat rate limit exceeded
      }
    }

    return false; // Not rate limited
  } catch (error) {
    safeLog("error", "Rate limit check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false; // On error, allow processing (fail open)
  }
}

/**
 * Extract actor (user) and context from any Telegram update type
 *
 * Handles: message, edited_message, callback_query, inline_query,
 * channel_post, edited_channel_post, my_chat_member
 */
function extractActor(update: TelegramWebhookUpdate): ActorContext {
  // Priority: message > edited_message > callback_query > inline_query > channel_post > my_chat_member

  if (update.message) {
    return {
      userId: update.message.from?.id,
      chatId: update.message.chat?.id,
      text: (update.message.text || update.message.caption || "").trim(),
      username: update.message.from?.username,
      firstName: update.message.from?.first_name,
      lastName: update.message.from?.last_name,
    };
  }

  if (update.edited_message) {
    return {
      userId: update.edited_message.from?.id,
      chatId: update.edited_message.chat?.id,
      text: (update.edited_message.text || update.edited_message.caption || "").trim(),
      username: update.edited_message.from?.username,
      firstName: update.edited_message.from?.first_name,
      lastName: update.edited_message.from?.last_name,
    };
  }

  if (update.callback_query) {
    return {
      userId: update.callback_query.from.id,
      chatId: update.callback_query.message?.chat?.id,
      text: update.callback_query.data || "",
      username: update.callback_query.from.username,
      firstName: update.callback_query.from.first_name,
      lastName: update.callback_query.from.last_name,
    };
  }

  if (update.inline_query) {
    return {
      userId: update.inline_query.from.id,
      chatId: undefined, // No chat context in inline queries
      text: update.inline_query.query,
      username: update.inline_query.from.username,
      firstName: update.inline_query.from.first_name,
      lastName: update.inline_query.from.last_name,
    };
  }

  if (update.channel_post) {
    return {
      userId: update.channel_post.from?.id,
      chatId: update.channel_post.chat?.id,
      text: (update.channel_post.text || update.channel_post.caption || "").trim(),
      username: update.channel_post.from?.username,
      firstName: update.channel_post.from?.first_name,
      lastName: update.channel_post.from?.last_name,
    };
  }

  if (update.my_chat_member) {
    return {
      userId: update.my_chat_member.from.id,
      chatId: update.my_chat_member.chat.id,
      text: "",
      username: update.my_chat_member.from.username,
      firstName: update.my_chat_member.from.first_name,
      lastName: update.my_chat_member.from.last_name,
    };
  }

  return {}; // No recognized update type
}

/**
 * Check if a Telegram user ID is in the whitelist
 *
 * Behavior:
 * - TELEGRAM_REQUIRE_WHITELIST=true: Always require whitelist (deny if not configured)
 * - Production (NODE_ENV=production): Require whitelist (deny if not configured)
 * - Development: Allow all if no whitelist configured (convenience)
 */
function isAllowedUser(userId?: number): boolean {
  if (!userId) return false;

  // No whitelist configured
  if (ALLOWED_USER_IDS === null) {
    // Explicit requirement override
    if (REQUIRE_WHITELIST) {
      return false;
    }

    // Production: default deny
    if (process.env.NODE_ENV === "production") {
      return false;
    }

    // Development: default allow (convenience)
    return true;
  }

  // Empty whitelist = explicit deny (configuration error)
  if (ALLOWED_USER_IDS.length === 0) {
    return false;
  }

  return ALLOWED_USER_IDS.includes(String(userId));
}

/**
 * Constant-time string comparison (prevents timing attacks on secrets)
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check if update_id has been processed (deduplication via Redis)
 *
 * Returns true if duplicate, false if new
 * Uses SETNX with 5 minute expiry
 */
async function checkAndMarkUpdateProcessed(updateId: number): Promise<boolean> {
  if (!REDIS_ENABLED) {
    return false; // No Redis = no deduplication (fail open)
  }

  const key = `tg:update:${updateId}`;

  try {
    // SETNX: Set if not exists
    const setRes = await fetch(`${REDIS_URL}/setnx/${key}/1`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });

    const setData = await setRes.json();

    // result = 1 means key was set (new), result = 0 means key exists (duplicate)
    if (setData.result === 0) {
      return true; // Duplicate
    }

    // Set 5 minute expiry on new key
    await fetch(`${REDIS_URL}/expire/${key}/300`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });

    return false; // New update
  } catch (error) {
    safeLog("error", "Redis deduplication failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return false; // On error, allow processing (fail open)
  }
}

/**
 * Send a message back to the user
 */
async function sendReply(chatId: number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    safeLog("error", "TELEGRAM_BOT_TOKEN not configured");
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
      }),
    });
  } catch (error) {
    safeLog("error", "Failed to send Telegram reply", {
      chatId,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

/**
 * Parse smart message format with optional metadata
 *
 * Supports: "type:parable | title:My Title | topics:tag1,tag2 | Your content here..."
 * Or just plain text: "Your content here..."
 */
function parseSmartMessage(input: string): {
  title?: string;
  type?: string;
  topics?: string[];
  body: string;
} {
  let title: string | undefined;
  let type: string | undefined;
  let topics: string[] | undefined;

  const parts = input.split("|").map((p) => p.trim());

  if (parts.length === 1) {
    return { body: input };
  }

  const bodyParts: string[] = [];
  for (const part of parts) {
    const match = part.match(/^(\w+)\s*:\s*(.+)$/i);
    if (!match) {
      bodyParts.push(part);
      continue;
    }

    const key = match[1].toLowerCase();
    const val = match[2].trim();

    if (key === "title") title = val;
    if (key === "type") type = val;
    if (key === "topics") {
      topics = val
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
    }
  }

  const body = bodyParts.join(" | ").trim() || input;
  return { title, type, topics, body };
}
