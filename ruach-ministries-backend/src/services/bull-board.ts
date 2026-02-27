/**
 * Stage 1: BullBoard Dashboard
 *
 * Mounts BullMQ queue monitoring UI at /admin/queues.
 * Protected by basic auth via BULL_BOARD_USER/BULL_BOARD_PASSWORD env vars.
 */

import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { KoaAdapter } from '@bull-board/koa';
import RenderQueue from './render-queue';

const BOARD_USER = process.env.BULL_BOARD_USER || 'admin';
const BOARD_PASSWORD = process.env.BULL_BOARD_PASSWORD || '';

/**
 * Mount BullBoard dashboard onto Strapi's Koa app.
 * Call this during the Strapi register lifecycle.
 */
export async function mountBullBoard(app: any): Promise<void> {
  if (!BOARD_PASSWORD) {
    console.warn('[bull-board] BULL_BOARD_PASSWORD not set — dashboard disabled');
    return;
  }

  const renderQueue = await RenderQueue.getQueue();

  const serverAdapter = new KoaAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(renderQueue)],
    serverAdapter,
  });

  // Basic auth middleware
  const authMiddleware: any = async (ctx: any, next: any) => {
    const auth = ctx.headers.authorization;

    if (!auth || !auth.startsWith('Basic ')) {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic realm="BullBoard"');
      ctx.body = 'Authentication required';
      return;
    }

    const decoded = Buffer.from(auth.slice(6), 'base64').toString();
    const [user, pass] = decoded.split(':');

    if (user !== BOARD_USER || pass !== BOARD_PASSWORD) {
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic realm="BullBoard"');
      ctx.body = 'Invalid credentials';
      return;
    }

    await next();
  };

  app.use(authMiddleware);
  app.use(serverAdapter.registerPlugin());

  console.log('[bull-board] Dashboard mounted at /admin/queues');
}
