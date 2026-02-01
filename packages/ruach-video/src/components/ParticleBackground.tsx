import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

interface ParticleBackgroundProps {
  count?: number;
  color?: string;
  speed?: number;
  style?: "stars" | "dust" | "orbs" | "ascending";
}

export const ParticleBackground: React.FC<ParticleBackgroundProps> = ({
  count = 50,
  color = "#C4A052",
  speed = 1,
  style = "stars",
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();

  // Generate deterministic particles
  const particles = React.useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      const random = () => {
        const val = Math.sin(seed + i) * 43758.5453;
        return val - Math.floor(val);
      };

      return {
        x: random() * width,
        y: random() * height,
        size: 1 + random() * 3,
        speed: 0.5 + random() * 1.5,
        opacity: 0.3 + random() * 0.7,
        delay: random() * 100,
      };
    });
  }, [count, width, height]);

  const renderStars = () => (
    <>
      {particles.map((particle, i) => {
        const twinkle = Math.sin((frame + particle.delay) * 0.1) * 0.3 + 0.7;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: particle.opacity * twinkle,
              boxShadow: `0 0 ${particle.size * 2}px ${color}`,
            }}
          />
        );
      })}
    </>
  );

  const renderDust = () => (
    <>
      {particles.map((particle, i) => {
        const movement = ((frame * particle.speed * speed) / 10) % height;
        const drift = Math.sin((frame + particle.delay) * 0.02) * 20;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: particle.x + drift,
              top: (particle.y + movement) % height,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: particle.opacity * 0.5,
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </>
  );

  const renderOrbs = () => (
    <>
      {particles.slice(0, 10).map((particle, i) => {
        const scale = Math.sin((frame + particle.delay) * 0.02) * 0.3 + 1;
        const x = particle.x + Math.sin((frame + particle.delay) * 0.01) * 50;
        const y = particle.y + Math.cos((frame + particle.delay) * 0.015) * 30;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 100 + particle.size * 30,
              height: 100 + particle.size * 30,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
              transform: `scale(${scale})`,
              filter: "blur(30px)",
            }}
          />
        );
      })}
    </>
  );

  const renderAscending = () => (
    <>
      {particles.map((particle, i) => {
        const ascent = ((frame * particle.speed * speed) / 5) % (height + 50);
        const sway = Math.sin((frame + particle.delay) * 0.03) * 15;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: particle.x + sway,
              bottom: ascent - 50,
              width: particle.size * 2,
              height: particle.size * 2,
              borderRadius: "50%",
              backgroundColor: color,
              opacity: particle.opacity * (1 - ascent / height),
              filter: "blur(1px)",
            }}
          />
        );
      })}
    </>
  );

  const getContent = () => {
    switch (style) {
      case "stars":
        return renderStars();
      case "dust":
        return renderDust();
      case "orbs":
        return renderOrbs();
      case "ascending":
        return renderAscending();
      default:
        return renderStars();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      {getContent()}
    </div>
  );
};
