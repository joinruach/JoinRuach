"use client";

import { useCallback } from "react";

import LikeButton from "@/components/social/LikeButton";
import ShareButton, { type SharePlatform } from "@/components/social/ShareButton";
import type { ContentType } from "@/lib/likes";
import { trackLike } from "@/lib/likes";
import { trackShare } from "@/lib/share";

interface MediaEngagementControlsProps {
  contentType: ContentType;
  contentId: string | number;
  initialLikes?: number;
  shareUrl: string;
  shareTitle: string;
  shareDescription?: string;
  shareHashtags?: string[];
}

export default function MediaEngagementControls({
  contentType,
  contentId,
  initialLikes = 0,
  shareUrl,
  shareTitle,
  shareDescription,
  shareHashtags,
}: MediaEngagementControlsProps) {
  const handleLike = useCallback(
    (_liked: boolean, _count: number) => {
      trackLike(contentType, contentId, _liked);
    },
    [contentType, contentId]
  );

  const handleShare = useCallback(
    (platform: SharePlatform) => {
      trackShare(platform, contentType, contentId);
    },
    [contentType, contentId]
  );

  return (
    <div className="flex items-center gap-2">
      <LikeButton
        contentType={contentType}
        contentId={contentId}
        initialLikes={initialLikes}
        onLike={handleLike}
      />
      <ShareButton
        url={shareUrl}
        title={shareTitle}
        description={shareDescription}
        hashtags={shareHashtags}
        onShare={handleShare}
      />
    </div>
  );
}
