"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const LightRays = dynamic(() => import("@/components/LightRays/LightRays"), {
  ssr: false,
});

export default function PageAtmosphere() {
  const [root, setRoot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setRoot(document.getElementById("page-atmosphere-root"));
  }, []);

  if (!root) return null;

  return createPortal(
    <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
      <LightRays
        raysOrigin="top-center"
        raysColor="#ffdb8c"
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
        className="absolute inset-0 opacity-30"
      />
    </div>
    ,
    root
  );
}
