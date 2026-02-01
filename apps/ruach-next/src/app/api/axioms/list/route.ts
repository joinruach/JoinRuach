/**
 * GET /api/axioms/list
 *
 * Get all axioms with their unlock status for the current user
 * Returns a list of axioms with prerequisite information
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentFormationState } from "@/lib/formation/state";
import { AxiomUnlockService } from "@/lib/formation/AxiomUnlockService";

interface ExtendedSession {
  user?: {
    email?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current formation state
    const state = await getCurrentFormationState();
    if (!state) {
      // User hasn't entered formation yet
      return NextResponse.json(
        { axioms: [], message: "User has not started formation" },
        { status: 200 }
      );
    }

    // Get all axioms with unlock status
    const axioms = AxiomUnlockService.getAllAxiomsWithStatus(state);

    return NextResponse.json(
      {
        ok: true,
        count: axioms.length,
        unlockedCount: axioms.filter((a) => a.isUnlocked).length,
        axioms,
        meta: {
          currentPhase: state.currentPhase,
          daysInPhase: state.daysInPhase,
          checkpointsCompleted: state.checkpointsCompleted.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /axioms/list error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch axioms",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
