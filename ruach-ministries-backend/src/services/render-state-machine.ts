/**
 * Phase 13: Render State Machine
 *
 * Single source of truth for render job state transitions
 * Adapted to work with existing schema status enum: queued, processing, completed, failed, cancelled
 */

export type RenderStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface StateTransition {
  from: RenderStatus;
  to: RenderStatus;
  allowed: boolean;
  reason?: string;
}

export default class RenderStateMachine {
  /**
   * Valid state transitions
   *
   * Workflow: queued → processing → completed/failed
   * Cancellation: any active state → cancelled
   * Retry: failed → queued
   */
  private static readonly TRANSITIONS: Record<RenderStatus, RenderStatus[]> = {
    queued: ['processing', 'cancelled'],
    processing: ['completed', 'failed', 'cancelled'],
    completed: [], // Terminal state
    failed: ['queued'], // Allow retry
    cancelled: [], // Terminal state
  };

  /**
   * Check if a state transition is valid
   *
   * @param from - Current status
   * @param to - Desired status
   * @returns Transition validation result
   */
  static canTransition(from: RenderStatus, to: RenderStatus): StateTransition {
    const allowed = this.TRANSITIONS[from]?.includes(to) ?? false;

    if (!allowed) {
      return {
        from,
        to,
        allowed: false,
        reason: `Invalid transition: ${from} → ${to}`,
      };
    }

    return { from, to, allowed: true };
  }

  /**
   * Validate retry is allowed
   *
   * @param status - Current job status
   * @param attempts - Current attempt count (if tracked externally)
   * @param maxAttempts - Maximum allowed attempts (if tracked externally)
   * @returns True if retry is allowed
   */
  static canRetry(status: RenderStatus, attempts?: number, maxAttempts?: number): boolean {
    // Only failed jobs can retry
    if (status !== 'failed') {
      return false;
    }

    // If attempt limits are tracked, check them
    if (attempts !== undefined && maxAttempts !== undefined) {
      return attempts < maxAttempts;
    }

    // Otherwise allow retry (external system will enforce limits)
    return true;
  }

  /**
   * Determine if status is terminal (no further transitions)
   *
   * @param status - Job status to check
   * @returns True if status is terminal
   */
  static isTerminal(status: RenderStatus): boolean {
    return status === 'completed' || status === 'cancelled';
  }

  /**
   * Determine if status is active (job is in progress)
   *
   * @param status - Job status to check
   * @returns True if job is actively being processed
   */
  static isActive(status: RenderStatus): boolean {
    return status === 'queued' || status === 'processing';
  }

  /**
   * Get next expected status in happy path
   *
   * @param current - Current status
   * @returns Next status in workflow or null if terminal
   */
  static getNextStatus(current: RenderStatus): RenderStatus | null {
    const happyPath: Record<RenderStatus, RenderStatus | null> = {
      queued: 'processing',
      processing: 'completed',
      completed: null,
      failed: 'queued', // Retry
      cancelled: null,
    };

    return happyPath[current] ?? null;
  }

  /**
   * Get human-readable status description
   *
   * @param status - Job status
   * @returns Description of what the status means
   */
  static getStatusDescription(status: RenderStatus): string {
    const descriptions: Record<RenderStatus, string> = {
      queued: 'Job is waiting in queue to be processed',
      processing: 'Job is actively being rendered',
      completed: 'Job completed successfully with output artifacts',
      failed: 'Job failed due to error (can be retried)',
      cancelled: 'Job was cancelled by operator',
    };

    return descriptions[status] || 'Unknown status';
  }
}
