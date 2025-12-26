"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  CovenantType,
  createCovenantEnteredEvent,
  FormationEventType,
} from "@ruach/formation";

// ============================================================================
// VALIDATION SCHEMA
// ============================================================================

const CovenantEntrySchema = z.object({
  covenantType: z.nativeEnum(CovenantType),
  acknowledgedTerms: z.literal("on", {
    errorMap: () => ({ message: "You must acknowledge the terms to proceed" }),
  }),
});

// ============================================================================
// FORM STATE TYPE
// ============================================================================

interface FormState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  redirectTo?: string;
}

// ============================================================================
// SERVER ACTION: ENTER COVENANT
// ============================================================================

export async function enterCovenant(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    // 1. Get current user session
    const session = await auth();

    // For now, we'll allow unauthenticated access
    // Later, you may want to require authentication for Formation Journey
    const userId = session?.user?.id || "anonymous";

    // 2. Parse and validate form data
    const rawData = {
      covenantType: formData.get("covenantType"),
      acknowledgedTerms: formData.get("acknowledgedTerms"),
    };

    const validation = CovenantEntrySchema.safeParse(rawData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });

      return {
        ok: false,
        message: "Please correct the errors and try again.",
        fieldErrors,
      };
    }

    const { covenantType, acknowledgedTerms } = validation.data;

    // 3. Create Formation Event
    const event = createCovenantEnteredEvent(
      userId,
      covenantType,
      acknowledgedTerms === "on"
    );

    // 4. Store Event
    // TODO: Replace with Strapi API call once formation-event content type exists
    // For now, log the event
    console.log("[Formation Event]", {
      eventType: event.eventType,
      userId: event.userId,
      timestamp: event.timestamp,
      data: event.data,
    });

    // In production, this would be:
    // await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/formation-events`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     Authorization: `Bearer ${session?.strapiJwt}`,
    //   },
    //   body: JSON.stringify({ data: event }),
    // });

    // 5. Determine redirect path based on covenant type
    const redirectPath =
      covenantType === CovenantType.FormationJourney
        ? "/guidebook/awakening" // Formation Journey starts at Phase 1
        : "/guidebook"; // Resource Explorer gets full access

    // 6. Redirect to appropriate path
    // Note: redirect() throws, so this is the last line
    redirect(redirectPath);
  } catch (error) {
    // Handle redirect separately (it throws by design in Next.js)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error; // Re-throw redirects
    }

    console.error("[Covenant Entry Error]", error);

    return {
      ok: false,
      message: "An error occurred while processing your request. Please try again.",
    };
  }
}

// ============================================================================
// HELPER: GET USER COVENANT STATUS
// ============================================================================

/**
 * Check if user has already entered covenant.
 * Used to prevent re-entry or redirect users who have already chosen.
 */
export async function getUserCovenantStatus(userId: string): Promise<{
  hasEntered: boolean;
  covenantType?: CovenantType;
  enteredAt?: Date;
}> {
  // TODO: Query Strapi for user's covenant entry event
  // For now, return placeholder

  // In production:
  // const events = await fetch(
  //   `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/formation-events?filters[userId][$eq]=${userId}&filters[eventType][$eq]=${FormationEventType.CovenantEntered}&sort=timestamp:desc&pagination[limit]=1`
  // );
  //
  // if (events.data.length > 0) {
  //   return {
  //     hasEntered: true,
  //     covenantType: events.data[0].data.covenantType,
  //     enteredAt: new Date(events.data[0].timestamp),
  //   };
  // }

  return {
    hasEntered: false,
  };
}
