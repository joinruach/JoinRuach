/**
 * Formation State Projection Helpers
 *
 * Server-side utilities to fetch events and project current formation state
 */

"use server";

import { auth } from "@/lib/auth";
import {
  getFormationClient,
  initializeFormationClient,
  rebuildState,
  FormationState,
  FormationEvent,
} from "@ruach/formation";

/**
 * Get current formation state for the logged-in or anonymous user
 * This fetches all events from Strapi and projects them into current state
 */
export async function getCurrentFormationState(): Promise<FormationState | null> {
  try {
    // 1. Get user session
    const session = await auth();
    const userId = session?.user?.id || `anon-${crypto.randomUUID()}`;
    const userIdNumber = session?.user?.id ? Number(session.user.id) : undefined;

    // 2. Initialize Strapi client
    const client = initializeFormationClient({
      strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL!,
      strapiToken: process.env.STRAPI_FORMATION_TOKEN,
    });

    // 3. Fetch all events for this user
    const strapiEvents = await client.getEvents(userId, userIdNumber);

    if (strapiEvents.length === 0) {
      // User hasn't started formation journey yet
      return null;
    }

    // 4. Convert Strapi events to FormationEvent format
    const events: FormationEvent[] = strapiEvents.map((e) => ({
      id: e.eventId,
      userId: e.user ? String(e.user) : (e.anonymousUserId || userId),
      timestamp: new Date(e.timestamp),
      eventType: e.eventType,
      data: e.eventData,
      metadata: e.eventMetadata,
    }));

    // 5. Rebuild state from events (pure projection)
    const state = rebuildState(userId, events);

    return state;
  } catch (error) {
    console.error("[Formation State] Failed to project current state", error);
    return null;
  }
}

/**
 * Get formation state for a specific user (admin/pastoral use)
 */
export async function getFormationStateForUser(
  targetUserId: string,
  isNumericId: boolean = false
): Promise<FormationState | null> {
  try {
    const client = initializeFormationClient({
      strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL!,
      strapiToken: process.env.STRAPI_FORMATION_TOKEN,
    });

    const userIdNumber = isNumericId ? Number(targetUserId) : undefined;
    const strapiEvents = await client.getEvents(targetUserId, userIdNumber);

    if (strapiEvents.length === 0) {
      return null;
    }

    const events: FormationEvent[] = strapiEvents.map((e) => ({
      id: e.eventId,
      userId: e.user ? String(e.user) : (e.anonymousUserId || targetUserId),
      timestamp: new Date(e.timestamp),
      eventType: e.eventType,
      data: e.eventData,
      metadata: e.eventMetadata,
    }));

    return rebuildState(targetUserId, events);
  } catch (error) {
    console.error("[Formation State] Failed to project state for user", {
      error,
      targetUserId,
    });
    return null;
  }
}
