"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getOrCreateUserId } from "@/lib/formation/user-id";
import { redis } from "@/lib/redis";
import {
  FormationPhase,
  createCheckpointReachedEvent,
  createCheckpointCompletedEvent,
  createReflectionSubmittedEvent,
  createSectionViewedEvent,
  ReflectionType,
  AwakeningPhase,
  initializeFormationClient,
} from "@ruach/formation";

// ============================================================================
// WORD COUNT UTILITY (Unicode-safe, deterministic)
// ============================================================================

/**
 * Deterministic word count algorithm
 * MUST MATCH client-side validation in SectionView.tsx
 *
 * Unicode-safe: Uses [\p{L}\p{N}] to match letters and numbers across all languages
 * (Hebrew, Greek, accents, etc.) instead of ASCII-only \w pattern
 */
function countWords(text: string): number {
  // Normalize: trim leading/trailing whitespace
  const normalized = text.trim();

  // Handle empty string
  if (normalized.length === 0) return 0;

  // Split on any whitespace (space, tab, newline)
  const tokens = normalized.split(/\s+/);

  // Filter out empty tokens and punctuation-only tokens
  // Unicode-safe: matches letters (including Hebrew/Greek) and numbers, not just ASCII
  const HAS_WORD = /[\p{L}\p{N}]/u;
  const words = tokens.filter(token => {
    return token.length > 0 && HAS_WORD.test(token);
  });

  return words.length;
}

// ============================================================================
// DWELL SESSION MANAGEMENT (Redis-backed heartbeat tracking)
// ============================================================================

interface DwellSession {
  userId: string;
  sectionId: string;
  checkpointId: string;
  accumulatedSeconds: number;
  lastHeartbeatAt: number; // timestamp (ms)
  lastHeartbeatSeq: number; // monotonic sequence
  startedAt: number; // timestamp (ms)
}

/**
 * Get dwell session from Redis by attemptId
 */
async function getDwellSession(attemptId: string): Promise<DwellSession | null> {
  if (!redis) return null;

  const key = `dwell:attempt:${attemptId}`;
  const data = await redis.get(key);

  if (!data) return null;

  return typeof data === 'string' ? JSON.parse(data) : data;
}

/**
 * Get or create dwell session
 */
async function getOrCreateDwellSession(
  attemptId: string,
  initialData: Omit<DwellSession, 'accumulatedSeconds' | 'lastHeartbeatAt' | 'lastHeartbeatSeq'>
): Promise<DwellSession> {
  const existing = await getDwellSession(attemptId);

  if (existing) {
    return existing;
  }

  // Create new session
  const session: DwellSession = {
    ...initialData,
    accumulatedSeconds: 0,
    lastHeartbeatAt: Date.now(),
    lastHeartbeatSeq: 0,
  };

  if (redis) {
    const key = `dwell:attempt:${attemptId}`;
    await redis.set(key, JSON.stringify(session), { ex: 3600 }); // 1 hour TTL
  }

  return session;
}

/**
 * Save dwell session with TTL refresh
 */
async function saveDwellSession(attemptId: string, session: DwellSession, ttlSeconds: number): Promise<void> {
  if (!redis) return;

  const key = `dwell:attempt:${attemptId}`;
  await redis.set(key, JSON.stringify(session), { ex: ttlSeconds });
}

/**
 * Clear dwell session after successful submission
 */
async function clearDwellSession(attemptId: string): Promise<void> {
  if (!redis) return;

  const key = `dwell:attempt:${attemptId}`;
  await redis.del(key);
}

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CheckpointSubmissionSchema = z.object({
  checkpointId: z.string().min(1),
  sectionId: z.string().min(1),
  phase: z.nativeEnum(FormationPhase),
  dwellTimeSeconds: z.coerce.number().min(0),
  reflection: z.string().min(10, "Reflection must be at least 10 characters"),
  attemptId: z.string().min(1), // Session-scoped ID for heartbeat tracking
});

// ============================================================================
// FORM STATE TYPE
// ============================================================================

interface FormState {
  ok: boolean;
  message?: string;
  redirectTo?: string;
}

// ============================================================================
// SERVER ACTION: GET USER ID (callable from client)
// ============================================================================

export async function getUserId(): Promise<string> {
  const { userId } = await getOrCreateUserId();
  return userId;
}

// ============================================================================
// SERVER ACTION: TRACK DWELL HEARTBEAT
// ============================================================================

