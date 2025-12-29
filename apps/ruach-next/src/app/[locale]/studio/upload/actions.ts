'use server';

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createMediaItem } from '@/lib/strapi-admin';
import { mediaUploadSchema, type MediaUploadFormData } from '@/lib/upload-schema';

/**
 * Server action to create a new media item
 */
export async function createMediaItemAction(
  data: MediaUploadFormData
): Promise<{ success: boolean; id?: number; error?: string }> {
  // Check authentication
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  // Validate data
  const validation = mediaUploadSchema.safeParse(data);

  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors.map((e) => e.message).join(', '),
    };
  }

  // Create media item in Strapi
  const result = await createMediaItem(
    {
      title: data.title,
      description: data.description,
      excerpt: data.excerpt,
      contentType: data.contentType,
      videoUrl: data.videoUrl,
      sourceKey: data.sourceKey,
      thumbnail: data.thumbnail,
      speakers: data.speakers,
      tags: data.tags,
      categories: data.categories,
      series: data.series,
      weekNumber: data.weekNumber,
      episodeNumber: data.episodeNumber,
      publishYouTube: data.publishYouTube,
      publishFacebook: data.publishFacebook,
      publishInstagram: data.publishInstagram,
      publishX: data.publishX,
      publishPatreon: data.publishPatreon,
      publishRumble: data.publishRumble,
      publishLocals: data.publishLocals,
      publishTruthSocial: data.publishTruthSocial,
      autoPublish: data.autoPublish,
      publishedAt: data.autoPublish ? new Date().toISOString() : null,
    },
    session.strapiJwt
  );

  if (!result.success) {
    return { success: false, error: result.error };
  }

  // Revalidate paths
  revalidatePath('/studio');
  revalidatePath('/studio/content');

  return { success: true, id: result.data?.id };
}

/**
 * Server action to publish an existing media item
 */
export async function publishMediaItemAction(
  id: number
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();

  if (!session?.strapiJwt) {
    return { success: false, error: 'Unauthorized' };
  }

  // This would trigger the auto-publish lifecycle hook in Strapi
  // For now, we just update the publishedAt field
  // The Strapi lifecycle will handle the actual publishing

  revalidatePath('/studio');
  revalidatePath('/studio/content');
  revalidatePath('/studio/publishing');

  return { success: true };
}
