import { z } from "zod";

/**
 * Scripture Overlay Schema
 * For animated Bible verses with backgrounds
 */
export const scriptureOverlaySchema = z.object({
  reference: z.string().describe("Scripture reference (e.g., 'John 3:16')"),
  text: z.string().describe("The scripture text"),
  translation: z
    .enum(["KJV", "NIV", "ESV", "NKJV", "NLT", "NASB"])
    .default("NIV"),
  theme: z.enum(["dark", "light", "gold", "nature", "cosmic"]).default("dark"),
  animationStyle: z
    .enum(["typewriter", "fade", "slide", "reveal", "kinetic"])
    .default("typewriter"),
  backgroundType: z
    .enum(["gradient", "image", "video", "particles"])
    .default("gradient"),
  backgroundUrl: z.string().optional(),
  musicUrl: z.string().optional(),
});

export type ScriptureOverlayProps = z.infer<typeof scriptureOverlaySchema>;

/**
 * Testimony Clip Schema
 * For 15-60s highlight clips from testimonies
 */
export const testimonyClipSchema = z.object({
  videoUrl: z.string().describe("Source video URL"),
  speakerName: z.string().describe("Speaker's name for lower third"),
  caption: z.string().optional().describe("Optional tagline or caption"),
  startTime: z.number().describe("Start time in seconds"),
  endTime: z.number().describe("End time in seconds"),
  showCaptions: z.boolean().default(true),
  captionStyle: z.enum(["modern", "classic", "minimal", "bold"]).default("modern"),
  accentColor: z.string().default("#C4A052"),
  captions: z
    .array(
      z.object({
        text: z.string(),
        startMs: z.number(),
        endMs: z.number(),
      })
    )
    .optional(),
});

export type TestimonyClipProps = z.infer<typeof testimonyClipSchema>;

/**
 * Quote Reel Schema
 * For quote + author animations
 */
export const quoteReelSchema = z.object({
  quote: z.string().describe("The quote text"),
  author: z.string().describe("Quote author"),
  source: z.string().optional().describe("Source book/sermon"),
  backgroundUrl: z.string().optional(),
  theme: z.enum(["elegant", "bold", "minimal", "dramatic"]).default("elegant"),
  animationType: z.enum(["fade", "typewriter", "slide", "static"]).default("fade"),
});

export type QuoteReelProps = z.infer<typeof quoteReelSchema>;

/**
 * Teaching Video Schema
 * For structured teaching with slides and callouts
 */
export const teachingVideoSchema = z.object({
  title: z.string().describe("Video title"),
  speaker: z.string().describe("Speaker name"),
  audioUrl: z.string().optional().describe("Audio track URL"),
  videoUrl: z.string().optional().describe("Background video URL"),
  showLowerThird: z.boolean().default(true),
  showScriptureCallouts: z.boolean().default(true),
  transitionStyle: z.enum(["smooth", "cut", "fade", "slide"]).default("smooth"),
  brandColor: z.string().default("#C4A052"),
  slides: z.array(
    z.object({
      type: z.enum(["title", "scripture", "point", "diagram", "quote", "reflection"]),
      content: z.string(),
      subContent: z.string().optional(),
      duration: z.number().describe("Duration in seconds"),
      scriptureRef: z.string().optional(),
      imageUrl: z.string().optional(),
    })
  ),
  scriptureCallouts: z
    .array(
      z.object({
        reference: z.string(),
        text: z.string(),
        startTime: z.number(),
        duration: z.number(),
      })
    )
    .optional(),
});

export type TeachingVideoProps = z.infer<typeof teachingVideoSchema>;

/**
 * Podcast Enhanced Schema
 * For upgrading long-form audio with visuals
 */
export const podcastEnhancedSchema = z.object({
  audioUrl: z.string().describe("Audio file URL"),
  title: z.string().describe("Episode title"),
  episodeNumber: z.number().optional(),
  showWaveform: z.boolean().default(true),
  showChapterMarkers: z.boolean().default(true),
  backgroundStyle: z
    .enum(["minimal", "gradient", "animated", "studio"])
    .default("minimal"),
  speakers: z.array(
    z.object({
      name: z.string(),
      role: z.string().optional(),
      imageUrl: z.string().optional(),
    })
  ),
  chapters: z
    .array(
      z.object({
        title: z.string(),
        startTime: z.number(),
        endTime: z.number(),
      })
    )
    .optional(),
  highlights: z
    .array(
      z.object({
        text: z.string(),
        startTime: z.number(),
        duration: z.number(),
      })
    )
    .optional(),
});

export type PodcastEnhancedProps = z.infer<typeof podcastEnhancedSchema>;

/**
 * Declaration Video Schema
 * For spoken declarations and prayer overlays
 */
export const declarationVideoSchema = z.object({
  audioUrl: z.string().optional().describe("Audio narration URL"),
  style: z.enum(["prophetic", "prayerful", "meditative", "bold"]).default("prophetic"),
  paceMode: z.enum(["rhythmic", "flowing", "staccato", "slow"]).default("rhythmic"),
  typography: z.enum(["bold", "elegant", "minimal", "dramatic"]).default("bold"),
  backgroundUrl: z.string().optional(),
  declarations: z.array(
    z.object({
      text: z.string(),
      emphasis: z.array(z.string()).optional().describe("Words to emphasize"),
      pauseAfter: z.number().optional().describe("Pause in seconds after this declaration"),
      style: z.enum(["normal", "emphasized", "whispered", "crescendo"]).optional(),
    })
  ),
});

export type DeclarationVideoProps = z.infer<typeof declarationVideoSchema>;

/**
 * Daily Scripture Schema
 * For automated daily scripture videos
 */
export const dailyScriptureSchema = z.object({
  date: z.string().describe("ISO date string"),
  reference: z.string().describe("Scripture reference"),
  text: z.string().describe("Scripture text"),
  reflection: z.string().optional().describe("Short reflection or application"),
  theme: z.enum(["morning", "evening", "sabbath", "worship"]).default("morning"),
  backgroundUrl: z.string().optional(),
  musicUrl: z.string().optional(),
});

export type DailyScriptureProps = z.infer<typeof dailyScriptureSchema>;

/**
 * Caption segment for synchronized text
 */
export const captionSegmentSchema = z.object({
  text: z.string(),
  startMs: z.number(),
  endMs: z.number(),
  speaker: z.string().optional(),
});

export type CaptionSegment = z.infer<typeof captionSegmentSchema>;

/**
 * Render request schema (for API)
 */
export const renderRequestSchema = z.object({
  compositionId: z.string(),
  inputProps: z.record(z.any()),
  outputFormat: z.enum(["mp4", "webm", "gif"]).default("mp4"),
  quality: z.enum(["draft", "standard", "high"]).default("standard"),
  codec: z.enum(["h264", "h265", "vp8", "vp9"]).default("h264"),
});

export type RenderRequest = z.infer<typeof renderRequestSchema>;
