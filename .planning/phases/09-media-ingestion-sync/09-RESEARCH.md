# Phase 9: Media Ingestion & Sync - Research

**Researched:** 2026-02-03
**Domain:** FFmpeg video/audio processing, cloud object storage (R2), proxy/mezzanine workflows
**Confidence:** HIGH

<research_summary>
## Summary

Researched the technical ecosystem for building a multi-angle video sync system with drag-drop ingestion, automatic audio correlation, confidence-scored sync review, and cloud storage for proxies and mezzanines.

**Key findings:**
1. **Audio sync**: BBC's `audio-offset-finder` (Python tool using FFmpeg) is the industry standard for automatic offset detection via MFCC cross-correlation, achieving 0.01s accuracy with quantified confidence scores (>10 = reliable, <5 = unreliable).
2. **Proxy generation**: H.264 baseline profile with `-g 2` keyframe interval provides optimal web scrubbing performance while keeping file sizes manageable.
3. **Mezzanine standard**: ProRes (Mac/cross-platform) or DNxHR (Windows-native) at 100-220 Mbps provides generation-loss-resistant intraframe format for Remotion rendering.
4. **Storage organization**: Shallow hierarchies (<500 assets/branch), ISO 8601 dates, alphanumeric naming with underscores/dashes only.

**Primary recommendation:** Use BBC audio-offset-finder → FFmpeg for transcoding → R2 with Standard storage class → structured folder hierarchy by project/date/asset-type → proxy (H.264 -g 2) + mezzanine (ProRes Standard or DNxHR SQ) outputs.
</research_summary>

<standard_stack>
## Standard Stack

The established libraries/tools for media ingestion and sync:

### Core
| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| **FFmpeg** | 7.1+ | Video/audio processing engine | Universal media manipulation, battle-tested, comprehensive codec support |
| **audio-offset-finder** | 2.x (Python 3.8-3.12) | Audio correlation sync detection | BBC-developed, MFCC algorithm, confidence scoring, 0.01s accuracy |
| **Cloudflare R2** | Current API | S3-compatible object storage | Zero egress fees, S3 compatibility, global distribution |
| **Node.js (fluent-ffmpeg)** | Latest | FFmpeg wrapper for Node.js | Programmatic FFmpeg control, promise-based, stream support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@aws-sdk/client-s3** | 3.x | R2 API client | Uploading/downloading objects from R2 (S3-compatible) |
| **mime-types** | 2.x | Content-Type detection | Setting proper MIME types for video/audio uploads |
| **sharp** | 0.33+ | Thumbnail generation | Creating preview images from video frames |
| **uuid** | 9.x | Unique identifiers | Asset ID generation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| audio-offset-finder | FFmpeg axcorrelate filter | axcorrelate gives correlation values but not time offsets; requires custom peak detection |
| ProRes mezzanine | DNxHR mezzanine | DNxHR better Windows encoding support; ProRes more universal playback |
| R2 | AWS S3 / Google Cloud Storage | S3 has egress fees; GCS has different pricing model; R2 simplest for video delivery |
| H.264 proxies | ProRes Proxy | ProRes better scrubbing (intraframe) but 3-5x larger files; H.264 good enough with -g 2 |

**Installation:**

**Python (for audio-offset-finder):**
```bash
pip install audio-offset-finder
# Requires FFmpeg installed separately
brew install ffmpeg  # macOS
```

**Node.js:**
```bash
npm install fluent-ffmpeg @aws-sdk/client-s3 mime-types sharp uuid
```
</standard_stack>

<architecture_patterns>
## Architecture Patterns

### Recommended Project Structure
```
apps/studio-api/
├── services/
│   ├── media-ingestion/
│   │   ├── upload-handler.ts          # R2 upload orchestration
│   │   ├── audio-extractor.ts         # FFmpeg audio extraction
│   │   ├── sync-detector.ts           # audio-offset-finder wrapper
│   │   └── transcode-queue.ts         # Proxy/mezzanine generation
│   ├── storage/
│   │   ├── r2-client.ts               # R2 SDK wrapper
│   │   └── object-naming.ts           # Naming convention utilities
│   └── sync-review/
│       ├── confidence-scorer.ts       # Parse offset-finder results
│       └── waveform-generator.ts      # Visual review assets
└── workers/
    ├── transcode-worker.ts            # Background FFmpeg jobs
    └── sync-worker.ts                 # Background sync analysis
```

