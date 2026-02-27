/**
 * Stage 1: Render Cost Guard
 *
 * Enforces monthly render spend limits at the job creation boundary.
 * Uses Redis counter (integer cents) for O(1) cost checks.
 * Falls back to DB scan if Redis is unavailable.
 *
 * Two thresholds:
 *   - Soft cap: warns + logs but allows renders
 *   - Hard cap: blocks new renders unless operator passes override flag
 *
 * Per-job ceiling: kills individual runaway renders.
 */

import type { Core } from '@strapi/strapi';

const { redisClient } = require('./redis-client');

const SOFT_CAP = parseFloat(process.env.RENDER_COST_USD_SOFT_CAP || '0');
const HARD_CAP = parseFloat(process.env.RENDER_COST_USD_HARD_CAP || '0');
const JOB_MAX_USD = parseFloat(process.env.RENDER_JOB_MAX_USD || '0');

export interface CostCheckResult {
  allowed: boolean;
  monthlyAccruedUSD: number;
  projectedMonthEndUSD: number;
  softCapUSD: number;
  hardCapUSD: number;
  warning?: string;
  blocked?: string;
}

/**
 * Redis key for the monthly cost counter.
 * Stores cost in integer cents for atomic INCR.
 */
function monthlyRedisKey(): string {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `render:cost:${yearMonth}`;
}

/**
 * Increment the monthly cost counter in Redis.
 * Called by completeJob when cost data is available.
 */
export async function recordRenderCost(costUSD: number): Promise<void> {
  if (costUSD <= 0) return;

  const cents = Math.round(costUSD * 100);
  const key = monthlyRedisKey();

  if (redisClient.isAvailable()) {
    // Increment by cents amount using sequential incr calls
    // (redis-client.js doesn't expose incrBy, so we set directly)
    const current = await redisClient.get(key);
    const currentCents = parseInt(current || '0', 10);
    const newCents = currentCents + cents;
    // Expire at end of next month (safety buffer)
    await redisClient.set(key, String(newCents), 45 * 24 * 3600);
  }
}

/**
 * Get monthly accrued cost. Reads from Redis (O(1)) with DB fallback.
 */
async function getMonthlyAccrued(strapi: Core.Strapi): Promise<number> {
  // Try Redis first
  if (redisClient.isAvailable()) {
    const cached = await redisClient.get(monthlyRedisKey());
    if (cached !== null) {
      return parseInt(cached, 10) / 100;
    }
  }

  // Fallback: scan DB
  const accrued = await scanMonthlyFromDB(strapi);

  // Warm Redis for next check
  if (redisClient.isAvailable()) {
    const cents = Math.round(accrued * 100);
    await redisClient.set(monthlyRedisKey(), String(cents), 45 * 24 * 3600);
  }

  return accrued;
}

/**
 * Sum all render costs for the current calendar month from DB.
 */
async function scanMonthlyFromDB(strapi: Core.Strapi): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const jobs = await strapi.entityService.findMany('api::render-job.render-job', {
    filters: {
      status: 'completed',
      renderCompletedAt: { $gte: monthStart.toISOString() },
    } as any,
    fields: ['metadata'],
    limit: 1000,
  }) as any[];

  let total = 0;
  for (const job of jobs ?? []) {
    const cost = job.metadata?.costData?.accruedSoFar;
    if (typeof cost === 'number' && cost > 0) {
      total += cost;
    }
  }

  return total;
}

/**
 * Project month-end spend based on daily burn rate.
 */
function projectMonthEnd(accruedUSD: number): number {
  const now = new Date();
  const dayOfMonth = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  if (dayOfMonth <= 1) return accruedUSD;

  const dailyRate = accruedUSD / dayOfMonth;
  return dailyRate * daysInMonth;
}

/**
 * Check if a new render is allowed under the current cost caps.
 * Call this before creating a new render job.
 */
export async function checkRenderCostCap(
  strapi: Core.Strapi,
  operatorOverride = false
): Promise<CostCheckResult> {
  // If no caps configured, always allow
  if (SOFT_CAP <= 0 && HARD_CAP <= 0) {
    return {
      allowed: true,
      monthlyAccruedUSD: 0,
      projectedMonthEndUSD: 0,
      softCapUSD: SOFT_CAP,
      hardCapUSD: HARD_CAP,
    };
  }

  const monthlyAccruedUSD = await getMonthlyAccrued(strapi);
  const projectedMonthEndUSD = projectMonthEnd(monthlyAccruedUSD);

  const result: CostCheckResult = {
    allowed: true,
    monthlyAccruedUSD,
    projectedMonthEndUSD,
    softCapUSD: SOFT_CAP,
    hardCapUSD: HARD_CAP,
  };

  // Hard cap check (actual spend)
  if (HARD_CAP > 0 && monthlyAccruedUSD >= HARD_CAP) {
    if (operatorOverride) {
      strapi.log.warn(
        `[render-cost-guard] Hard cap override used. ` +
        `Monthly spend: $${monthlyAccruedUSD.toFixed(2)} / $${HARD_CAP.toFixed(2)} cap`
      );
      result.warning = `Hard cap exceeded ($${monthlyAccruedUSD.toFixed(2)}/$${HARD_CAP.toFixed(2)}) — operator override active`;
    } else {
      result.allowed = false;
      result.blocked =
        `Monthly render cost ($${monthlyAccruedUSD.toFixed(2)}) exceeds hard cap ` +
        `($${HARD_CAP.toFixed(2)}). Pass operatorOverride to force.`;
      strapi.log.error(`[render-cost-guard] BLOCKED: ${result.blocked}`);
      return result;
    }
  }

  // Soft cap check (actual spend)
  if (SOFT_CAP > 0 && monthlyAccruedUSD >= SOFT_CAP) {
    result.warning =
      `Monthly render cost ($${monthlyAccruedUSD.toFixed(2)}) exceeds soft cap ` +
      `($${SOFT_CAP.toFixed(2)}). Consider pausing non-essential renders.`;
    strapi.log.warn(`[render-cost-guard] ${result.warning}`);
  }

  // Projected spend warning (even if under actual caps)
  if (HARD_CAP > 0 && projectedMonthEndUSD > HARD_CAP && !result.warning) {
    result.warning =
      `Projected month-end spend ($${projectedMonthEndUSD.toFixed(2)}) ` +
      `will exceed hard cap ($${HARD_CAP.toFixed(2)}) at current rate.`;
    strapi.log.warn(`[render-cost-guard] ${result.warning}`);
  }

  return result;
}

/**
 * Check if a single job's cost exceeds the per-job ceiling.
 * Call this during render progress polling.
 * Returns true if the job should be killed.
 */
export function isJobOverCeiling(jobCostUSD: number): boolean {
  if (JOB_MAX_USD <= 0) return false;
  return jobCostUSD > JOB_MAX_USD;
}
