import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  Audio,
  Video,
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
} from "remotion";
import { GradientBackground } from "../components/GradientBackground";
import { LowerThird } from "../components/LowerThird";
import { ScriptureCallout } from "../components/ScriptureCallout";
import { AnimatedText } from "../components/AnimatedText";
import { BrandWatermark } from "../components/BrandWatermark";
import type { TeachingVideoProps } from "../schemas";

interface Slide {
  type: "title" | "scripture" | "point" | "diagram" | "quote" | "reflection";
  content: string;
  subContent?: string;
  duration: number;
  scriptureRef?: string;
  imageUrl?: string;
}

export const TeachingVideo: React.FC<TeachingVideoProps> = ({
  title,
  speaker,
  slides = [],
  audioUrl,
  videoUrl,
  showLowerThird = true,
  showScriptureCallouts = true,
  transitionStyle = "smooth",
  brandColor = "#C4A052",
  scriptureCallouts = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  // Calculate slide frames
  const getSlideFrames = () => {
    let currentFrame = 0;
    return slides.map((slide) => {
      const start = currentFrame;
      const duration = slide.duration * fps;
      currentFrame += duration;
      return { ...slide, startFrame: start, endFrame: start + duration };
    });
  };

  const slideFrames = getSlideFrames();

  // Find current slide
  const currentSlideIndex = slideFrames.findIndex(
    (s) => frame >= s.startFrame && frame < s.endFrame
  );
  const currentSlide = slideFrames[currentSlideIndex];

  const renderSlideContent = (slide: Slide & { startFrame: number; endFrame: number }) => {
    const localFrame = frame - slide.startFrame;
    const slideDuration = slide.endFrame - slide.startFrame;

    // Transition progress
    const enterProgress = spring({
      frame: localFrame,
      fps,
      config: { damping: 200, stiffness: 80 },
    });

    const exitStart = slideDuration - 20;
    const exitProgress =
      localFrame > exitStart
        ? interpolate(localFrame, [exitStart, slideDuration], [0, 1], {
            extrapolateRight: "clamp",
          })
        : 0;

    const opacity = interpolate(exitProgress, [0, 1], [1, 0]);

    switch (slide.type) {
      case "title":
        return (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: "#FFFFFF",
                textAlign: "center",
                maxWidth: 1200,
                transform: `translateY(${interpolate(enterProgress, [0, 1], [30, 0])}px)`,
                opacity: enterProgress,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {slide.content}
            </div>
            {slide.subContent && (
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 400,
                  color: brandColor,
                  marginTop: 20,
                  transform: `translateY(${interpolate(enterProgress, [0, 1], [20, 0])}px)`,
                  opacity: enterProgress,
                  fontFamily: "Inter, system-ui, sans-serif",
                }}
              >
                {slide.subContent}
              </div>
            )}
          </AbsoluteFill>
        );

      case "scripture":
        return (
          <ScriptureCallout
            reference={slide.scriptureRef || ""}
            text={slide.content}
            position="center"
            style="dramatic"
            accentColor={brandColor}
            startFrame={0}
            durationFrames={slideDuration}
          />
        );

      case "point":
        return (
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 100,
              opacity,
            }}
          >
            <div style={{ maxWidth: 1000 }}>
              <AnimatedText
                text={slide.content}
                style="word-by-word"
                fontSize={48}
                fontWeight={600}
                color="#FFFFFF"
                align="center"
                lineHeight={1.5}
                startFrame={0}
                durationFrames={slideDuration - 30}
              />
              {slide.subContent && (
                <div
                  style={{
                    fontSize: 24,
                    color: "rgba(255,255,255,0.7)",
                    textAlign: "center",
                    marginTop: 30,
                    opacity: interpolate(localFrame, [30, 50], [0, 1], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    }),
                    fontFamily: "Inter, system-ui, sans-serif",
                  }}
                >
                  {slide.subContent}
                </div>
              )}
            </div>
          </AbsoluteFill>
        );

      case "reflection":
        return (
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              opacity,
            }}
          >
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
                color: brandColor,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                marginBottom: 30,
                opacity: enterProgress,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              Pause & Reflect
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 400,
                color: "#FFFFFF",
                textAlign: "center",
                maxWidth: 900,
                fontStyle: "italic",
                lineHeight: 1.6,
                opacity: enterProgress,
                fontFamily: "Georgia, serif",
              }}
            >
              {slide.content}
            </div>
          </AbsoluteFill>
        );

      default:
        return (
          <AbsoluteFill
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity,
            }}
          >
            <AnimatedText
              text={slide.content}
              style="fade"
              fontSize={36}
              color="#FFFFFF"
              startFrame={0}
              durationFrames={slideDuration}
            />
          </AbsoluteFill>
        );
    }
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Background */}
      {videoUrl ? (
        <Video
          src={videoUrl}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.3,
          }}
          volume={0}
        />
      ) : (
        <GradientBackground theme="dark" animated />
      )}

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
      />

      {/* Slide content */}
      {currentSlide && renderSlideContent(currentSlide)}

      {/* Scripture callouts */}
      {showScriptureCallouts &&
        scriptureCallouts?.map((callout, index) => (
          <Sequence
            key={index}
            from={callout.startTime * fps}
            durationInFrames={callout.duration * fps}
          >
            <ScriptureCallout
              reference={callout.reference}
              text={callout.text}
              position="right"
              style="card"
              accentColor={brandColor}
              startFrame={0}
              durationFrames={callout.duration * fps}
            />
          </Sequence>
        ))}

      {/* Lower third */}
      {showLowerThird && speaker && (
        <LowerThird
          name={speaker}
          title={title}
          style="modern"
          position="bottom-left"
          accentColor={brandColor}
          startFrame={30}
          durationFrames={180}
        />
      )}

      {/* Watermark */}
      <BrandWatermark text="RUACH" position="top-right" size="small" />

      {/* Audio */}
      {audioUrl && <Audio src={audioUrl} />}
    </AbsoluteFill>
  );
};