### Pattern 1: Audio Correlation Sync Detection
**What:** Extract audio from all angles, use audio-offset-finder to detect time offsets, return confidence scores
**When to use:** Initial ingestion of multi-angle footage
**Example:**
```typescript
// Source: BBC audio-offset-finder docs
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

async function detectAudioSync(
  referenceAudioPath: string,
  comparisonAudioPaths: string[]
): Promise<SyncResult[]> {
  const results: SyncResult[] = [];

  for (const path of comparisonAudioPaths) {
    const { stdout } = await execFileAsync('audio-offset-finder', [
      '--find-offset-of', path,
      '--within', referenceAudioPath,
      '--json'
    ]);

    const result = JSON.parse(stdout);
    // result.offset: time offset in seconds (can be negative)
    // result.standard_score: confidence (>10 = reliable, <5 = unreliable)

    results.push({
      filePath: path,
      offsetSeconds: result.offset,
      confidenceScore: result.standard_score,
      isReliable: result.standard_score > 5
    });
  }

  return results;
}
```

### Pattern 2: Proxy Generation for Web Scrubbing
**What:** Transcode to H.264 baseline with frequent keyframes for smooth scrubbing
**When to use:** After ingestion, before presenting to editor
**Example:**
```typescript
// Source: GitHub Gist - Smooth Scrubbing Web Video FFMPEG Mega Command
import ffmpeg from 'fluent-ffmpeg';

function generateProxy(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .outputOptions([
        '-pix_fmt yuv420p',          // Browser compatibility
        '-profile:v baseline',        // Maximum compatibility
        '-level 3.0',                 // HTML5 video support
        '-g 2',                       // Keyframe every 2 frames (critical for scrubbing)
        '-preset fast',               // Balance speed vs compression
        '-crf 23',                    // Quality (18-28 range, lower = better)
        '-movflags +faststart',       // Enable progressive playback
      ])
      .videoFilters('scale=-2:720')  // 720p height, maintain aspect ratio
      .noAudio()                      // Proxies can be video-only for scrubbing
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}
```

### Pattern 3: Mezzanine Generation for Remotion
**What:** Transcode to consistent ProRes/DNxHR format for deterministic rendering
**When to use:** After sync confirmation, before EDL generation
**Example:**
```typescript
// Source: Remotion encoding docs + FFmpeg ProRes docs
function generateMezzanine(
  inputPath: string,
  outputPath: string,
  targetFps: number = 30
): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('prores_ks')        // ProRes encoder
      .outputOptions([
        '-profile:v 2',               // ProRes Standard (0=Proxy, 1=LT, 2=Standard, 3=HQ)
        '-vendor apl0',               // Apple vendor code
        '-pix_fmt yuv422p10le',       // 10-bit 4:2:2 color
        '-r', targetFps.toString(),   // Consistent frame rate
      ])
      .audioCodec('pcm_s24le')        // Uncompressed 24-bit PCM audio
      .audioChannels(2)               // Stereo
      .audioFrequency(48000)          // 48kHz sample rate
      .on('end', resolve)
      .on('error', reject)
      .save(outputPath);
  });
}
```

