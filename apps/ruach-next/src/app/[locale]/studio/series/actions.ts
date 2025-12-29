'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSeries, updateSeries, deleteSeries } from '@/lib/strapi-admin';

/**
 * Server action to create a new series
 */
export async function createSeriesAction(data: {
  title: string;
  slug: string;
  description?: string;
}): Promise<{ success: boolean; id?: number; error?: string }> {
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await createSeries(data, session.strapiJwt);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/studio/series');
  revalidatePath('/studio/upload');

  return { success: true, id: result.data?.id };
}

/**
 * Server action to update an existing series
 */
export async function updateSeriesAction(
  id: number,
  data: {
    title?: string;
    slug?: string;
    description?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await updateSeries(id, data, session.strapiJwt);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/studio/series');

  return { success: true };
}

/**
 * Server action to delete a series
 */
export async function deleteSeriesAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  const result = await deleteSeries(id, session.strapiJwt);

  if (!result.success) {
    return { success: false, error: result.error };
  }

  revalidatePath('/studio/series');

  return { success: true };
}
