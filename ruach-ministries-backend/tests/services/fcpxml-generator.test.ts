/**
 * Unit tests for FCP XML 1.10 Generator
 *
 * Validates that generateFCPXML produces correct, deterministic
 * Final Cut Pro XML from CanonicalEDL input.
 */

import { generateFCPXML } from '../../src/services/fcpxml-generator';
import type { CanonicalEDL } from '../../src/types/canonical-edl';

/**
 * Shared fixture: 2 cameras (A, B), 3 cuts, 1 chapter marker.
 * Camera B has a 500ms sync offset to exercise offset math.
 */
const fixtureEDL: CanonicalEDL = {
  schemaVersion: '1.0',
  sessionId: 'sess-001',
  masterCamera: 'A',
  durationMs: 9000,
  fps: 30,
  sources: {
    A: {
      assetId: 'media-a',
      mezzanineUrl: 'https://cdn.example.com/cam-a.mov',
      proxyUrl: 'https://cdn.example.com/cam-a-proxy.mp4',
      offsetMs: 0,
    },
    B: {
      assetId: 'media-b',
      mezzanineUrl: 'https://cdn.example.com/cam-b.mov',
      offsetMs: 500,
    },
  },
  tracks: {
    program: [
      {
        id: 'cut-1',
        startMs: 0,
        endMs: 3000,
        camera: 'A',
        reason: 'speaker',
      },
      {
        id: 'cut-2',
        startMs: 3000,
        endMs: 6000,
        camera: 'B',
        reason: 'reaction',
      },
      {
        id: 'cut-3',
        startMs: 6000,
        endMs: 9000,
        camera: 'A',
        reason: 'wide',
      },
    ],
    chapters: [
      { startMs: 0, title: 'Opening' },
    ],
  },
};