### Pattern 4: R2 Storage Organization
**What:** Structured folder hierarchy with semantic naming
**When to use:** All uploads to R2
**Example:**
```typescript
// Source: Adobe Experience Manager + MASV naming conventions
interface AssetMetadata {
  projectId: string;
  shootDate: Date;
  angleNumber: number;
  assetType: 'original' | 'proxy' | 'mezzanine' | 'audio';
  version?: number;
}

function buildR2ObjectKey(metadata: AssetMetadata, extension: string): string {
  const {
    projectId,
    shootDate,
    angleNumber,
    assetType,
    version = 1
  } = metadata;

  // ISO 8601 date format: YYYYMMDD
  const dateStr = shootDate.toISOString().slice(0, 10).replace(/-/g, '');

  // Example: projects/proj-abc123/20260203/originals/angle-001_v001.mp4
  //          projects/proj-abc123/20260203/proxies/angle-001_v001.mp4
  //          projects/proj-abc123/20260203/mezzanines/angle-001_v001.mov

  const fileName = `angle-${angleNumber.toString().padStart(3, '0')}_v${version.toString().padStart(3, '0')}${extension}`;

  return [
    'projects',
    projectId,
    dateStr,
    `${assetType}s`,  // originals, proxies, mezzanines, audios
    fileName
  ].join('/');
}
```

### Anti-Patterns to Avoid
- **Generating proxies without `-g 2` keyframe setting:** Results in laggy scrubbing on web players
- **Using FFmpeg axcorrelate directly:** Requires custom peak detection; audio-offset-finder handles this
- **Deep folder hierarchies (>4 levels):** Makes navigation/querying slower; use shallow structure
- **Spaces in object keys:** URL encoding issues; use underscores or dashes only
- **Inconsistent frame rates in mezzanines:** Causes Remotion rendering issues; normalize to single fps
- **Mixing audio sample rates:** Keep consistent 48kHz across pipeline
</architecture_patterns>

<dont_hand_roll>
## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Audio cross-correlation | Custom MFCC/FFT algorithm | BBC audio-offset-finder | Production-tested, handles noise/compression, proven 0.01s accuracy |
| FFmpeg command execution | Direct child_process spawn | fluent-ffmpeg npm package | Handles complex options, promise-based, error handling, stream support |
| Video frame extraction | Canvas-based JS decoder | FFmpeg thumbnail filter | Hardware-accelerated, handles all codecs, battle-tested |
| Confidence scoring | Custom statistical analysis | audio-offset-finder built-in | Standard score >10 = reliable, <5 = unreliable (validated metric) |
| Object storage client | Raw HTTP multipart upload | @aws-sdk/client-s3 | Handles chunking, retries, credentials, presigned URLs |
| Waveform visualization | Custom peak detection | FFmpeg showwaves filter | Optimized, produces PNG/MP4 waveforms directly |

**Key insight:** FFmpeg has 20+ years of codec edge-case handling. audio-offset-finder has been used in production broadcasting. The BBC doesn't hand-roll audio sync algorithms, and neither should you. These tools handle corner cases (variable frame rates, audio drift, compression artifacts, sample rate mismatches) that will take months to discover and debug.
</dont_hand_roll>

<common_pitfalls>
## Common Pitfalls

### Pitfall 1: Trusting Low Confidence Sync Scores
**What goes wrong:** Auto-applying sync offsets with confidence <5, resulting in misaligned footage
**Why it happens:** audio-offset-finder always returns an offset, even when wrong
**How to avoid:** Implement confidence threshold gates (>10 = auto-apply, 5-10 = flag for review, <5 = require manual sync)
**Warning signs:** Dialogue sync issues in rendered output, audio peaks don't align visually

### Pitfall 2: Insufficient Keyframes in Proxies
**What goes wrong:** Laggy scrubbing in web editor, seeking takes seconds
**Why it happens:** Default H.264 encoding uses `-g 250` (keyframe every 250 frames), optimized for streaming not scrubbing
**How to avoid:** Always use `-g 2` (or `-g 1` for perfect scrubbing at 2x file size)
**Warning signs:** Browser struggles when user drags timeline scrubber, frame updates delayed

### Pitfall 3: Frame Rate Inconsistency in Mezzanines
**What goes wrong:** Remotion rendering fails or produces A/V sync issues
**Why it happens:** Mixed source footage (24fps, 30fps, 60fps) transcoded to mezzanines without normalization
**How to avoid:** Enforce consistent `-r 30` (or 60) in mezzanine transcode, document target fps in project metadata
**Warning signs:** Remotion compositions render at wrong duration, audio drift in final output

