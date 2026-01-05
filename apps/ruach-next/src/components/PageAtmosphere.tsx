"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@ruach/hooks";
import { useTheme } from "@/contexts/ThemeContext";

const LightRays = dynamic(() => import("@/components/LightRays/LightRays"), {
  ssr: false,
});

export default function PageAtmosphere() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const { resolvedTheme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    setRoot(document.getElementById("page-atmosphere-root"));
  }, []);

  if (!root) return null;

  const raysColor = resolvedTheme === "dark" ? "#cfe8ff" : "#fbbf24";

  const desktopLightSettings = {
    raysSpeed: 1.8,
    lightSpread: 3,
    rayLength: 5,
    fadeDistance: 1.2,
    pulsating: false,
    saturation: 1,
    mouseInfluence: 0.1,
    intensity: 1.3,
    pulsationStrength: 0.2,
  };

  const mobileLightSettings = {
    raysSpeed: 2.8,
    lightSpread: 4.5,
    rayLength: 7,
    fadeDistance: 0.95,
    pulsating: true,
    saturation: 1.15,
    mouseInfluence: 0.3,
    intensity: 1.9,
    pulsationStrength: 0.12,
  };

  const lightSettings = isMobile ? mobileLightSettings : desktopLightSettings;
  const lightClassName = isMobile
    ? "absolute inset-0 opacity-[0.55] mix-blend-screen [filter:saturate(1.3) contrast(1.05)] dark:opacity-[0.65] dark:mix-blend-screen"
    : "absolute inset-0 opacity-[0.18] mix-blend-multiply [filter:saturate(1.1)] dark:opacity-[0.35] dark:mix-blend-screen";

  return createPortal(
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <LightRays
        raysOrigin="top-center"
        raysColor={raysColor}
        raysSpeed={lightSettings.raysSpeed}
        lightSpread={lightSettings.lightSpread}
        rayLength={lightSettings.rayLength}
        pulsating={lightSettings.pulsating}
        fadeDistance={lightSettings.fadeDistance}
        saturation={lightSettings.saturation}
        intensity={lightSettings.intensity}
        pulsationStrength={lightSettings.pulsationStrength}
        followMouse
        mouseInfluence={lightSettings.mouseInfluence}
        noiseAmount={0}
        distortion={0}
        className={lightClassName}
      />
    </div>
    ,
    root
  );
}