export async function trackDwellHeartbeat(formData: FormData): Promise<{
  ok: boolean;
  accumulatedSeconds: number;
  rateLimited?: boolean;
  duplicate?: boolean;
}> {
  try {
    // If Redis is not available, return 0 seconds (graceful degradation)
    if (!redis) {
      return { ok: true, accumulatedSeconds: 0 };
    }

    const sectionId = formData.get('sectionId') as string;
    const checkpointId = formData.get('checkpointId') as string;
    const userId = formData.get('userId') as string;
    const attemptId = formData.get('attemptId') as string;
    const heartbeatSeq = parseInt(formData.get('heartbeatSeq') as string);

    // Rate limit: 1 heartbeat per 8-12 seconds per attempt
    const rateLimitKey = `ratelimit:heartbeat:${attemptId}`;
    const lastPing = await redis.get(rateLimitKey);

    if (lastPing) {
      const lastPingTime = typeof lastPing === 'string' ? parseInt(lastPing) : lastPing;
      if (Date.now() - lastPingTime < 8000) {
        // Too frequent - return last known state
        const session = await getDwellSession(attemptId);
        return { ok: true, accumulatedSeconds: session?.accumulatedSeconds || 0, rateLimited: true };
      }
    }

    await redis.set(rateLimitKey, Date.now().toString(), { ex: 12 });

    // Get or create dwell session
    const session = await getOrCreateDwellSession(attemptId, {
      userId,
      sectionId,
      checkpointId,
      startedAt: Date.now()
    });

    // Idempotency: check heartbeat sequence
    if (heartbeatSeq <= session.lastHeartbeatSeq) {
      // Duplicate or old heartbeat - ignore, return current state
      return { ok: true, accumulatedSeconds: session.accumulatedSeconds, duplicate: true };
    }

    // Delta-based accumulation (not fixed +10)
    const now = Date.now();
    const delta = session.lastHeartbeatAt
      ? Math.floor((now - session.lastHeartbeatAt) / 1000)
      : 0;

    // Clamp delta: 0 <= delta <= 15 (heartbeat interval is 10s, allow 5s grace for jitter)
    const clampedDelta = Math.max(0, Math.min(delta, 15));

    // Accumulate clamped delta
    session.accumulatedSeconds += clampedDelta;
    session.lastHeartbeatAt = now;
    session.lastHeartbeatSeq = heartbeatSeq;

    // Save with TTL refresh (1 hour, extends on each ping)
    await saveDwellSession(attemptId, session, 3600); // TTL 3600s

    return { ok: true, accumulatedSeconds: session.accumulatedSeconds };
  } catch (error) {
    console.error('[Dwell Heartbeat Error]', error);
    return { ok: true, accumulatedSeconds: 0 }; // Graceful degradation
  }
}

// ============================================================================
// SERVER ACTION: SUBMIT CHECKPOINT
// ============================================================================

