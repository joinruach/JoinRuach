"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/contexts/ThemeContext";

const LightRays = dynamic(() => import("@/components/LightRays/LightRays"), {
  ssr: false,
});

export default function PageAtmosphere() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setRoot(document.getElementById("page-atmosphere-root"));
  }, []);

  if (!root) return null;

  const raysColor = resolvedTheme === "dark" ? "#cfe8ff" : "#fbbf24";

  return createPortal(
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <LightRays
        raysOrigin="top-center"
        raysColor={raysColor}
        raysSpeed={1.8}
        lightSpread={3}
        rayLength={5}
        pulsating={false}
        fadeDistance={1.2}
        saturation={1}
        followMouse
        mouseInfluence={0.1}
        noiseAmount={0}
        distortion={0}
        className="absolute inset-0 opacity-[0.18] mix-blend-multiply [filter:saturate(1.1)] dark:opacity-[0.35] dark:mix-blend-screen"
      />
    </div>
    ,
    root
  );
}
