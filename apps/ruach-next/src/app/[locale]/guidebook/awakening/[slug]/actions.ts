"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { getOrCreateUserId } from "@/lib/formation/user-id";
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
// VALIDATION SCHEMA
// ============================================================================

const CheckpointSubmissionSchema = z.object({
  checkpointId: z.string().min(1),
  sectionId: z.string().min(1),
  phase: z.nativeEnum(FormationPhase),
  dwellTimeSeconds: z.coerce.number().min(0),
  reflection: z.string().min(10, "Reflection must be at least 10 characters"),
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

    const { checkpointId, sectionId, phase, dwellTimeSeconds, reflection } =
      validation.data;

    // 3. Calculate reflection metrics
    const wordCount = reflection.trim().split(/\s+/).length;
    const reflectionId = `reflection-${Date.now()}-${userId}`;

    // 4. Create Formation Events
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

    // 5. Store Events + Reflection + Update Journey
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

    // 6. Determine next section
    const currentSection = AwakeningPhase.sections.find((s) => s.id === sectionId);
    if (!currentSection) {
      throw new Error("Section not found");
    }

    const nextSection = AwakeningPhase.sections.find(
      (s) => s.order === currentSection.order + 1
    );

    // 7. Redirect to next section or completion
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
