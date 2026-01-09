"use client";

import dynamic from "next/dynamic";

const LivePreview = dynamic(() => import("./LivePreview"), {
  ssr: false,
  loading: () => null,
});

export default function LivePreviewGate({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <LivePreview />;
}