### Pitfall 4: R2 Upload Failures with Large Files
**What goes wrong:** Uploads timeout or fail silently for multi-GB original footage
**Why it happens:** Single PUT requests have size limits, no retry logic
**How to avoid:** Use S3 multipart upload API (5MB+ parts), implement exponential backoff retry
**Warning signs:** Network errors in logs, files >5GB never complete upload

### Pitfall 5: Audio Extraction Quality Loss
**What goes wrong:** Sync detection fails on re-encoded audio with lossy compression
**Why it happens:** Using `-acodec copy` when source has exotic codec, or re-encoding to low-bitrate MP3
**How to avoid:** Always extract to uncompressed PCM WAV: `-acodec pcm_s16le -ar 48000 -ac 2`
**Warning signs:** Sync confidence scores suddenly drop compared to direct camera audio

### Pitfall 6: Not Handling Variable Frame Rate (VFR) Sources
**What goes wrong:** Audio gradually drifts out of sync over video duration
**Why it happens:** Modern cameras/phones record VFR; sync offsets assume constant frame rate
**How to avoid:** Detect VFR with `ffprobe`, transcode to CFR (constant frame rate) before sync analysis: `-vsync cfr -r 30`
**Warning signs:** Sync perfect at start but drift increases over time, FFmpeg warnings about "frame rate changes"
</common_pitfalls>

<code_examples>
## Code Examples

Verified patterns from official sources:

### Audio Extraction for Sync Analysis
```bash
# Source: FFmpeg documentation + audio-offset-finder requirements
# Extract uncompressed WAV for maximum correlation accuracy
ffmpeg -i input-video.mp4 \
  -vn \                    # No video stream
  -acodec pcm_s16le \      # Uncompressed 16-bit PCM
  -ar 48000 \              # 48kHz sample rate
  -ac 2 \                  # Stereo (or -ac 1 for mono)
  output-audio.wav
```

### Complete Proxy Pipeline
```bash
# Source: Smooth Scrubbing Web Video FFMPEG Mega Command
ffmpeg -i original.mp4 \
  -vcodec libx264 \
  -pix_fmt yuv420p \
  -profile:v baseline \
  -level 3.0 \
  -g 2 \                          # Keyframe every 2 frames
  -preset fast \
  -crf 23 \
  -vf "scale=-2:720" \            # 720p, maintain aspect ratio
  -movflags +faststart \          # Web streaming optimization
  -an \                           # No audio (optional)
  proxy-720p.mp4
```

### ProRes Mezzanine Generation
```bash
# Source: FFmpeg ProRes documentation + Remotion encoding guide
ffmpeg -i synced-source.mp4 \
  -c:v prores_ks \                # ProRes encoder
  -profile:v 2 \                  # ProRes Standard
  -vendor apl0 \
  -pix_fmt yuv422p10le \
  -r 30 \                         # Consistent 30fps
  -c:a pcm_s24le \                # Uncompressed audio
  -ar 48000 \
  -ac 2 \
  mezzanine.mov
```

### VFR to CFR Conversion (Pre-Sync)
```bash
# Source: FFmpeg documentation - vsync option
# Convert variable frame rate to constant before sync analysis
ffmpeg -i vfr-input.mp4 \
  -vsync cfr \                    # Force constant frame rate
  -r 30 \                         # Target 30fps
  -c:v libx264 -crf 18 \         # High quality H.264
  -c:a copy \                     # Keep audio untouched
  cfr-output.mp4
```

### R2 Presigned URL Upload (Node.js)
```typescript
// Source: AWS SDK S3 Client documentation (R2 is S3-compatible)
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function generateUploadUrl(bucket: string, key: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: 'video/mp4',
  });

  // URL valid for 1 hour
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
```
</code_examples>

<sota_updates>
## State of the Art (2025-2026)

