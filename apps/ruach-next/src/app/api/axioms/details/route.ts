/**
 * GET /api/axioms/details?axiomId=...
 *
 * Get detailed information about a specific axiom
 * Includes full content, prerequisites, and unlock status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentFormationState } from "@/lib/formation/state";
import { AxiomUnlockService } from "@/lib/formation/AxiomUnlockService";

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

    // Get axiomId from query params
    const axiomId = req.nextUrl.searchParams.get("axiomId");
    if (!axiomId) {
      return NextResponse.json(
        { error: "axiomId query parameter is required" },
        { status: 400 }
      );
    }

    // Get axiom details
    const axiomDetails = AxiomUnlockService.getAxiomDetails(axiomId);
    if (!axiomDetails) {
      return NextResponse.json(
        { error: "Axiom not found" },
        { status: 404 }
      );
    }

    // Get current formation state for unlock status
    const state = await getCurrentFormationState();
    if (!state) {
      return NextResponse.json(
        { error: "User has not started formation" },
        { status: 400 }
      );
    }

    // Check unlock status
    const unlockStatus = AxiomUnlockService.checkAxiomUnlock(axiomId, state);

    return NextResponse.json(
      {
        ok: true,
        axiom: {
          ...axiomDetails,
          unlock: unlockStatus,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /axioms/details error:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch axiom details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
