"use client";

import { useState } from "react";

export type SharePlatform = "twitter" | "facebook" | "linkedin" | "email" | "copy";

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  hashtags?: string[];
  onShare?: (platform: SharePlatform) => void;
  className?: string;
}

const platformConfig = {
  twitter: {
    name: "Twitter",
    icon: "𝕏",
    color: "bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200",
    getUrl: (url: string, title: string, hashtags?: string[]) => {
      const params = new URLSearchParams();
      params.set("url", url);
      params.set("text", title);
      if (hashtags?.length) {
        params.set("hashtags", hashtags.join(","));
      }
      return `https://twitter.com/intent/tweet?${params.toString()}`;
    },
  },
  facebook: {
    name: "Facebook",
    icon: "f",
    color: "bg-blue-600 hover:bg-blue-700",
    getUrl: (url: string) => {
      const params = new URLSearchParams();
      params.set("u", url);
      return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
    },
  },
  linkedin: {
    name: "LinkedIn",
    icon: "in",
    color: "bg-blue-700 hover:bg-blue-800",
    getUrl: (url: string, title: string, description?: string) => {
      const params = new URLSearchParams();
      params.set("url", url);
      params.set("title", title);
      if (description) {
        params.set("summary", description);
      }
      return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
    },
  },
  email: {
    name: "Email",
    icon: "✉",
    color: "bg-neutral-600 hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600",
    getUrl: (url: string, title: string, description?: string) => {
      const body = description ? `${description}\n\n${url}` : url;
      return `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
    },
  },
};

export default function ShareButton({
  url,
  title,
  description,
  hashtags,
  onShare,
  className = "",
}: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = (platform: SharePlatform) => {
    // Track share event
    onShare?.(platform);

    if (platform === "copy") {
      // Copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }

    // Get platform URL
    const config = platformConfig[platform];
    let shareUrl: string;

    if (platform === "twitter") {
      shareUrl = config.getUrl(url, title, hashtags);
    } else if (platform === "facebook") {
      shareUrl = config.getUrl(url);
    } else {
      // linkedin or email
      shareUrl = config.getUrl(url, title, description);
    }

    // Open in new window
    window.open(shareUrl, "_blank", "width=600,height=400");
    setShowMenu(false);
  };

  // Use native share API if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        onShare?.("copy"); // Track as generic share
        setShowMenu(false);
      } catch (err) {
        // User cancelled or error - do nothing
      }
    } else {
      setShowMenu(!showMenu);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={handleNativeShare}
        className="flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-500"
        aria-label="Share content"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        <span>Share</span>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-2xl dark:border-white/10 dark:bg-neutral-900">
            <div className="mb-2 px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Share via
              </p>
            </div>

            <div className="space-y-1">
              {(Object.keys(platformConfig) as SharePlatform[]).map((platform) => {
                const config = platformConfig[platform];
                return (
                  <button
                    key={platform}
                    onClick={() => handleShare(platform)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-white transition ${config.color}`}
                  >
                    <span className="text-lg">{config.icon}</span>
                    <span>{config.name}</span>
                  </button>
                );
              })}

              {/* Copy Link */}
              <button
                onClick={() => handleShare("copy")}
                className="flex w-full items-center gap-3 rounded-lg bg-neutral-100 px-3 py-2 text-left text-sm font-medium text-neutral-900 transition hover:bg-neutral-200 dark:bg-neutral-800 dark:text-white dark:hover:bg-neutral-700"
              >
                <span className="text-lg">
                  {copied ? "✓" : "🔗"}
                </span>
                <span>{copied ? "Copied!" : "Copy Link"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
