/**
 * POST /api/axioms/check
 *
 * Check unlock status of specific axiom(s)
 * Handles idempotent checks with optional deduplication
 *
 * Request body:
 * {
 *   axiomId?: string (single axiom)
 *   axiomIds?: string[] (multiple axioms)
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCurrentFormationState } from "@/lib/formation/state";
import { AxiomUnlockService } from "@/lib/formation/AxiomUnlockService";

interface CheckRequest {
  axiomId?: string;
  axiomIds?: string[];
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    let body: CheckRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { axiomId, axiomIds } = body;

    // Validate request
    if (!axiomId && (!axiomIds || axiomIds.length === 0)) {
      return NextResponse.json(
        { error: "Either axiomId or axiomIds must be provided" },
        { status: 400 }
      );
    }

    // Get current formation state
    const state = await getCurrentFormationState();
    if (!state) {
      return NextResponse.json(
        { error: "User has not started formation" },
        { status: 400 }
      );
    }

    // Deduplicate axiom IDs
    const idsToCheck = axiomId
      ? [axiomId]
      : [...new Set(axiomIds)];

    // Check unlock status for each axiom
    const results = idsToCheck.map((id) => {
      const result = AxiomUnlockService.checkAxiomUnlock(id, state);
      if (!result) {
        return {
          axiomId: id,
          found: false,
          error: "Axiom not found",
        };
      }
      const { axiomId: _ignored, ...rest } = result;
      return {
        axiomId: id,
        found: true,
        ...rest,
      };
    });

    const successResults = results.filter(
      (r): r is typeof results[number] & { found: true; isUnlocked: boolean } =>
        r.found === true && typeof (r as Record<string, unknown>).isUnlocked === "boolean"
    );
    const notFoundIds = results.filter((r) => !r.found).map((r) => r.axiomId);

    return NextResponse.json(
      {
        ok: true,
        checked: idsToCheck.length,
        results,
        summary: {
          unlockedCount: successResults.filter((r) => r.isUnlocked).length,
          lockedCount: successResults.filter((r) => !r.isUnlocked).length,
          notFoundCount: notFoundIds.length,
        },
        ...(notFoundIds.length > 0 && { notFoundIds }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] /axioms/check error:", error);
    return NextResponse.json(
      {
        error: "Failed to check axioms",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