export async function submitCheckpoint(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    // 1. Get persistent user ID (logged-in or cookie-based anonymous)
    const { userId, userIdNumber } = await getOrCreateUserId();

    // 2. Parse and validate form data
    const rawData = {
      checkpointId: formData.get("checkpointId"),
      sectionId: formData.get("sectionId"),
      phase: formData.get("phase"),
      dwellTimeSeconds: formData.get("dwellTimeSeconds"),
      reflection: formData.get("reflection"),
    };

    const validation = CheckpointSubmissionSchema.safeParse(rawData);

    if (!validation.success) {
      return {
        ok: false,
        message: validation.error.errors[0]?.message || "Invalid submission",
      };
    }

    const { checkpointId, sectionId, phase, dwellTimeSeconds, reflection, attemptId } =
      validation.data;

    // 3. Validate word count (server-side enforcement - hard gate)
    const wordCount = countWords(reflection);
    if (wordCount < 50) {
      return {
        ok: false,
        message: `Reflection must be at least 50 words (you submitted ${wordCount} words).`
      };
    }

    // 3.5. Validate accumulated dwell time from server session (heartbeat-based)
    // Get the checkpoint to check minimumDwellSeconds
    const currentCheckpoint = AwakeningPhase.sections
      .find((s) => s.id === sectionId)
      ?.checkpoints.find((c) => c.id === checkpointId);

    if (!currentCheckpoint) {
      return {
        ok: false,
        message: 'Checkpoint not found. Please reload and try again.'
      };
    }

    // Get accumulated dwell time from server session (by attemptId)
    const session = await getDwellSession(attemptId);

    if (!session || session.accumulatedSeconds < currentCheckpoint.minimumDwellSeconds) {
      return {
        ok: false,
        message: `Please spend at least ${currentCheckpoint.minimumDwellSeconds} seconds engaging with the content. (You've accumulated ${session?.accumulatedSeconds || 0} seconds.)`
      };
    }

    // Validate attemptId matches session metadata (prevent attempt swapping)
    if (session.checkpointId !== checkpointId) {
      return {
        ok: false,
        message: 'Invalid dwell session. Please reload and try again.'
      };
    }

    // 4. Calculate reflection metrics
    const reflectionId = `reflection-${Date.now()}-${userId}`;

    // 5. Create Formation Events
    const checkpointReachedEvent = createCheckpointReachedEvent(
      userId,
      checkpointId,
      sectionId,
      phase
    );

    const reflectionSubmittedEvent = createReflectionSubmittedEvent(
      userId,
      reflectionId,
      checkpointId,
      ReflectionType.Text,
      wordCount,
      dwellTimeSeconds
    );

    const checkpointCompletedEvent = createCheckpointCompletedEvent(
      userId,
      checkpointId,
      sectionId,
      phase,
      reflectionId,
      dwellTimeSeconds
    );

    // 6. Store Events + Reflection + Update Journey
    try {
      // Initialize Strapi persistence client
      const client = initializeFormationClient({
        strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL!,
        strapiToken: process.env.STRAPI_FORMATION_TOKEN,
      });

      // Write all three events sequentially
      await client.writeEvent(checkpointReachedEvent, userId, userIdNumber);
      await client.writeEvent(reflectionSubmittedEvent, userId, userIdNumber);
      await client.writeEvent(checkpointCompletedEvent, userId, userIdNumber);

      // Write reflection content
      await client.writeReflection(
        {
          id: reflectionId,
          userId,
          checkpointId,
          type: ReflectionType.Text,
          content: reflection,
          wordCount,
          submittedAt: new Date(),
          timeSinceCheckpointReached: dwellTimeSeconds,
        },
        phase,
        sectionId,
        userId,
        userIdNumber
      );

      // Update journey state (add to arrays, increment counter)
      await client.upsertJourney(
        {
          checkpointsReached: [checkpointId], // Client will append to existing array
          checkpointsCompleted: [checkpointId], // Client will append to existing array
          reflectionsSubmitted: 1, // Client will increment existing count
          lastActivityAt: new Date().toISOString(),
        },
        userId,
        userIdNumber
      );

      console.log("[Formation] Checkpoint completed and reflection stored", {
        userId,
        checkpointId,
        reflectionId,
        wordCount,
      });

      // Clear dwell session after successful submission
      await clearDwellSession(attemptId);
    } catch (error) {
      // Graceful degradation: log error but allow user to proceed
      console.error("[Formation Persistence] Failed to persist checkpoint submission", {
        error,
        userId,
        checkpointId,
      });
      // Fallback: log the events locally
      [checkpointReachedEvent, reflectionSubmittedEvent, checkpointCompletedEvent].forEach((event) => {
        console.log("[Formation Event - Fallback]", {
          eventType: event.eventType,
          userId: event.userId,
          timestamp: event.timestamp,
          data: event.data,
        });
      });
      console.log("[Reflection Content - Fallback]", {
        reflectionId,
        checkpointId,
        userId,
        wordCount,
        content: reflection.substring(0, 100) + "...",
      });
    }

    // 7. Determine next section
    const currentSection = AwakeningPhase.sections.find((s) => s.id === sectionId);
    if (!currentSection) {
      throw new Error("Section not found");
    }

    const nextSection = AwakeningPhase.sections.find(
      (s) => s.order === currentSection.order + 1
    );

    // 8. Redirect to next section or completion
    if (nextSection) {
      redirect(`/guidebook/awakening/${nextSection.slug}`);
    } else {
      // Completed all Awakening sections
      redirect("/guidebook/awakening/complete");
    }
  } catch (error) {
    // Handle redirect separately (it throws by design in Next.js)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirects
    }

    console.error("[Checkpoint Submission Error]", error);

    return {
      ok: false,
      message: "An error occurred while submitting your reflection. Please try again.",
    };
  }
}

// ============================================================================
// HELPER: CREATE SECTION VIEWED EVENT FUNCTION (FOR CLIENT USE)
// ============================================================================

/**
 * Helper to create a section viewed event factory.
 * This would be called from the client component on mount.
 */
function createSectionViewedEventFactory(
  userId: string,
  sectionId: string,
  phase: FormationPhase,
  dwellTimeSeconds: number
) {
  return createSectionViewedEvent(userId, sectionId, phase, dwellTimeSeconds);
}
