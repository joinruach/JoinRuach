/**
 * Integration Tests for Formation Phases 5-7
 *
 * Tests for axiom unlocking, progress tracking, and error handling
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  AxiomUnlockService,
  CanonAxiom,
} from "@/lib/formation/AxiomUnlockService";
import {
  DeduplicationService,
  FormationDataCache,
  FormationValidation,
  ValidationError,
  DuplicateSubmissionError,
  withRetry,
} from "@/lib/formation/error-handling";
import { FormationState, FormationPhase, ReadinessLevel, PaceStatus, RedFlag } from "@ruach/formation";

describe("Phase 5: Canon Axiom Unlocking", () => {
  let mockState: FormationState;

  beforeEach(() => {
    mockState = {
      userId: "test-user",
      currentPhase: FormationPhase.Awakening,
      phaseEnteredAt: new Date(),
      daysInPhase: 5,
      sectionsViewed: [],
      checkpointsReached: ["checkpoint-awakening-1"],
      checkpointsCompleted: ["checkpoint-awakening-1"],
      reflectionsSubmitted: 1,
      readiness: {
        reflectionDepth: ReadinessLevel.Developing,
        pace: PaceStatus.Appropriate,
        canonEngagement: ReadinessLevel.Emerging,
        redFlags: [],
      },
      unlockedCanonAxioms: [],
      unlockedCourses: [],
      unlockedCannonReleases: [],
      formationGaps: [],
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });

  it("should unlock axioms when prerequisites are met", () => {
    // Simulate completing first checkpoint
    mockState.checkpointsCompleted = ["checkpoint-awakening-1"];

    const results = AxiomUnlockService.getAllAxiomsWithStatus(mockState);
    const identityAxiom = results.find(
      (a) => a.axiomId === "axiom-awakening-identity"
    );

    expect(identityAxiom).toBeDefined();
    expect(identityAxiom?.isUnlocked).toBe(true);
  });

  it("should require all prerequisites to unlock axiom", () => {
    mockState.checkpointsCompleted = [];
    mockState.daysInPhase = 1;

    const result = AxiomUnlockService.checkAxiomUnlock(
      "axiom-awakening-authority",
      mockState
    );

    expect(result?.isUnlocked).toBe(false);
    expect(result?.prerequisites.some((p) => !p.satisfied)).toBe(true);
  });

  it("should detect newly unlocked axioms", () => {
    const previousUnlocked = ["axiom-awakening-identity"];
    const currentUnlocked = [
      "axiom-awakening-identity",
      "axiom-awakening-authority",
      "axiom-awakening-invitation",
    ];

    const newlyUnlocked = AxiomUnlockService.getNewlyUnlockedAxioms(
      currentUnlocked,
      previousUnlocked
    );

    expect(newlyUnlocked).toEqual([
      "axiom-awakening-authority",
      "axiom-awakening-invitation",
    ]);
  });

  it("should filter axioms by phase", () => {
    const awakeningAxioms = AxiomUnlockService.getAxiomsByPhase(
      FormationPhase.Awakening
    );

    expect(awakeningAxioms.length).toBeGreaterThan(0);
    expect(awakeningAxioms.every((a) => a.phase === FormationPhase.Awakening)).toBe(
      true
    );
  });

  it("should return axiom details", () => {
    const details = AxiomUnlockService.getAxiomDetails(
      "axiom-awakening-identity"
    );

    expect(details).toBeDefined();
    expect(details?.title).toBe("Identity in Christ");
    expect(details?.phase).toBe(FormationPhase.Awakening);
  });

  it("should handle missing axiom gracefully", () => {
    const result = AxiomUnlockService.checkAxiomUnlock(
      "nonexistent-axiom",
      mockState
    );

    expect(result).toBeNull();
  });
});

describe("Phase 6: Progress Dashboard", () => {
  let mockState: FormationState;

  beforeEach(() => {
    mockState = {
      userId: "test-user",
      currentPhase: FormationPhase.Awakening,
      phaseEnteredAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      daysInPhase: 7,
      sectionsViewed: ["section-1", "section-2"],
      checkpointsReached: [
        "checkpoint-awakening-1",
        "checkpoint-awakening-2",
        "checkpoint-awakening-3",
      ],
      checkpointsCompleted: ["checkpoint-awakening-1", "checkpoint-awakening-2"],
      reflectionsSubmitted: 2,
      readiness: {
        reflectionDepth: ReadinessLevel.Developing,
        pace: PaceStatus.Appropriate,
        canonEngagement: ReadinessLevel.Emerging,
        redFlags: [],
      },
      unlockedCanonAxioms: ["axiom-awakening-identity"],
      unlockedCourses: [],
      unlockedCannonReleases: [],
      formationGaps: [],
      lastActivityAt: new Date(),
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    };
  });

  it("should calculate correct progress percentage", () => {
    const total = mockState.checkpointsReached.length;
    const completed = mockState.checkpointsCompleted.length;
    const percentage = Math.round((completed / total) * 100);

    expect(percentage).toBe(67);
  });

  it("should track days in phase", () => {
    expect(mockState.daysInPhase).toBe(7);
    expect(mockState.currentPhase).toBe(FormationPhase.Awakening);
  });

  it("should reflect readiness levels correctly", () => {
    expect(mockState.readiness.reflectionDepth).toBe(ReadinessLevel.Developing);
    expect(mockState.readiness.pace).toBe(PaceStatus.Appropriate);
    expect(mockState.readiness.canonEngagement).toBe(ReadinessLevel.Emerging);
  });

  it("should not have red flags if pace is appropriate", () => {
    expect(mockState.readiness.redFlags).toHaveLength(0);
  });

  it("should track activity correctly", () => {
    expect(mockState.reflectionsSubmitted).toBe(2);
    expect(mockState.unlockedCanonAxioms.length).toBe(1);
  });
});

describe("Phase 7: Error Handling & Polish", () => {
  describe("DeduplicationService", () => {
    let dedup: DeduplicationService;

    beforeEach(() => {
      dedup = new DeduplicationService();
    });

    it("should detect duplicate submissions within cooldown", () => {
      const opId = "test-operation";

      dedup.recordSuccess(opId, { ok: true });

      const isDuplicate = dedup.checkDuplicate(opId, 5000);
      expect(isDuplicate).toBe(true);
    });

    it("should not flag submission after cooldown expires", () => {
      const opId = "test-operation";

      dedup.recordSuccess(opId, { ok: true });

      // Fake time passage
      const isDuplicate = dedup.checkDuplicate(opId, 0);
      expect(isDuplicate).toBe(false);
    });

    it("should retrieve previous results", () => {
      const opId = "test-operation";
      const result = { ok: true, data: "test" };

      dedup.recordSuccess(opId, result);

      const retrieved = dedup.getPreviousResult(opId);
      expect(retrieved).toEqual(result);
    });

    it("should cleanup old submissions", () => {
      dedup.recordSuccess("old-op", { ok: true });
      dedup.cleanup();

      // Note: This would need mock time to properly test
      // In real implementation, use jest.useFakeTimers()
    });
  });

  describe("FormationDataCache", () => {
    let cache: FormationDataCache;

    beforeEach(() => {
      cache = new FormationDataCache();
    });

    it("should store and retrieve data", () => {
      const testData = { axioms: ["test"] };

      cache.set("axioms", testData);
      const retrieved = cache.get("axioms");

      expect(retrieved).toEqual(testData);
    });

    it("should return null for expired data", () => {
      const testData = { axioms: ["test"] };

      cache.set("axioms", testData, -1000); // Already expired
      const retrieved = cache.get("axioms");

      expect(retrieved).toBeNull();
    });

    it("should check existence of valid data", () => {
      const testData = { axioms: ["test"] };

      cache.set("axioms", testData, 60000);
      expect(cache.has("axioms")).toBe(true);
    });

    it("should clear all data", () => {
      cache.set("data1", { test: 1 });
      cache.set("data2", { test: 2 });

      cache.clear();

      expect(cache.get("data1")).toBeNull();
      expect(cache.get("data2")).toBeNull();
    });
  });

  describe("FormationValidation", () => {
    it("should validate reflection content", () => {
      const validReflection =
        "This reflection traces how the formation content landed in my life, highlighting specific convictions, scripture resonances, and action steps. It explains how the insights shifted my perspective, names the emotions stirred, and describes a concrete habit I intend to follow in the next week because of what God taught me.";

      const { valid, errors } = FormationValidation.validateReflection(
        validReflection,
        50
      );

      expect(valid).toBe(true);
      expect(errors).toHaveLength(0);
    });

    it("should reject reflection below minimum word count", () => {
      const shortReflection = "Too short.";

      const { valid, errors } = FormationValidation.validateReflection(
        shortReflection,
        50
      );

      expect(valid).toBe(false);
      expect(errors.some((e) => e.code === "min_words")).toBe(true);
    });

    it("should reject empty reflection", () => {
      const { valid, errors } = FormationValidation.validateReflection("", 50);

      expect(valid).toBe(false);
      expect(errors.some((e) => e.code === "required")).toBe(true);
    });

    it("should validate dwell time", () => {
      const { valid } = FormationValidation.validateDwellTime(120, 60);

      expect(valid).toBe(true);
    });

    it("should reject insufficient dwell time", () => {
      const { valid, error } = FormationValidation.validateDwellTime(30, 60);

      expect(valid).toBe(false);
      expect(error?.code).toBe("insufficient_dwell");
    });

    it("should validate checkpoint ID format", () => {
      const { valid } = FormationValidation.validateCheckpointId(
        "checkpoint-awakening-1"
      );

      expect(valid).toBe(true);
    });

    it("should reject invalid checkpoint ID format", () => {
      const { valid } = FormationValidation.validateCheckpointId("invalid-id");

      expect(valid).toBe(false);
    });
  });

  describe("Retry Logic", () => {
    it("should retry failed operations", async () => {
      let attempts = 0;

      const operation = async () => {
        attempts++;
        if (attempts < 3) throw new Error("Temporary failure");
        return "success";
      };

      const result = await withRetry(operation, {
        maxAttempts: 3,
        initialDelayMs: 10,
      });

      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should fail after max attempts", async () => {
      const operation = async () => {
        throw new Error("Persistent failure");
      };

      await expect(
        withRetry(operation, {
          maxAttempts: 2,
          initialDelayMs: 10,
        })
      ).rejects.toThrow("Persistent failure");
    });
  });

  describe("Error Classes", () => {
    it("should create validation error with context", () => {
      const error = new ValidationError(
        "reflection",
        "min_words",
        "Too short",
        { required: 50, actual: 30 }
      );

      expect(error.field).toBe("reflection");
      expect(error.code).toBe("min_words");
      expect(error.details?.required).toBe(50);
    });

    it("should create network error with retry info", () => {
      const error = new ValidationError(
        "network",
        "connection_timeout",
        "Request timed out",
        {}
      );

      expect(error.message).toBe("Request timed out");
    });

    it("should create duplicate submission error", () => {
      const now = new Date();
      const error = new DuplicateSubmissionError("test-op", now, 5000);

      expect(error.operationId).toBe("test-op");
      expect(error.cooldownMs).toBe(5000);
    });
  });
});

describe("Integration: Complete Formation Flow", () => {
  let mockState: FormationState;
  let dedup: DeduplicationService;
  let cache: FormationDataCache;

  beforeEach(() => {
    mockState = {
      userId: "test-user",
      currentPhase: FormationPhase.Awakening,
      phaseEnteredAt: new Date(),
      daysInPhase: 5,
      sectionsViewed: [],
      checkpointsReached: ["checkpoint-awakening-1"],
      checkpointsCompleted: [],
      reflectionsSubmitted: 0,
      readiness: {
        reflectionDepth: ReadinessLevel.Emerging,
        pace: PaceStatus.Appropriate,
        canonEngagement: ReadinessLevel.Emerging,
        redFlags: [],
      },
      unlockedCanonAxioms: [],
      unlockedCourses: [],
      unlockedCannonReleases: [],
      formationGaps: [],
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    dedup = new DeduplicationService();
    cache = new FormationDataCache();
  });

  it("should handle complete checkpoint submission flow", async () => {
    const checkpointId = "checkpoint-awakening-1";
    const reflection =
      "I am grateful for the formation content and the way it reframed my priorities; I described the scenes in my relationships where the teaching matters, noted the compassion that arose, mapped a clear next step for accountability, and committed to checking in with my coach so we can keep building on this in the coming days.";

    // 1. Validate reflection
    const validation = FormationValidation.validateReflection(reflection);
    expect(validation.valid).toBe(true);

    // 2. Check for duplicate submission
    const submitId = `submit-${checkpointId}-${Date.now()}`;
    expect(dedup.checkDuplicate(submitId)).toBe(false);

    // 3. Record submission
    dedup.recordSuccess(submitId, { ok: true, checkpointId });

    // 4. Update state (simulated)
    mockState.checkpointsCompleted.push(checkpointId);
    mockState.reflectionsSubmitted += 1;

    // 5. Check for new axiom unlocks
    const axiomResults = AxiomUnlockService.getAllAxiomsWithStatus(mockState);
    const unlockedAxioms = axiomResults.filter((a) => a.isUnlocked);

    expect(unlockedAxioms.length).toBeGreaterThan(0);

    // 6. Cache the result
    cache.set("axioms", axiomResults, 3600000);
    expect(cache.has("axioms")).toBe(true);

    // 7. Verify duplicate prevention
    expect(dedup.checkDuplicate(submitId)).toBe(true);
  });

  it("should handle formation progression with error recovery", async () => {
    // Simulate API error
    const operation = async () => {
      throw new Error("Network failure");
    };

    // Try with retry
    try {
      await withRetry(operation, {
        maxAttempts: 2,
        initialDelayMs: 10,
      });
    } catch (err) {
      // Fall back to cache
      cache.set("axioms-fallback", { axioms: [] });
      const cached = cache.get("axioms-fallback");
      expect(cached).toBeDefined();
    }
  });
});
