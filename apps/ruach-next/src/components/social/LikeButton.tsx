"use client";

import { useEffect, useState } from "react";

import { trackLike } from "@/lib/likes";

export interface LikeButtonProps {
  contentType: "media" | "course" | "series" | "event";
  contentId: string | number;
  initialLikes?: number;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function LikeButton({
  contentType,
  contentId,
  initialLikes = 0,
  showCount = true,
  size = "md",
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Key for localStorage
  const storageKey = `like_${contentType}_${contentId}`;

  useEffect(() => {
    setMounted(true);
    // Start with localStorage, then reconcile with backend
    const localLiked = localStorage.getItem(storageKey) === "true";
    setIsLiked(localLiked);

    // Check backend for authoritative like state
    fetch(`/api/likes?contentType=${contentType}&contentId=${contentId}&action=check`)
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.liked === "boolean") {
          setIsLiked(data.liked);
          if (data.liked) {
            localStorage.setItem(storageKey, "true");
          } else {
            localStorage.removeItem(storageKey);
          }
        }
      })
      .catch(() => {
        // Keep localStorage state as fallback
      });
  }, [storageKey, contentType, contentId]);

  const handleLike = async () => {
    if (isAnimating) return;

    const newLikedState = !isLiked;
    const newCount = newLikedState ? likeCount + 1 : likeCount - 1;

    // Optimistic UI update
    setIsLiked(newLikedState);
    setLikeCount(newCount);
    setIsAnimating(true);

    // Store in localStorage
    if (newLikedState) {
      localStorage.setItem(storageKey, "true");
    } else {
      localStorage.removeItem(storageKey);
    }

    // Trigger animation
    setTimeout(() => setIsAnimating(false), 600);

    trackLike(contentType, contentId, newLikedState);

    // Persist to backend (toggle is idempotent)
    try {
      const res = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType, contentId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Reconcile with server count
        setLikeCount(data.count);
        setIsLiked(data.liked);
        if (data.liked) {
          localStorage.setItem(storageKey, "true");
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    } catch {
      // Optimistic UI stays — localStorage is fallback
    }
  };

  // Size variants
  const sizeClasses = {
    sm: {
      button: "h-8 px-2.5",
      icon: "h-4 w-4",
      text: "text-sm",
    },
    md: {
      button: "h-10 px-3",
      icon: "h-5 w-5",
      text: "text-base",
    },
    lg: {
      button: "h-12 px-4",
      icon: "h-6 w-6",
      text: "text-lg",
    },
  };

  const sizes = sizeClasses[size];

  if (!mounted) {
    return (
      <div
        className={`flex items-center gap-2 rounded-full bg-white/5 ${sizes.button}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <button
      onClick={handleLike}
      className={`group flex items-center gap-2 rounded-full transition-all ${sizes.button} ${
        isLiked
          ? "bg-rose-500/20 text-rose-500 hover:bg-rose-500/30 dark:bg-rose-500/20 dark:text-rose-400"
          : "bg-white/10 text-neutral-600 hover:bg-white/20 hover:text-rose-500 dark:bg-white/5 dark:text-neutral-400 dark:hover:bg-white/10 dark:hover:text-rose-400"
      }`}
      aria-label={isLiked ? "Unlike" : "Like"}
      aria-pressed={isLiked}
    >
      {/* Heart Icon */}
      <svg
        className={`transition-all ${sizes.icon} ${
          isAnimating ? "scale-125" : "scale-100"
        } ${isLiked ? "fill-current" : "fill-none"}`}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>

      {/* Like Count */}
      {showCount && (
        <span className={`font-medium tabular-nums ${sizes.text}`}>
          {likeCount > 999 ? `${(likeCount / 1000).toFixed(1)}k` : likeCount}
        </span>
      )}

      {/* Particles animation on like */}
      {isAnimating && isLiked && (
        <>
          <span
            className="pointer-events-none absolute animate-ping"
            style={{
              animation: "ping 0.6s cubic-bezier(0, 0, 0.2, 1)",
            }}
          >
            ❤️
          </span>
        </>
      )}
    </button>
  );
}
