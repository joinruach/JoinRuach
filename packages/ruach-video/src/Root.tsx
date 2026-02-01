import { Composition, Still } from "remotion";

// Video Templates
import { ScriptureOverlay } from "./templates/ScriptureOverlay";
import { TestimonyClip } from "./templates/TestimonyClip";
import { TeachingVideo } from "./templates/TeachingVideo";
import { PodcastEnhanced } from "./templates/PodcastEnhanced";
import { DeclarationVideo } from "./templates/DeclarationVideo";
import { DailyScripture } from "./templates/DailyScripture";
import { QuoteReel } from "./templates/QuoteReel";

// Schemas
import {
  scriptureOverlaySchema,
  testimonyClipSchema,
  teachingVideoSchema,
  podcastEnhancedSchema,
  declarationVideoSchema,
  dailyScriptureSchema,
  quoteReelSchema,
} from "./schemas";

// Video formats
const FORMATS = {
  vertical: { width: 1080, height: 1920 }, // 9:16 (Shorts, Reels, TikTok)
  square: { width: 1080, height: 1080 }, // 1:1 (Instagram, Facebook)
  horizontal: { width: 1920, height: 1080 }, // 16:9 (YouTube, Teaching)
  wide: { width: 2560, height: 1440 }, // 16:9 2K
};

export const Root: React.FC = () => {
  return (
    <>
      {/* ================================
          1. SHORT-FORM VERTICAL CLIPS
          ================================ */}

      {/* Scripture Quote with Animation */}
      <Composition
        id="ScriptureOverlay"
        component={ScriptureOverlay}
        schema={scriptureOverlaySchema}
        durationInFrames={450} // 15 seconds at 30fps
        fps={30}
        {...FORMATS.vertical}
        defaultProps={{
          reference: "John 3:16",
          text: "For God so loved the world that he gave his one and only Son...",
          translation: "NIV",
          theme: "dark",
          animationStyle: "typewriter",
          backgroundType: "gradient",
          backgroundUrl: "",
          musicUrl: "",
        }}
      />

      {/* Testimony Highlight Clip */}
      <Composition
        id="TestimonyClip"
        component={TestimonyClip}
        schema={testimonyClipSchema}
        durationInFrames={1800} // 60 seconds max
        fps={30}
        {...FORMATS.vertical}
        defaultProps={{
          videoUrl: "",
          speakerName: "",
          caption: "",
          startTime: 0,
          endTime: 60,
          showCaptions: true,
          captionStyle: "modern",
          accentColor: "#C4A052",
        }}
      />

      {/* Quote Reel */}
      <Composition
        id="QuoteReel"
        component={QuoteReel}
        schema={quoteReelSchema}
        durationInFrames={300} // 10 seconds
        fps={30}
        {...FORMATS.vertical}
        defaultProps={{
          quote: "",
          author: "",
          source: "",
          backgroundUrl: "",
          theme: "elegant",
          animationType: "fade",
        }}
      />

      {/* ================================
          2. TEACHING VIDEOS
          ================================ */}

      <Composition
        id="TeachingVideo"
        component={TeachingVideo}
        schema={teachingVideoSchema}
        durationInFrames={9000} // 5 minutes at 30fps
        fps={30}
        {...FORMATS.horizontal}
        defaultProps={{
          title: "",
          speaker: "",
          slides: [],
          audioUrl: "",
          showLowerThird: true,
          showScriptureCallouts: true,
          transitionStyle: "smooth",
          brandColor: "#C4A052",
        }}
      />

      {/* ================================
          3. PODCAST ENHANCEMENT
          ================================ */}

      <Composition
        id="PodcastEnhanced"
        component={PodcastEnhanced}
        schema={podcastEnhancedSchema}
        durationInFrames={108000} // 1 hour at 30fps
        fps={30}
        {...FORMATS.horizontal}
        defaultProps={{
          audioUrl: "",
          title: "",
          speakers: [],
          chapters: [],
          showWaveform: true,
          showChapterMarkers: true,
          backgroundStyle: "minimal",
        }}
      />

      {/* ================================
          4. DECLARATIVE / CINEMATIC
          ================================ */}

      <Composition
        id="DeclarationVideo"
        component={DeclarationVideo}
        schema={declarationVideoSchema}
        durationInFrames={2700} // 90 seconds
        fps={30}
        {...FORMATS.vertical}
        defaultProps={{
          declarations: [],
          audioUrl: "",
          style: "prophetic",
          paceMode: "rhythmic",
          typography: "bold",
        }}
      />

      {/* ================================
          5. AUTOMATED / SYSTEM-GENERATED
          ================================ */}

      <Composition
        id="DailyScripture"
        component={DailyScripture}
        schema={dailyScriptureSchema}
        durationInFrames={450} // 15 seconds
        fps={30}
        {...FORMATS.vertical}
        defaultProps={{
          date: new Date().toISOString(),
          reference: "",
          text: "",
          reflection: "",
          theme: "morning",
        }}
      />

      {/* ================================
          STILLS (Thumbnails, Social Cards)
          ================================ */}

      <Still
        id="ScriptureThumbnail"
        component={ScriptureOverlay}
        schema={scriptureOverlaySchema}
        {...FORMATS.horizontal}
        defaultProps={{
          reference: "John 3:16",
          text: "For God so loved the world...",
          translation: "NIV",
          theme: "dark",
          animationStyle: "fade",
          backgroundType: "gradient",
          backgroundUrl: "",
          musicUrl: "",
        }}
      />

      <Still
        id="QuoteThumbnail"
        component={QuoteReel}
        schema={quoteReelSchema}
        {...FORMATS.square}
        defaultProps={{
          quote: "",
          author: "",
          source: "",
          backgroundUrl: "",
          theme: "elegant",
          animationType: "static",
        }}
      />
    </>
  );
};
