"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  FormationPhase,
  createCheckpointReachedEvent,
  createCheckpointCompletedEvent,
  createReflectionSubmittedEvent,
  createSectionViewedEvent,
  ReflectionType,
  AwakeningPhase,
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
    // 1. Get current user session
    const session = await auth();
    const userId = session?.user?.id || "anonymous";

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

    // 5. Store Events (console for now, Strapi later)
    const events = [
      checkpointReachedEvent,
      reflectionSubmittedEvent,
      checkpointCompletedEvent,
    ];

    events.forEach((event) => {
      console.log("[Formation Event]", {
        eventType: event.eventType,
        userId: event.userId,
        timestamp: event.timestamp,
        data: event.data,
      });
    });

    // TODO: Replace with Strapi API call
    // await Promise.all(events.map(event => saveFormationEvent(event)));

    // Also log the reflection content (not part of event, stored separately)
    console.log("[Reflection Content]", {
      reflectionId,
      checkpointId,
      userId,
      wordCount,
      content: reflection.substring(0, 100) + "...", // Log first 100 chars only
    });

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
