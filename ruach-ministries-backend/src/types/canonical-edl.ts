/**
 * Phase 11: Canonical EDL v1.0
 *
 * TypeScript interfaces for Edit Decision Lists
 * Defines the single source of truth for multi-camera edit decisions
 */

/**
 * Canonical EDL - The complete edit decision list for a recording session
 *
 * This is the single source of truth for all edit decisions. All timestamps
 * are in the master timeline (using session.anchorAngle as time=0).
 * Camera-specific times are calculated using sources[camera].offsetMs.
 */
export interface CanonicalEDL {
  /** Schema version for forward compatibility */
  schemaVersion: "1.0";

  /** Recording session ID this EDL belongs to */
  sessionId: string;

  /** Master camera (time=0 reference) */
  masterCamera: "A" | "B" | "C";

  /** Total duration of the session in milliseconds */
  durationMs: number;

  /** Optional frames per second for frame-accurate timing */
  fps?: number;

  /** Edit tracks */
  tracks: {
    /** Main program cuts (required) */
    program: Cut[];

    /** Overlay graphics (optional) */
    overlays?: Overlay[];

    /** Chapter markers (optional) */
    chapters?: Chapter[];

    /** Short-form recipe suggestions (optional) */
    shorts?: ShortRecipe[];
  };

  /** Source camera information with offsets from Phase 9 */
  sources: Record<string, CameraSource>;

  /** Optional metrics about the edit */
  metrics?: EDLMetrics;
}

/**
 * Cut - A single camera shot in the program track
 *
 * Represents a continuous shot from one camera. Cuts are non-overlapping
 * and should cover the full session duration (minus trimmed sections).
 */
export interface Cut {
  /** Unique identifier for this cut */
  id: string;

  /** Start time in master timeline (milliseconds) */
  startMs: number;

  /** End time in master timeline (milliseconds) */
  endMs: number;

  /** Which camera is active for this cut */
  camera: "A" | "B" | "C";

  /** Why this camera was chosen (for debugging/review) */
  reason?: "speaker" | "reaction" | "wide" | "emphasis" | "operator";

  /** AI confidence score for this cut (0-1) */
  confidence?: number;
}

/**
 * CameraSource - Information about a camera's media and timing
 */
export interface CameraSource {
  /** Media asset ID from Phase 9 */
  assetId: string;

  /** URL to proxy video (for preview) */
  proxyUrl?: string;

  /** URL to mezzanine video (for rendering) */
  mezzanineUrl?: string;

  /** Time offset from master timeline in milliseconds (Phase 9 sync offset) */
  offsetMs: number;
}

/**
 * Overlay - Graphics overlaid on the video
 */
export interface Overlay {
  /** Unique identifier for this overlay */
  id: string;

  /** Start time in master timeline (milliseconds) */
  startMs: number;

  /** End time in master timeline (milliseconds) */
  endMs: number;

  /** Type of overlay */
  type: "lowerThird" | "title" | "scripture" | "cta";

  /** Overlay-specific data (text, styling, etc.) */
  payload: Record<string, any>;
}

/**
 * Chapter - Logical section marker
 */
export interface Chapter {
  /** Start time of chapter in master timeline (milliseconds) */
  startMs: number;

  /** Chapter title (e.g., "Opening Prayer", "Main Teaching") */
  title: string;
}

/**
 * ShortRecipe - Suggestion for a short-form clip
 */
export interface ShortRecipe {
  /** Start time in master timeline (milliseconds) */
  startMs: number;

  /** End time in master timeline (milliseconds) */
  endMs: number;

  /** Title for the short */
  title: string;

  /** Optional hook/description for the short */
  hook?: string;
}

/**
 * EDLMetrics - Statistics about the edit
 */
export interface EDLMetrics {
  /** Total number of cuts in the program track */
  cutCount: number;

  /** Average shot length in milliseconds */
  avgShotLenMs: number;

  /** Number of times the camera switched due to speaker change */
  speakerSwitchCount?: number;

  /** Overall confidence score for the EDL (0-1) */
  confidence?: number;
}

/**
 * EDL Generation Options - Configuration for EDL generator
 */
export interface EDLGenerationOptions {
  /** Style profile for editing */
  style?: "sermon" | "podcast" | "teaching" | "shorts";

  /** Generation mode: 'transcript' uses speaker labels, 'energy' uses audio energy */
  mode?: "transcript" | "energy";

  /** Generate chapter markers */
  includeChapters?: boolean;

  /** Generate short-form recipe suggestions */
  includeShorts?: boolean;

  /** Minimum shot length in milliseconds (default: 2000) */
  minShotLengthMs?: number;

  /** Maximum shot length in milliseconds (default: 15000) */
  maxShotLengthMs?: number;

  /** Switch cooldown period in milliseconds (default: 1500) */
  switchCooldownMs?: number;

  /** Remove filler words */
  removeFiller?: boolean;

  /** Trim silence at start/end */
  trimSilence?: boolean;

  /** dB lead required to trigger camera switch (energy mode only, default 6) */
  leadThresholdDb?: number;

  /** dB level below which audio is treated as silence (energy mode only, default -40) */
  silenceThresholdDb?: number;
}

/**
 * EDL Validation Result
 */
export interface EDLValidationResult {
  /** Whether the EDL is valid */
  valid: boolean;

  /** Validation errors if any */
  errors: string[];

  /** Validation warnings (non-fatal issues) */
  warnings: string[];
}