describe('generateFCPXML', () => {
  let xml: string;

  beforeAll(() => {
    xml = generateFCPXML(fixtureEDL, 'Test Session');
  });

  // --- XML Header & Structure ---

  it('generates valid XML header with version declaration', () => {
    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  });

  it('includes DOCTYPE fcpxml declaration', () => {
    expect(xml).toContain('<!DOCTYPE fcpxml>');
  });

  it('uses fcpxml version 1.10', () => {
    expect(xml).toContain('<fcpxml version="1.10">');
  });

  // --- Asset Elements ---

  it('contains asset elements for each camera source', () => {
    expect(xml).toContain('asset-sess-001-A');
    expect(xml).toContain('asset-sess-001-B');
  });

  it('sorts assets alphabetically by camera key', () => {
    const assetAIndex = xml.indexOf('asset-sess-001-A');
    const assetBIndex = xml.indexOf('asset-sess-001-B');
    expect(assetAIndex).toBeLessThan(assetBIndex);
  });

  it('uses mezzanineUrl as asset src when available', () => {
    expect(xml).toContain('src="https://cdn.example.com/cam-a.mov"');
    expect(xml).toContain('src="https://cdn.example.com/cam-b.mov"');
  });

  // --- Clip Elements ---

  it('contains clip elements for each cut in program track', () => {
    // 3 cuts = 3 clip open tags
    const clipMatches = xml.match(/<clip name="/g);
    expect(clipMatches).toHaveLength(3);
  });

  it('clips reference correct asset IDs', () => {
    // Cut 1 & 3 reference camera A, cut 2 references camera B
    const videoRefs = [...xml.matchAll(/<video ref="([^"]+)"/g)].map(
      (m) => m[1]
    );
    expect(videoRefs).toEqual([
      'asset-sess-001-A',
      'asset-sess-001-B',
      'asset-sess-001-A',
    ]);
  });

  it('stable asset IDs follow pattern asset-{sessionId}-{camera}', () => {
    expect(xml).toContain('id="asset-sess-001-A"');
    expect(xml).toContain('id="asset-sess-001-B"');
  });

  // --- Sync Offset ---

  it('applies sync offset to clip offsets for non-master cameras', () => {
    // Cut 2: camera B, startMs=3000, offsetMs=500 → sourceStartMs=3500
    // At 30fps NTSC: frames = round(3500/1000 * 30000/1001) = round(104.8951...) = 105
    // Rational = 105 * 1001 / 30000 = 105105/30000
    expect(xml).toContain('offset="105105/30000s"');
  });

  it('master camera clips have zero sync offset applied', () => {
    // Cut 1: camera A, startMs=0, offsetMs=0 → sourceStartMs=0
    // First clip should have offset="0/30000s"
    const firstClipMatch = xml.match(
      /<clip name="A[^"]*"[^>]*offset="(\d+\/\d+s)"/
    );
    expect(firstClipMatch).not.toBeNull();
    expect(firstClipMatch![1]).toBe('0/30000s');
  });

  // --- Chapter Markers ---

  it('includes chapter markers when present', () => {
    expect(xml).toContain('<metadata>');
    expect(xml).toContain('com.apple.proapps.studio.chapterMarker');
    expect(xml).toContain('value="Opening"');
  });

  it('empty chapters produce no metadata section', () => {
    const edlNoChapters: CanonicalEDL = {
      ...fixtureEDL,
      tracks: {
        ...fixtureEDL.tracks,
        chapters: [],
      },
    };
    const xmlNoChapters = generateFCPXML(edlNoChapters);
    expect(xmlNoChapters).not.toContain('<metadata>');
  });

  it('undefined chapters produce no metadata section', () => {
    const edlUndefined: CanonicalEDL = {
      ...fixtureEDL,
      tracks: {
        program: fixtureEDL.tracks.program,
        // chapters omitted entirely
      },
    };
    const xmlUndefined = generateFCPXML(edlUndefined);
    expect(xmlUndefined).not.toContain('<metadata>');
  });

  // --- Determinism ---

  it('produces identical XML on repeated calls with the same input', () => {
    const first = generateFCPXML(fixtureEDL, 'Test Session');
    const second = generateFCPXML(fixtureEDL, 'Test Session');
    expect(first).toBe(second);
  });

  // --- Frame Rate Handling ---

  it('handles 25fps PAL timing with integer fractions', () => {
    const palEdl: CanonicalEDL = {
      ...fixtureEDL,
      fps: 25,
    };
    const palXml = generateFCPXML(palEdl);

    // 3000ms at 25fps = 75 frames → "75/25s"
    expect(palXml).toContain('75/25s');
    // Frame duration for PAL
    expect(palXml).toContain('frameDuration="1/25s"');
    // Format name
    expect(palXml).toContain('FFVideoFormat1080p25');
  });

  it('handles 30fps NTSC timing with 1001-based rational numbers', () => {
    // 3000ms at 29.97fps: frames = round(3000/1000 * 30000/1001) = round(89.9100...) = 90
    // Rational = 90 * 1001 / 30000 = 90090/30000
    expect(xml).toContain('90090/30000s');
    expect(xml).toContain('frameDuration="1001/30000s"');
    expect(xml).toContain('FFVideoFormat1080p30');
  });

  it('handles 24fps timing with 1001-based rational numbers', () => {
    const edl24: CanonicalEDL = {
      ...fixtureEDL,
      fps: 24,
    };
    const xml24 = generateFCPXML(edl24);

    // Frame duration for 24fps
    expect(xml24).toContain('frameDuration="1001/24000s"');
    expect(xml24).toContain('FFVideoFormat1080p24');

    // 3000ms at 23.976fps: frames = round(3000/1000 * 24000/1001) = round(71.928...) = 72
    // Rational = 72 * 1001 / 24000 = 72072/24000
    expect(xml24).toContain('72072/24000s');
  });

  // --- XML Escaping ---

  it('XML escapes special characters in titles', () => {
    const xmlEscaped = generateFCPXML(fixtureEDL, 'Rock & Roll <Session> "1"');
    expect(xmlEscaped).toContain('Rock &amp; Roll &lt;Session&gt; &quot;1&quot;');
  });

  it('XML escapes special characters in chapter titles', () => {
    const edlSpecialChapter: CanonicalEDL = {
      ...fixtureEDL,
      tracks: {
        ...fixtureEDL.tracks,
        chapters: [{ startMs: 0, title: 'Q&A — "Who is God?"' }],
      },
    };
    const xmlChapter = generateFCPXML(edlSpecialChapter);
    expect(xmlChapter).toContain('Q&amp;A');
    expect(xmlChapter).toContain('&quot;Who is God?&quot;');
  });

  // --- Default FPS ---

  it('defaults to 30fps when fps is not specified', () => {
    const edlNoFps: CanonicalEDL = {
      ...fixtureEDL,
      fps: undefined,
    };
    const xmlNoFps = generateFCPXML(edlNoFps);
    expect(xmlNoFps).toContain('frameDuration="1001/30000s"');
  });

  // --- Default Title ---

  it('uses session ID in default title when sessionTitle is omitted', () => {
    const xmlDefault = generateFCPXML(fixtureEDL);
    expect(xmlDefault).toContain('name="Session sess-001"');
  });
});
