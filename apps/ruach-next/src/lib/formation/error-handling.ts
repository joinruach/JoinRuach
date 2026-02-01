/**
 * Formation Error Handling Utilities
 *
 * Provides comprehensive error handling for formation operations:
 * - Validation error formatting
 * - Duplicate submission prevention
 * - Partial failure recovery
 * - Network failure handling with local caching
 */

/**
 * Validation error with context
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Network error with retry capability
 */
export class NetworkError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public retryable: boolean = true,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "NetworkError";
  }
}

/**
 * Duplicate submission detected
 */
export class DuplicateSubmissionError extends Error {
  constructor(
    public operationId: string,
    public previousSubmissionTime: Date,
    public cooldownMs: number = 5000
  ) {
    super(
      `Duplicate submission detected. Please wait ${Math.ceil(cooldownMs / 1000)}s before retrying.`
    );
    this.name = "DuplicateSubmissionError";
  }
}

/**
 * Deduplication service for preventing duplicate submissions
 */
export class DeduplicationService {
  private submissions = new Map<string, { timestamp: Date; result: unknown }>();
  private readonly defaultCooldownMs = 5000;

  /**
   * Register an operation and check if it's a duplicate
   */
  checkDuplicate(operationId: string, cooldownMs = this.defaultCooldownMs): boolean {
    const existing = this.submissions.get(operationId);
    if (!existing) return false;

    const elapsed = Date.now() - existing.timestamp.getTime();
    return elapsed < cooldownMs;
  }

  /**
   * Record a successful operation
   */
  recordSuccess(operationId: string, result: unknown): void {
    this.submissions.set(operationId, {
      timestamp: new Date(),
      result,
    });
  }

  /**
   * Get the result of a previous operation
   */
  getPreviousResult(operationId: string): unknown {
    return this.submissions.get(operationId)?.result;
  }

  /**
   * Clear old submissions (>1 hour)
   */
  cleanup(): void {
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, value] of this.submissions.entries()) {
      if (value.timestamp.getTime() < oneHourAgo) {
        this.submissions.delete(key);
      }
    }
  }
}

/**
 * Local cache for formation data during network outages
 */
export interface CachedFormationData {
  data: unknown;
  timestamp: Date;
  expiresAt: Date;
}

export class FormationDataCache {
  private cache = new Map<string, CachedFormationData>();
  private readonly defaultTtlMs = 3600000; // 1 hour

  /**
   * Store data in cache
   */
  set(key: string, data: unknown, ttlMs = this.defaultTtlMs): void {
    const now = new Date();
    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: new Date(now.getTime() + ttlMs),
    });
  }

  /**
   * Retrieve data from cache (if not expired)
   */
  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if data exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cached data
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  cleanup(): void {
    const now = new Date();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

/**
 * Validation helpers
 */
export class FormationValidation {
  /**
   * Validate reflection content
   */
  static validateReflection(content: string, minWords = 50): {
    valid: boolean;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    if (!content || content.trim().length === 0) {
      errors.push(
        new ValidationError(
          "reflection",
          "required",
          "Reflection cannot be empty"
        )
      );
    }

    const wordCount = content.trim().split(/\s+/).length;
    if (wordCount < minWords) {
      errors.push(
        new ValidationError(
          "reflection",
          "min_words",
          `Reflection must be at least ${minWords} words (currently ${wordCount})`,
          { required: minWords, provided: wordCount }
        )
      );
    }

    // Check for meaningful content (not just punctuation)
    const meaningfulChars = content.match(/[\p{L}\p{N}]/gu);
    if (!meaningfulChars || meaningfulChars.length < minWords * 3) {
      errors.push(
        new ValidationError(
          "reflection",
          "insufficient_content",
          "Reflection should contain more meaningful content"
        )
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate dwell time
   */
  static validateDwellTime(
    actualSeconds: number,
    requiredSeconds: number
  ): {
    valid: boolean;
    error?: ValidationError;
  } {
    if (actualSeconds < requiredSeconds) {
      return {
        valid: false,
        error: new ValidationError(
          "dwellTime",
          "insufficient_dwell",
          `You must spend at least ${requiredSeconds} seconds reading this section`,
          {
            required: requiredSeconds,
            actual: actualSeconds,
            remaining: requiredSeconds - actualSeconds,
          }
        ),
      };
    }

    return { valid: true };
  }

  /**
   * Validate checkpoint ID format
   */
  static validateCheckpointId(id: string): {
    valid: boolean;
    error?: ValidationError;
  } {
    if (!id || typeof id !== "string") {
      return {
        valid: false,
        error: new ValidationError(
          "checkpointId",
          "invalid_format",
          "Invalid checkpoint ID"
        ),
      };
    }

    // Expected format: checkpoint-{phase}-{number}
    if (!/^checkpoint-[a-z]+-\d+$/.test(id)) {
      return {
        valid: false,
        error: new ValidationError(
          "checkpointId",
          "invalid_format",
          "Checkpoint ID must match expected format"
        ),
      };
    }

    return { valid: true };
  }
}

/**
 * Partial failure recovery
 */
export interface PartialFailureResult<T> {
  successful: T[];
  failed: Array<{
    item: T;
    error: Error;
  }>;
  partialSuccess: boolean;
}

export async function executeWithPartialFailureRecovery<T>(
  items: T[],
  executor: (item: T) => Promise<void>,
  options = { stopOnFirst: false }
): Promise<PartialFailureResult<T>> {
  const successful: T[] = [];
  const failed: Array<{ item: T; error: Error }> = [];

  for (const item of items) {
    try {
      await executor(item);
      successful.push(item);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      failed.push({ item, error: err });

      if (options.stopOnFirst) {
        break;
      }
    }
  }

  return {
    successful,
    failed,
    partialSuccess: successful.length > 0 && failed.length > 0,
  };
}

/**
 * Network resilience helpers
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options = {
    maxAttempts: 3,
    initialDelayMs: 1000,
    backoffMultiplier: 2,
  }
): Promise<T> {
  let lastError: Error | null = null;
  let delayMs = options.initialDelayMs;

  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < options.maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= options.backoffMultiplier;
      }
    }
  }

  throw lastError || new Error("Operation failed after retries");
}

/**
 * Optimistic UI helpers
 */
export interface OptimisticUpdate<T> {
  previousValue: T;
  optimisticValue: T;
  execute: () => Promise<T>;
}

export async function withOptimisticUpdate<T>(
  update: OptimisticUpdate<T>,
  callbacks: {
    onOptimistic?: (value: T) => void;
    onSuccess?: (value: T) => void;
    onError?: (error: Error, previous: T) => void;
  }
): Promise<T> {
  // Apply optimistic update
  callbacks.onOptimistic?.(update.optimisticValue);

  try {
    // Execute the operation
    const result = await update.execute();
    callbacks.onSuccess?.(result);
    return result;
  } catch (error) {
    // Rollback on error
    const err = error instanceof Error ? error : new Error(String(error));
    callbacks.onError?.(err, update.previousValue);
    throw err;
  }
}
