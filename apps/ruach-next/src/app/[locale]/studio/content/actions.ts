'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { deleteMediaItem } from '@/lib/strapi-admin';

/**
 * Server action to delete a media item
 */
export async function deleteMediaItemAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await deleteMediaItem(id, session.strapiJwt);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/studio');
  revalidatePath('/studio/content');

  return { success: true };
}