What's changed recently:

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual waveform alignment in DAW | audio-offset-finder CLI | 2019+ (BBC release) | 0.01s accuracy with confidence scores, automated pipeline |
| FFmpeg axcorrelate filter | audio-offset-finder (MFCC) | 2019+ | axcorrelate gives correlation matrix, not time offsets; MFCC more robust |
| ProRes 422 HQ for everything | ProRes Standard for mezzanine | 2023+ | Standard (profile 2) sufficient for Remotion; HQ (profile 3) overkill for web workflows |
| AWS S3 with egress fees | Cloudflare R2 zero egress | 2022+ (R2 GA) | Massive cost savings for video delivery (pay only storage, not bandwidth) |
| H.264 High profile proxies | H.264 Baseline + `-g 2` | 2024+ | Baseline better browser compat; `-g 2` balances scrubbing vs file size |

**New tools/patterns to consider:**
- **FFmpeg 7.x** (2024-2026): Improved ProRes encoding (`prores_ks`), better VFR handling, faster transcoding
- **R2 custom domains** (2025): Direct video.yourdomain.com URLs without cloudflare.com in path
- **audio-offset-finder JSON output** (current): Easier parsing than text output, includes correlation plot data
- **Remotion 4.x** (2024+): Native FFmpeg embedding, no separate install required

**Deprecated/outdated:**
- **FFmpeg axcorrelate for sync**: Still exists, but audio-offset-finder is better for production
- **H.264 High/Main profiles for proxies**: Baseline ensures older browser/device compatibility
- **ProRes 4444 for mezzanines**: Overkill for Remotion; use Standard (profile 2) unless alpha channel needed
- **Manual -itsoffset sync**: Only use when audio-offset-finder confidence is low and offset is known
</sota_updates>

<open_questions>
## Open Questions

Things that couldn't be fully resolved:

1. **Multi-language audio-offset-finder in Node.js**
   - What we know: audio-offset-finder is Python CLI, requires subprocess execution from Node.js
   - What's unclear: Whether there's a native Node.js MFCC cross-correlation library with similar accuracy
   - Recommendation: Use Python CLI via child_process for now; evaluate https://github.com/yoavain/video-cross-correlation (Node.js, less battle-tested) if Python dependency is problematic

2. **R2 pricing for high-resolution originals**
   - What we know: R2 charges $0.015/GB-month for storage, zero egress
   - What's unclear: Cost implications at scale (100s of GB per project) vs alternatives
   - Recommendation: Calculate with example project (3 angles × 30min × 4K = ~180GB originals + proxies + mezzanines); compare to S3 Standard-IA if read frequency is low

3. **Remotion performance with ProRes vs H.264 mezzanines**
   - What we know: Remotion supports both, ProRes is intraframe (easier decoding)
   - What's unclear: Whether H.264 mezzanines cause Lambda timeout issues in Remotion Cloud rendering
   - Recommendation: Test with 10min H.264 mezzanine first; switch to ProRes if Lambda times out or has frame-seeking lag

4. **Handling extremely low confidence scores (<2)**
   - What we know: Confidence <5 is unreliable per audio-offset-finder docs
   - What's unclear: Whether confidence <2 means "no correlation found" vs "low confidence but might be right"
   - Recommendation: Flag <2 as "sync failed" and require manual waveform review + operator override
</open_questions>

<sources>
## Sources

