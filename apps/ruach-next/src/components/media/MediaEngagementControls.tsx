"use client";

import LikeButton from "@/components/social/LikeButton";
import ShareButton from "@/components/social/ShareButton";
import type { ContentType } from "@/lib/likes";

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

  return (
    <div className="flex items-center gap-2">
      <LikeButton
        contentType={contentType}
        contentId={contentId}
        initialLikes={initialLikes}
      />
      <ShareButton
        url={shareUrl}
        title={shareTitle}
        description={shareDescription}
        hashtags={shareHashtags}
        contentType={contentType}
        contentId={contentId}
      />
    </div>
  );
}
