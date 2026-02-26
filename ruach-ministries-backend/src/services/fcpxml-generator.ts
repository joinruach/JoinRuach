/**
 * FCP XML 1.10 Generator
 *
 * Converts CanonicalEDL to Final Cut Pro XML format.
 * Spec reference: Apple FCPXML 1.10 DTD
 *
 * @version 1.0.0
 * @date 2026-02-26
 */

import type {
  CanonicalEDL,
  Cut,
  CameraSource,
  Chapter,
} from '../types/canonical-edl';

/** Frames per second — defaults to 30 (NTSC) if not specified */
const DEFAULT_FPS = 30;

/**
 * Generate FCP XML 1.10 from a CanonicalEDL
 *
 * The output is a complete, importable fcpxml document with:
 * - Asset definitions for each camera source
 * - A single project with sequence/spine containing all cuts
 * - Chapter markers if present
 */
export function generateFCPXML(edl: CanonicalEDL, sessionTitle?: string): string {
  const fps = edl.fps || DEFAULT_FPS;
  const title = sessionTitle || `Session ${edl.sessionId}`;
  const durationRational = msToRational(edl.durationMs, fps);

  const assets = buildAssets(edl.sources, edl.sessionId);
  const clips = buildClips(edl.tracks.program, edl.sources, fps, edl.sessionId);
  const chapterMarkers = buildChapterMarkers(edl.tracks.chapters, fps);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE fcpxml>',
    '<fcpxml version="1.10">',
    '  <resources>',
    `    <format id="r1" name="FFVideoFormat${fps === 24 ? '1080p24' : fps === 25 ? '1080p25' : '1080p30'}" frameDuration="${fpsToFrameDuration(fps)}" width="1920" height="1080"/>`,
    ...assets,
    '  </resources>',
    '  <library>',
    `    <event name="${escapeXml(title)}">`,
    `      <project name="${escapeXml(title)}">`,
    `        <sequence format="r1" duration="${durationRational}" tcStart="0/1s">`,
    '          <spine>',
    ...clips,
    '          </spine>',
    '        </sequence>',
    ...chapterMarkers,
    `      </project>`,
    '    </event>',
    '  </library>',
    '</fcpxml>',
  ].join('\n');
}

/**
 * Build <asset> elements for each camera source.
 * Camera keys are sorted alphabetically for deterministic output —
 * exporting the same EDL twice produces byte-identical XML.
 */
function buildAssets(
  sources: Record<string, CameraSource>,
  sessionId: string
): string[] {
  const lines: string[] = [];
  const sortedCameras = Object.keys(sources).sort();

  for (const camera of sortedCameras) {
    const source = sources[camera];
    const assetId = stableAssetId(sessionId, camera);
    const src = source.mezzanineUrl || source.proxyUrl || '';
    const name = `Camera ${camera}`;

    lines.push(
      `    <asset id="${assetId}" name="${escapeXml(name)}" src="${escapeXml(src)}" start="0/1s" hasVideo="1" hasAudio="1" format="r1">`
    );
    lines.push(`    </asset>`);
  }

  return lines;
}

/**
 * Build <clip> elements from program cuts
 *
 * Each cut becomes a clip on the spine referencing the camera's asset.
 * The clip's offset accounts for the camera's sync offset from Phase 9.
 */
function buildClips(
  cuts: Cut[],
  sources: Record<string, CameraSource>,
  fps: number,
  sessionId: string
): string[] {
  const lines: string[] = [];

  for (const cut of cuts) {
    const source = sources[cut.camera];
    const syncOffsetMs = source?.offsetMs || 0;
    const assetRef = stableAssetId(sessionId, cut.camera);
    const clipDurationMs = cut.endMs - cut.startMs;

    // offset = where in the source media this clip starts
    // For non-master cameras, add the sync offset so audio aligns
    const sourceStartMs = cut.startMs + syncOffsetMs;

    const startRational = msToRational(cut.startMs, fps);
    const durationRational = msToRational(clipDurationMs, fps);
    const offsetRational = msToRational(sourceStartMs, fps);

    const name = `${cut.camera} — ${cut.reason || 'cut'}`;

    lines.push(
      `            <clip name="${escapeXml(name)}" start="${startRational}" duration="${durationRational}" offset="${offsetRational}" tcFormat="NDF">`
    );
    lines.push(
      `              <video ref="${assetRef}" offset="${offsetRational}" duration="${durationRational}"/>`
    );
    lines.push(`            </clip>`);
  }

  return lines;
}

/**
 * Build <chapter-marker> elements from chapter tracks
 */
function buildChapterMarkers(
  chapters: Chapter[] | undefined,
  fps: number
): string[] {
  if (!chapters || chapters.length === 0) return [];

  const lines: string[] = [];
  lines.push('        <metadata>');

  for (const chapter of chapters) {
    const startRational = msToRational(chapter.startMs, fps);
    lines.push(
      `          <md key="com.apple.proapps.studio.chapterMarker" value="${escapeXml(chapter.title)}" start="${startRational}"/>`
    );
  }

  lines.push('        </metadata>');
  return lines;
}

/**
 * Convert milliseconds to FCP rational time (e.g., "3003/30000s" for ~100ms at 30fps)
 *
 * FCP XML uses rational numbers for frame-accurate timing.
 * NTSC cameras run at 30000/1001 fps (~29.97), not exactly 30.
 * A single frame = 1001/30000s. We snap ms to the nearest frame boundary
 * using 1001-based numerators to prevent drift on long sessions.
 *
 * For 25fps (PAL): true integer, no 1001 correction needed.
 */
function msToRational(ms: number, fps: number): string {
  if (fps === 25) {
    // PAL: integer frame count, 1/25s per frame
    const frames = Math.round((ms / 1000) * 25);
    return `${frames}/25s`;
  }

  // NTSC (30fps → 29.97, 24fps → 23.976): snap to frame boundaries
  // Real fps = fps * 1000 / 1001. Frame count = ms/1000 * realFps
  // Rational = frameCount * 1001 / (fps * 1000)
  const realFps = (fps * 1000) / 1001;
  const frameCount = Math.round((ms / 1000) * realFps);
  const numerator = frameCount * 1001;
  const denominator = fps * 1000;
  return `${numerator}/${denominator}s`;
}

/**
 * Convert fps to FCP frame duration string
 */
function fpsToFrameDuration(fps: number): string {
  if (fps === 25) return '1/25s';
  if (fps === 24) return '1001/24000s';
  return '1001/30000s'; // 30fps default
}

/**
 * Deterministic asset ID from session + camera key.
 * Ensures re-exporting the same EDL doesn't create duplicate assets in FCP.
 */
function stableAssetId(sessionId: string, camera: string): string {
  return `asset-${sessionId}-${camera}`;
}

/**
 * Escape special XML characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
