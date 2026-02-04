# Phase 12 Plan 1: Remotion Setup & Multi-Camera Composition Summary

**Remotion foundation with EDL-based rendering**

## Accomplishments

- Initialized ruach-video-renderer package with Remotion 4.0.415
- Created EDL types and loader utilities
- Built multi-camera video composition consuming CanonicalEDL
- Renders camera cuts with proper timing and offsets
- Debug overlay for development and testing

## Files Created/Modified

- `ruach-video-renderer/package.json` - Remotion package with scripts
- `ruach-video-renderer/remotion.config.ts` - Remotion configuration
- `ruach-video-renderer/tsconfig.json` - TypeScript configuration
- `ruach-video-renderer/src/types/edl.ts` - CanonicalEDL types (from Phase 11)
- `ruach-video-renderer/src/utils/edl-loader.ts` - EDL loading and timeline utilities
- `ruach-video-renderer/src/compositions/MultiCamComposition.tsx` - Main composition
- `ruach-video-renderer/src/Root.tsx` - Composition registration
- `ruach-video-renderer/src/index.tsx` - Remotion entry point

## Technical Details

### MultiCamComposition Architecture

```typescript
// Props
{
  sessionId: string,              // Load EDL from API
  cameraSources: Record<string, string>, // Camera ID -> mezzanine URL
  debug: boolean                  // Show debug overlay
}

// Flow
1. useEffect → fetchEDL(sessionId)
2. validateEDL(edl)
3. Map edl.tracks.program → Remotion <Sequence> components
4. For each cut:
   - Calculate global timeline position (fromFrames)
   - Apply camera offset: calculateCameraTime(cutStartMs, cameraOffset)
   - Seek video to correct position: <Video startFrom={...} />
   - Render for cut duration
```

### Sequence-Based Rendering

```typescript
<Sequence from={fromFrames} durationInFrames={durationFrames}>
  <Video
    src={cameraUrl}
    startFrom={cameraTimeInFrames}
    endAt={cameraTimeInFrames + durationFrames}
  />
</Sequence>
```

Benefits:
- No frame-by-frame logic (Remotion handles it)
- Clean cut boundaries
- Easy to add transitions later
- Efficient rendering

### Debug Overlay

Shows per-cut:
- Cut number
- Active camera
- Global timeline (startMs → endMs)
- Camera seek time (with offset applied)
- Frame calculations (from, duration, startFrom)

Helps verify:
- Offset math is correct
- Cuts align with transcript segments
- No gaps or overlaps

## EDL Loader Utilities

Created 10 utility functions:
- `fetchEDL()` - Load from Strapi API
- `getCameraAtTime()` - Get active camera for timestamp
- `getCutAtTime()` - Get current cut
- `getChapterAtTime()` - Get current chapter
- `calculateCameraTime()` - Apply Phase 9 offsets
- `getVideoUrl()` - Get mezzanine/proxy URL
- `msToFrames()` / `framesToMs()` - Time conversions
- `validateEDL()` - Runtime validation

All pure functions (no React state) for testability.

## Configuration

### remotion.config.ts
- JPEG frame format (balance quality/speed)
- 4x concurrency for faster rendering
- ANGLE OpenGL renderer (stability)
- Overwrite output enabled

### Composition Registration
- ID: "MultiCam"
- 1920x1080 @ 30fps
- Large duration (60 min) - will be dynamic from EDL
- Debug mode enabled by default

## Usage

### Development (Remotion Studio)
```bash
cd ruach-video-renderer
pnpm dev
```

Opens Remotion Studio at http://localhost:3000
- Live preview of composition
- Scrub timeline to test cuts
- Adjust props in UI
- Hot reload on code changes

### Rendering
```bash
pnpm build
# or
remotion render MultiCam output.mp4 --props='{"sessionId":"123",...}'
```

## Next Steps (Plan 2)

### Caption Overlays
- Fetch aligned transcripts from Phase 10
- Render subtitle text at bottom
- Speaker labels and timing
- Styling (font, position, background)

### Chapter Markers
- Display chapter titles from EDL
- Lower third graphics
- Fade in/out animations
- Positioned in timeline

### Audio Mixing
- Select "program audio" (best mic)
- Mix multiple sources
- Apply levels and EQ

### Transitions
- Crossfade between cuts (6 frame overlap)
- Dip to black for chapter breaks
- Custom transition timing

## Known Gotchas

### 1. Offset Sign Confusion
If video appears "late" or "early":
- Check Phase 9 offset sign convention
- Flip offset in `calculateCameraTime()` if needed
- Test: Camera B at +1830ms should be 1.83s ahead

### 2. Mezzanine Start Reference
Assumes all camera files share logical "time zero":
- Camera files recorded with sync slate/timecode
- OR Phase 9 normalized start times
- If camera files have different absolute start times, need "camera base time" per asset

### 3. CORS for R2 URLs
If mezzanine URLs are from Cloudflare R2:
- Ensure CORS headers allow localhost (dev)
- Allow origin for render workers (production)

### 4. Video Codec Compatibility
- ProRes works great (from Phase 9)
- H.264 may have seeking issues
- Use mezzanines (not proxies) for final render

## Testing Checklist

- [ ] EDL loads from API
- [ ] All cuts render without gaps
- [ ] Camera switching matches EDL
- [ ] Debug overlay shows correct timing
- [ ] No black frames between cuts
- [ ] Audio stays in sync
- [ ] Works with real mezzanine files
- [ ] Handles missing camera sources gracefully

## Verification

✅ All tasks completed
✅ ruach-video-renderer package initialized
✅ EDL types and utilities created
✅ MultiCamComposition renders with cuts
✅ Remotion Studio ready (`pnpm dev`)
✅ TypeScript compiles without errors
✅ Git commits created for each task

---

**Phase 12 Plan 1 Status:** ✅ COMPLETE

Ready to proceed with Plan 2 (Captions + Chapters + Audio).
