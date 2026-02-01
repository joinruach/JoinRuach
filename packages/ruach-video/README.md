# Ruach Video - Programmatic Video Generation

Create MP4 videos with React using Remotion. Parametrize content, render server-side, and build automation pipelines.

## Overview

Ruach Video provides a complete system for generating videos programmatically:

- **7 Video Templates** covering all content types
- **AWS Lambda Rendering** for scalable, fast production
- **Local Rendering** for development and testing
- **BullMQ Queue** for batch processing
- **Studio UI** for manual video creation

## Video Templates

### 1. Short-Form Vertical Clips (9:16)

**ScriptureOverlay** - Animated Bible verses
- Typewriter, fade, slide, kinetic animations
- 5 theme options (dark, gold, cosmic, nature, morning)
- Background: gradient, image, video, or particles
- Optional background music

**TestimonyClip** - Highlight clips from testimonies
- Auto-synced captions (modern, classic, minimal, bold styles)
- Speaker lower third
- Trim to 15-60s segments

**QuoteReel** - Quote + author animations
- 4 themes: elegant, bold, minimal, dramatic
- Fade/typewriter animation options
- Source attribution

### 2. Teaching Videos (16:9)

**TeachingVideo** - Structured presentations
- Slide types: title, scripture, point, diagram, quote, reflection
- Lower thirds for speaker info
- Scripture callouts overlay
- Smooth transitions

### 3. Podcast Enhancement (16:9)

**PodcastEnhanced** - Upgrade long-form audio
- Animated waveform visualizer
- Speaker cards with photos
- Chapter markers
- Highlight overlays

### 4. Declarative/Cinematic (9:16)

**DeclarationVideo** - Spoken declarations
- Prophetic, prayerful, meditative, bold styles
- Rhythmic typography
- Emphasis word highlighting
- Particle backgrounds

### 5. Automated Videos (9:16)

**DailyScripture** - Auto-generated daily content
- Morning, evening, sabbath, worship themes
- Date display
- Optional reflection text

## Quick Start

### Installation

```bash
# In monorepo root
pnpm install

# Install Remotion dependencies
cd packages/ruach-video
pnpm install
```

### Local Development

```bash
# Start Remotion Studio (visual editor)
pnpm studio

# Preview compositions
pnpm render --props='{"reference":"John 3:16","text":"..."}' ScriptureOverlay
```

### Lambda Deployment

```bash
# Deploy Lambda function
pnpm lambda:deploy

# Create site bundle
pnpm lambda:sites

# Render on Lambda
pnpm lambda:render ScriptureOverlay --props='...'
```

## API Usage

### Queue a Render

```bash
POST /api/video-renders
{
  "compositionId": "ScriptureOverlay",
  "inputProps": {
    "reference": "John 3:16",
    "text": "For God so loved the world...",
    "theme": "gold",
    "animationStyle": "typewriter"
  },
  "quality": "standard",
  "outputFormat": "mp4"
}
```

### Quick Endpoints

```bash
# Scripture video
POST /api/video-renders/scripture
{ "reference": "...", "text": "...", "theme": "dark" }

# Quote video
POST /api/video-renders/quote
{ "quote": "...", "author": "...", "theme": "elegant" }

# Daily scripture
POST /api/video-renders/daily
{ "reference": "...", "text": "...", "theme": "morning" }

# Declaration
POST /api/video-renders/declaration
{ "declarations": [{"text": "...", "emphasis": [...]}], "style": "prophetic" }
```

### Check Status

```bash
GET /api/video-renders/:renderId/status
```

Response:
```json
{
  "status": "rendering",
  "progress": 45,
  "outputUrl": null
}
```

## Configuration

### Environment Variables

```bash
# AWS Lambda (Production)
REMOTION_AWS_REGION=us-east-1
REMOTION_SERVE_URL=https://your-site.s3.amazonaws.com/...
REMOTION_FUNCTION_NAME=remotion-render-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Queue (BullMQ)
REDIS_URL=redis://localhost:6379
# OR
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

## Components

### Reusable Components

| Component | Purpose |
|-----------|---------|
| `AnimatedText` | Kinetic typography with 6 animation styles |
| `LowerThird` | Speaker name/title overlays |
| `Captions` | Synchronized captions with karaoke mode |
| `ScriptureCallout` | Scripture highlight cards |
| `Waveform` | Audio visualizers (bars, wave, circle) |
| `GradientBackground` | Themed animated backgrounds |
| `ParticleBackground` | Stars, dust, orbs, ascending particles |
| `BrandWatermark` | Subtle branding |
| `ProgressBar` | Video progress indicator |
| `ChapterMarker` | Chapter navigation |
| `SpeakerCard` | Speaker photos and info |

## Batch Rendering

### Generate 100 Daily Videos

```typescript
import { batchRender } from "@ruach/video";

const configs = dates.map(date => ({
  compositionId: "DailyScripture",
  inputProps: {
    date: date.toISOString(),
    reference: "Psalm 23:1",
    text: "The Lord is my shepherd...",
    theme: "morning"
  },
  outputPath: `./output/daily-${date.toISOString().split('T')[0]}.mp4`
}));

await batchRender(configs, {
  concurrency: 4,
  onVideoComplete: (i, result) => console.log(`Video ${i} done!`),
});
```

## Studio UI

Access the Video Studio at `/studio/video`:

- Visual template selector
- Form-based configuration
- Real-time preview
- One-click rendering
- Download completed videos

## Architecture

```
packages/ruach-video/
├── src/
│   ├── compositions/      # Individual compositions
│   ├── components/        # Reusable React components
│   ├── templates/         # Full video templates
│   ├── schemas/           # Zod validation schemas
│   ├── hooks/             # React hooks for player
│   ├── lib/
│   │   ├── lambda.ts      # AWS Lambda utilities
│   │   └── render.ts      # Local rendering utilities
│   ├── Root.tsx           # Composition registry
│   └── index.ts           # Package exports
├── remotion.config.ts     # Remotion configuration
└── package.json

ruach-ministries-backend/
├── src/api/video-render/
│   ├── content-types/     # Strapi schema
│   ├── controllers/       # API endpoints
│   ├── routes/            # Route definitions
│   └── services/          # Business logic + queue

apps/ruach-next/
└── src/app/[locale]/studio/video/
    └── page.tsx           # Studio UI
```

## Best Practices

1. **Use Lambda for production** - Much faster than local rendering
2. **Batch overnight** - Queue 50-100 videos for off-peak rendering
3. **Cache backgrounds** - Pre-upload images/videos to R2
4. **Test locally first** - Use Remotion Studio for rapid iteration
5. **Monitor costs** - Lambda billing is per-ms; optimize video length

## Costs (Estimated)

| Video Type | Duration | Lambda Cost |
|------------|----------|-------------|
| Scripture Overlay | 15s | ~$0.02 |
| Quote Reel | 10s | ~$0.015 |
| Daily Scripture | 15s | ~$0.02 |
| Declaration | 90s | ~$0.10 |
| Teaching Video | 5min | ~$0.50 |
| Podcast Enhanced | 1hr | ~$5.00 |

## Next Steps

1. Add more templates (episode summaries, transformation clips)
2. Integrate with transcription for auto-captioning
3. Add music library integration
4. Build scheduling for automated daily publishing
5. Add thumbnail generation for all videos
