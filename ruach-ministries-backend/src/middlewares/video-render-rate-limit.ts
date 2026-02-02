/**
 * Video Render Rate Limiting Middleware
 * User-based rate limiting for video rendering operations
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetAt: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetAt < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

// Rate limit configurations by operation type
const RENDER_LIMITS = {
  create: {
    points: Number(process.env.VIDEO_RENDER_MAX_RENDERS) || 5,
    duration: Number(process.env.VIDEO_RENDER_WINDOW_SECONDS) || 900, // 15 min
    message: 'You have exceeded the render limit. Please wait before creating new renders.',
  },
  status: {
    points: Number(process.env.VIDEO_STATUS_MAX_REQUESTS) || 100,
    duration: Number(process.env.VIDEO_STATUS_WINDOW_SECONDS) || 60, // 1 min
    message: 'Too many status checks. Please slow down.',
  },
  cancel: {
    points: 30,
    duration: 60, // 1 min
    message: 'Too many cancel requests. Please slow down.',
  },
  list: {
    points: 30,
    duration: 60, // 1 min
    message: 'Too many list requests. Please slow down.',
  },
};

type OperationType = keyof typeof RENDER_LIMITS;

function getOperationType(ctx: any): OperationType {
  const path = ctx.request.path;
  const method = ctx.request.method;

  // POST requests for creating renders (including quick-render endpoints)
  if (method === 'POST' && !path.includes('/cancel')) {
    return 'create';
  }

  // GET status endpoint
  if (method === 'GET' && path.includes('/status')) {
    return 'status';
  }

  // POST cancel endpoint
  if (method === 'POST' && path.includes('/cancel')) {
    return 'cancel';
  }

  // GET list endpoint
  if (method === 'GET' && path === '/api/video-renders') {
    return 'list';
  }

  // Default to status limits for unknown operations
  return 'status';
}

export default () => {
  return async (ctx: any, next: () => Promise<void>) => {
    // Skip rate limiting for admins
    if (ctx.state.user?.isAdmin) {
      return next();
    }

    // Get user ID (should be set by is-authenticated-or-admin policy)
    const userId = ctx.state.user?.id;

    if (!userId) {
      // This shouldn't happen if policies are correctly applied
      ctx.status = 401;
      ctx.body = { error: 'Authentication required' };
      return;
    }

    const operationType = getOperationType(ctx);
    const limit = RENDER_LIMITS[operationType];
    const now = Date.now();
    const key = `video-render:${operationType}:${userId}`;

    // Initialize or reset counter if window expired
    if (!store[key] || store[key].resetAt < now) {
      store[key] = {
        count: 0,
        resetAt: now + limit.duration * 1000,
      };
    }

    store[key].count++;

    const remaining = Math.max(0, limit.points - store[key].count);
    const resetAt = new Date(store[key].resetAt);

    // Set rate limit headers
    ctx.set('X-RateLimit-Limit', String(limit.points));
    ctx.set('X-RateLimit-Remaining', String(remaining));
    ctx.set('X-RateLimit-Reset', resetAt.toISOString());

    // Check if limit exceeded
    if (store[key].count > limit.points) {
      const retryAfter = Math.ceil((store[key].resetAt - now) / 1000);

      ctx.status = 429;
      ctx.body = {
        error: limit.message,
        retryAfter,
        retryAfterDate: resetAt.toISOString(),
      };

      strapi.log.warn(
        `Rate limit exceeded for user ${userId} on ${operationType} operation`
      );

      return;
    }

    await next();
  };
};
