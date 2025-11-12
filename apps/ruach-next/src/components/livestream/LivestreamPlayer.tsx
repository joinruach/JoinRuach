"use client";

import { useState } from "react";
import LiveIndicator from "./LiveIndicator";

export interface LivestreamPlayerProps {
  videoId: string;
  isLive?: boolean;
  showChat?: boolean;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

/**
 * LivestreamPlayer - Enhanced YouTube livestream player with optional chat
 *
 * Features:
 * - Live indicator badge
 * - Side-by-side chat (desktop) or tabbed (mobile)
 * - Responsive layout
 * - Autoplay support
 *
 * Usage:
 * <LivestreamPlayer
 *   videoId="dQw4w9WgXcQ"
 *   isLive={true}
 *   showChat={true}
 *   title="Sunday Service"
 * />
 */
export default function LivestreamPlayer({
  videoId,
  isLive = false,
  showChat = false,
  title = "Livestream",
  autoplay = false,
  className = "",
}: LivestreamPlayerProps) {
  const [activeTab, setActiveTab] = useState<"video" | "chat">("video");

  // Construct YouTube embed URLs
  const videoUrl = `https://www.youtube-nocookie.com/embed/${videoId}?${new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    modestbranding: "1",
    rel: "0",
    ...(isLive && { live: "1" }),
  }).toString()}`;

  const chatUrl = `https://www.youtube.com/live_chat?v=${videoId}&embed_domain=${
    typeof window !== "undefined" ? window.location.hostname : "localhost"
  }`;

  return (
    <div className={`w-full ${className}`}>
      {/* Live indicator */}
      {isLive && (
        <div className="mb-4 flex items-center justify-between">
          <LiveIndicator isLive={true} size="md" />
          <span className="text-sm text-neutral-600 dark:text-neutral-400">
            {title}
          </span>
        </div>
      )}

      {/* Desktop: Side-by-side layout */}
      {showChat ? (
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-4">
          {/* Video (2/3 width) */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={videoUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>

          {/* Chat (1/3 width) */}
          <div className="lg:col-span-1">
            <div className="h-full overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Live Chat
                </h3>
              </div>
              <div className="relative h-[calc(100%-48px)]">
                <iframe
                  src={chatUrl}
                  title="Live Chat"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Video only (no chat) */
        <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
          <iframe
            src={videoUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>
      )}

      {/* Mobile: Tabbed layout */}
      {showChat && (
        <div className="lg:hidden">
          {/* Tab buttons */}
          <div className="mb-3 flex gap-2 border-b border-neutral-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab("video")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "video"
                  ? "border-b-2 border-amber-500 text-amber-500"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Video
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "chat"
                  ? "border-b-2 border-amber-500 text-amber-500"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              Chat
            </button>
          </div>

          {/* Tab content */}
          {activeTab === "video" ? (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={videoUrl}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-white/10 dark:bg-neutral-900">
              <div className="border-b border-neutral-200 bg-neutral-50 p-3 dark:border-white/10 dark:bg-neutral-800">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Live Chat
                </h3>
              </div>
              <div className="relative h-[500px]">
                <iframe
                  src={chatUrl}
                  title="Live Chat"
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