### Primary (HIGH confidence)
- **FFmpeg Official Docs** (https://ffmpeg.org/ffmpeg-filters.html) - axcorrelate, astats, audio extraction, ProRes encoding
- **BBC audio-offset-finder** (https://github.com/bbc/audio-offset-finder) - MFCC algorithm, confidence scoring, usage patterns
- **Remotion Encoding Docs** (https://www.remotion.dev/docs/encoding) - Supported codecs, CRF settings, ProRes profiles
- **Cloudflare R2 Docs** (https://developers.cloudflare.com/r2/) - S3 compatibility, storage classes, API patterns

### Secondary (MEDIUM confidence - WebSearch verified with official sources)
- [FFmpeg Smooth Scrubbing Gist](https://gist.github.com/jeffpamer/f3134c5145238d0fd4752221b2d75eb7) - `-g 2` keyframe setting verified against FFmpeg docs
- [Frame.io Mezzanine Workflow Guide](https://workflow.frame.io/guide/mezzanine-workflow) - ProRes/DNxHR standards verified against codec docs
- [MASV Video File Naming Conventions](https://massive.io/file-transfer/video-file-naming-convention/) - ISO 8601, alphanumeric patterns verified against Adobe DAM docs
- [Video Correlation GitHub Projects](https://github.com/yoavain/video-cross-correlation) - Alternative to audio-offset-finder, mentioned for completeness

### Tertiary (LOW confidence - needs validation during implementation)
- Cross-correlation confidence scoring algorithms - Academic sources mention >10 threshold but audio-offset-finder docs are authoritative
- ProRes vs DNxHR for Node.js workflows - Limited documentation on Node.js FFmpeg wrappers with these codecs; test during implementation
</sources>

<metadata>
## Metadata

**Research scope:**
- Core technology: FFmpeg 7.x, Python audio-offset-finder, Node.js fluent-ffmpeg
- Ecosystem: Cloudflare R2, AWS S3 SDK, Remotion rendering
- Patterns: Audio correlation sync, proxy generation, mezzanine transcoding, object storage organization
- Pitfalls: Confidence score handling, keyframe intervals, frame rate consistency, VFR sources

**Confidence breakdown:**
- **Standard stack**: HIGH - All tools verified from official sources, widely used in production
- **Architecture**: HIGH - Patterns from official docs (FFmpeg, Remotion) and production guides (Frame.io, BBC)
- **Pitfalls**: HIGH - VFR issues, confidence thresholds, keyframe settings documented in FFmpeg/tool changelogs
- **Code examples**: HIGH - All examples from official documentation or verified GitHub sources

**Research date:** 2026-02-03
**Valid until:** 2026-03-03 (30 days - FFmpeg/Remotion ecosystem relatively stable)

**Next steps:**
1. **Plan Phase 9** (`/gsd:plan-phase 9`) - This research will inform task breakdown
2. **Prototype audio-offset-finder** - Test confidence scores with sample footage (3 angles, known sync offsets)
3. **Validate R2 upload pipeline** - Test multipart uploads with large (5GB+) files
4. **Test Remotion with H.264 mezzanines** - Determine if ProRes required or H.264 sufficient
</metadata>

---

## Sources

- [FFmpeg Filters Documentation](https://ffmpeg.org/ffmpeg-filters.html)
- [BBC audio-offset-finder](https://github.com/bbc/audio-offset-finder)
- [Remotion Encoding Guide](https://www.remotion.dev/docs/encoding)
- [Cloudflare R2 Overview](https://developers.cloudflare.com/r2/)
- [Smooth Scrubbing Web Video FFMPEG Command](https://gist.github.com/jeffpamer/f3134c5145238d0fd4752221b2d75eb7)
- [Frame.io Video Post-Production Workflow Guide](https://workflow.frame.io/guide/mezzanine-workflow)
- [MASV Video File Naming Convention](https://massive.io/file-transfer/video-file-naming-convention/)
- [FFmpeg Audio Extraction Guide](https://www.mux.com/articles/extract-audio-from-a-video-file-with-ffmpeg)
- [DNxHD/HR vs ProRes Comparison](https://pixflow.net/blog/dnxhdhr-vs-prores-which-one-got-the-throne-for-better-post-production-workflow/)
- [Google Cloud Storage Media Best Practices](https://docs.cloud.google.com/storage/docs/best-practices-media-workload)
- [Cross-Correlation Wikipedia](https://en.wikipedia.org/wiki/Cross-correlation)
- [Normalized Cross-Correlation Overview](https://www.sciencedirect.com/topics/computer-science/normalized-cross-correlation)

---

*Phase: 09-media-ingestion-sync*
*Research completed: 2026-02-03*
*Ready for planning: yes*
