"use client";

import { useEffect, useState } from "react";
import {
  isContentLiked,
  likeContent,
  unlikeContent,
  getAllLikedContent,
  getLikedContentByType,
  getLikedContentCount,
  type ContentType,
  type LikedContent,
} from "@/lib/likes";

/**
 * Hook to manage likes for a specific content item
 */
export function useLike(contentType: ContentType, contentId: string | number) {
  const [isLiked, setIsLiked] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsLiked(isContentLiked(contentType, contentId));
  }, [contentType, contentId]);

  const toggleLike = () => {
    if (isLiked) {
      unlikeContent(contentType, contentId);
      setIsLiked(false);
    } else {
      likeContent(contentType, contentId);
      setIsLiked(true);
    }
  };

  const like = () => {
    if (!isLiked) {
      likeContent(contentType, contentId);
      setIsLiked(true);
    }
  };

  const unlike = () => {
    if (isLiked) {
      unlikeContent(contentType, contentId);
      setIsLiked(false);
    }
  };

  return {
    isLiked: mounted ? isLiked : false,
    toggleLike,
    like,
    unlike,
    mounted,
  };
}

/**
 * Hook to get all liked content
 */
export function useAllLikes() {
  const [likes, setLikes] = useState<LikedContent[]>([]);
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLikes(getAllLikedContent());
    setCount(getLikedContentCount());
  }, []);

  const refresh = () => {
    setLikes(getAllLikedContent());
    setCount(getLikedContentCount());
  };

  return {
    likes: mounted ? likes : [],
    count: mounted ? count : 0,
    refresh,
    mounted,
  };
}

/**
 * Hook to get liked content by type
 */
export function useLikesByType(contentType: ContentType) {
  const [likes, setLikes] = useState<LikedContent[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLikes(getLikedContentByType(contentType));
  }, [contentType]);

  const refresh = () => {
    setLikes(getLikedContentByType(contentType));
  };

  return {
    likes: mounted ? likes : [],
    count: mounted ? likes.length : 0,
    refresh,
    mounted,
  };
}

/**
 * Hook to check if multiple content items are liked
 * Useful for lists/grids where you need to show like status for many items
 */
export function useLikesMap(
  contentType: ContentType,
  contentIds: (string | number)[]
) {
  const [likesMap, setLikesMap] = useState<Record<string | number, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const map: Record<string | number, boolean> = {};
    contentIds.forEach(id => {
      map[id] = isContentLiked(contentType, id);
    });
    setLikesMap(map);
  }, [contentType, contentIds]);

  const toggleLike = (contentId: string | number) => {
    const isLiked = likesMap[contentId];

    if (isLiked) {
      unlikeContent(contentType, contentId);
    } else {
      likeContent(contentType, contentId);
    }

    setLikesMap(prev => ({
      ...prev,
      [contentId]: !isLiked,
    }));
  };

  return {
    likesMap: mounted ? likesMap : {},
    toggleLike,
    mounted,
  };
}
