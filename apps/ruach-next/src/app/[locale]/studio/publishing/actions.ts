'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { retryPublish } from '@/lib/strapi-admin';

/**
 * Server action to retry failed publish
 */
export async function retryPublishAction(
  id: number,
  platform: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await retryPublish(id, platform, session.strapiJwt);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/studio/publishing');

  return { success: true };
}
