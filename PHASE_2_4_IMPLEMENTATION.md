# Formation Guidebook Phase 2-4 Implementation

## Overview

This document outlines the implementation of Phases 2-4 of the Formation Guidebook, including voice input with Whisper, AI analysis integration, and routing logic based on depth scores.

## Phase 2: Voice Input with Whisper

### Components Created

#### VoiceRecorder.tsx
**Location:** `/apps/ruach-next/src/components/formation/VoiceRecorder.tsx`

A client-side React component that handles audio recording with the Web Audio API.

**Features:**
- Start/pause/resume/stop recording controls
- Real-time duration tracking with visual feedback
- Animated recording indicator (pulsing red dot)
- Error handling for microphone access issues
- Integration with OpenAI Whisper API for transcription
- Automatic textarea population with transcribed text
- Clean state management and cleanup on unmount

**Props:**
```typescript
interface VoiceRecorderProps {
  onTranscriptionStart?: () => void;
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionError?: (error: string) => void;
  disabled?: boolean;
}
```

**States:**
- `idle` - No recording in progress
- `recording` - Currently recording
- `paused` - Recording paused
- `processing` - Transcribing audio

#### Updated SectionView.tsx
**Location:** `/apps/ruach-next/src/app/[locale]/guidebook/awakening/[slug]/SectionView.tsx`

Added voice recording option to the checkpoint reflection form.

**Changes:**
- Imported VoiceRecorder component
- Added `showVoiceRecorder` state to toggle voice UI
- Added toggle button to show/hide voice recording
- Voice recorder automatically populates reflection textarea
- Users can switch between voice and typing

### API Endpoints

#### POST /api/transcribe
**Location:** `/apps/ruach-next/src/app/api/transcribe/route.ts`

Handles audio transcription using OpenAI Whisper API.

**Request:**
```
Content-Type: multipart/form-data
Body: { audio: File }
```

**Response:**
```json
{ "text": "transcribed text" }
```

**Features:**
- Validates audio file presence
- Forwards to OpenAI Whisper API
- Handles API errors gracefully
- Returns transcribed text in JSON

**Environment Requirements:**
```env
OPENAI_API_KEY=sk-...
```

## Phase 3: AI Analysis Integration

### Components Created

#### AIAnalysisDisplay.tsx
**Location:** `/apps/ruach-next/src/components/formation/AIAnalysisDisplay.tsx`

Displays AI analysis results with color-coded scoring and feedback.

**Features:**
- Four-dimensional analysis: depth, specificity, honesty, alignment
- Color-coded scoring (0-100% with visual progress bars)
- Overall depth score calculation and display
- AI-generated summary and feedback
- Sharpening questions for deeper reflection
- Loading state with skeleton animation
- Responsive layout (grid for desktop, stack for mobile)

**Props:**
```typescript
interface AIAnalysisDisplayProps {
  scores: AnalysisScores;
  sharpeningQuestions?: SharpeningQuestion[];
  summary?: string;
  isLoading?: boolean;
}

interface AnalysisScores {
  depth: number;      // 0-1
  specificity: number; // 0-1
  honesty: number;    // 0-1
  alignment: number;  // 0-1
}

interface SharpeningQuestion {
  question: string;
  context: string;
}
```

**Color Scheme:**
- Green (≥80%) - Excellent
- Blue (60-79%) - Good
- Yellow (40-59%) - Fair
- Red (<40%) - Needs Work

### API Endpoints

#### POST /api/analyze-reflection
**Location:** `/apps/ruach-next/src/app/api/analyze-reflection/route.ts`

Analyzes user reflection using Claude AI with structured prompting.

**Request:**
```json
{
  "reflection": "user's reflection text",
  "checkpointPrompt": "the reflection prompt/question",
  "sectionTitle": "section name",
  "scriptureAnchors": ["optional", "scripture", "references"]
}
```

**Response:**
```json
{
  "scores": {
    "depth": 0.75,
    "specificity": 0.82,
    "honesty": 0.68,
    "alignment": 0.79
  },
  "summary": "Brief feedback about strengths and growth areas",
  "sharpeningQuestions": [
    {
      "question": "Follow-up question for deeper reflection",
      "context": "Why this question matters"
    }
  ],
  "routing": "publish|journal|thread|review"
}
```

**Features:**
- Structured prompting for consistent analysis
- Four-dimensional scoring with explanations
- Generates 2-3 tailored sharpening questions
- Determines routing type based on average score
- Handles parsing errors gracefully
- Fallback responses if Claude API fails

**Environment Requirements:**
```env
CLAUDE_API_KEY=sk-ant-...
```

### Analysis Scoring Criteria

**Depth (0-1)**
- Goes beyond surface-level understanding
- Shows genuine wrestling/engagement with material
- Evidence of personal processing vs. recitation
- Connections to deeper theological themes

**Specificity (0-1)**
- Includes concrete examples and personal details
- Uses particular language vs. generic statements
- References specific Scripture passages
- Connects to personal experiences/context

**Honesty (0-1)**
- Vulnerability and authenticity
- Acknowledgment of struggle or doubts
- Transparency about the formation process
- Willingness to be challenged

**Alignment (0-1)**
- Meaningful connection to Scripture
- Alignment with Christian formation principles
- Coherence with checkpoint's learning objectives
- Integration with broader faith tradition

### Integration in Actions

**Location:** `/apps/ruach-next/src/app/[locale]/guidebook/awakening/[slug]/actions.ts`

**Changes:**
- Added AI analysis types and interfaces
- Created `analyzeReflection()` async function
- AI analysis is called after validation, before persistence
- Results stored in reflection metadata
- Analysis errors handled gracefully with fallback values
- Routing type determined from depth score

**Flow:**
1. User submits reflection
2. Validation: word count (≥50) and dwell time
3. AI Analysis: called asynchronously
4. Reflection stored with analysis results
5. Routing event created
6. Redirect to routing feedback page

## Phase 4: Routing Logic

### Components Created

#### RoutingDecision.tsx
**Location:** `/apps/ruach-next/src/components/formation/RoutingDecision.tsx`

Displays routing decision and next steps based on depth score.

**Features:**
- Color-coded based on routing type
- Shows depth score with visual representation
- Contextual guidance for each routing type
- Metadata display (reflection ID, checkpoint)
- Action buttons with next steps
- Helpful guidance about reflection growth

**Props:**
```typescript
interface RoutingDecisionProps {
  depthScore: number;
  routingType: RoutingType;
  reflectionId: string;
  checkpointId: string;
  sectionId: string;
  phase: string;
}

type RoutingType = "publish" | "journal" | "thread" | "review";
```

#### Routing Page
**Location:** `/apps/ruach-next/src/app/[locale]/guidebook/awakening/routing/page.tsx`

Full-page display of analysis results and routing decision.

**Features:**
- Client-side route with search params
- Decodes routing data from URL
- Displays AIAnalysisDisplay component
- Displays RoutingDecision component
- Error handling for invalid data
- Loading state during data parsing
- Footer with formation principles

**URL Format:**
```
/guidebook/awakening/routing?data=<base64-encoded-json>
```

### Routing Types and Criteria

#### Publish (depth ≥ 0.8)
**Criteria:**
- Reflection shows deep spiritual insight
- High specificity and honesty
- Strong alignment with Scripture
- Ready for community sharing

**Guidance:**
"Your reflection demonstrates deep spiritual insight and is ready to be shared publicly with the community. Your honesty, specificity, and alignment with Scripture show mature spiritual reflection."

**Actions:**
- Publish to Community (primary)
- Save to Journal First
- Continue Reading

---

#### Journal (0.6 ≤ depth < 0.8)
**Criteria:**
- Good engagement with material
- Thoughtful and honest reflection
- Some specificity and personal connection
- Suitable for private spiritual journey

**Guidance:**
"Your reflection shows good engagement and is ready to be saved privately for your own spiritual journey. This reflection captures your growth."

**Actions:**
- Save to Journal (primary)
- Publish to Community
- Continue Reading

---

#### Thread (0.4 ≤ depth < 0.6)
**Criteria:**
- Reflection started well but needs deepening
- Some good points but lacks specificity
- Could benefit from more personal wrestling
- Ready for guided exploration

**Guidance:**
"Your reflection has started well. Let's dive deeper with additional prompts to develop fuller understanding. These additional prompts are designed to help you explore the topic more deeply."

**Actions:**
- Continue with Sharpening Prompts (primary)
- Save and Revisit Later

---

#### Review (depth < 0.4)
**Criteria:**
- Needs significant revision or expansion
- Lacks specificity or personal engagement
- Generic or surface-level responses
- Opportunity for deeper wrestling

**Guidance:**
"Let's take another look at your reflection. There's potential here to go deeper. Reflection is a skill that grows with practice. Consider: Are you being specific about your own experience? Are you wrestling with the material rather than just summarizing?"

**Actions:**
- Revise Reflection (primary)
- Get Writing Tips
- Back to Checkpoint

### Routing Event

The routing decision is logged as a formation event for persistence and analytics:

```json
{
  "type": "reflection_routed",
  "reflectionId": "reflection-...",
  "checkpointId": "checkpoint-123",
  "sectionId": "section-456",
  "phase": "awakening",
  "depthScore": 0.72,
  "routing": "journal",
  "scores": {
    "depth": 0.75,
    "specificity": 0.82,
    "honesty": 0.68,
    "alignment": 0.79
  },
  "summary": "Your reflection shows thoughtful engagement...",
  "sharpeningQuestions": [...],
  "timestamp": "2025-02-01T..."
}
```

### Routing Utilities

**Location:** `/apps/ruach-next/src/lib/formation/routing.ts`

Helper functions for routing data management:

**Functions:**
- `encodeRoutingData(data: RoutingData): string` - Encode to base64
- `decodeRoutingData(encoded: string): RoutingData | null` - Decode from base64
- `getRoutingColor(type: RoutingType): Color` - Get color scheme
- `getRoutingDisplayName(type: RoutingType): string` - Get display label
- `calculateDepthScore(scores: AnalysisScores): number` - Calculate average score
- `getRoutingFromScore(score: number): RoutingType` - Determine routing from score

## Type Updates

### Formation Package
**Location:** `/packages/ruach-formation/src/types/checkpoint.ts`

**New Types:**
- `ReflectionRouting` - Enum for routing types (publish, journal, thread, review)
- `ReflectionRoutingEvent` - Event structure for routing decisions
- Enhanced `Reflection` interface with analysis fields:
  - `analysisScores` - Four-dimensional scores
  - `analysisSummary` - AI feedback text
  - `sharpeningQuestions` - Follow-up questions

## Integration Flow

### Complete Checkpoint Submission Flow

```
1. User reads section content
   ↓
2. Minimum dwell time check
   ↓
3. User provides reflection (typing or voice)
   ↓
4. Form submission validation
   ├── Word count ≥ 50 ✓
   └── Dwell time met ✓
   ↓
5. AI Analysis
   ├── Call /api/analyze-reflection
   ├── Receive scores and routing type
   └── Generate sharpening questions
   ↓
6. Persistence
   ├── Store reflection with analysis
   ├── Create routing event
   └── Update journey state
   ↓
7. Redirect to routing page
   ├── Display AIAnalysisDisplay
   ├── Display RoutingDecision
   └── Show next steps
   ↓
8. User chooses next action based on routing
```

## Error Handling

### Voice Recording Errors
- **Microphone Permission Denied** → User-friendly error message
- **Recording Failure** → Fallback to manual typing
- **Transcription Timeout** → Retry or manual entry
- **Network Error** → Show error and allow manual entry

### AI Analysis Errors
- **API Unavailable** → Use default routing (journal)
- **Invalid Response** → Fallback response with generic feedback
- **Timeout** → Skip analysis, proceed to next section
- **Parsing Error** → Log error, return fallback response

### Routing Page Errors
- **Invalid URL Data** → Redirect to guidebook
- **Corrupted Base64** → Handle gracefully
- **Missing Parameters** → Show error page
- **Navigation Errors** → Provide fallback links

## File Structure

```
/apps/ruach-next/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── transcribe/
│   │   │   │   └── route.ts          # Phase 2: Whisper API
│   │   │   └── analyze-reflection/
│   │   │       └── route.ts          # Phase 3: Claude analysis
│   │   └── [locale]/guidebook/
│   │       └── awakening/
│   │           ├── [slug]/
│   │           │   ├── SectionView.tsx (updated)
│   │           │   └── actions.ts (updated)
│   │           └── routing/
│   │               └── page.tsx       # Phase 4: Routing feedback
│   ├── components/
│   │   └── formation/
│   │       ├── VoiceRecorder.tsx      # Phase 2: Recording UI
│   │       ├── AIAnalysisDisplay.tsx  # Phase 3: Analysis display
│   │       ├── RoutingDecision.tsx    # Phase 4: Routing decision
│   │       ├── index.ts               # Component exports
│   │       └── README.md              # Component documentation
│   └── lib/
│       └── formation/
│           ├── routing.ts             # Routing utilities
│           └── (existing files)
│
/packages/ruach-formation/
├── src/types/
│   └── checkpoint.ts (updated)        # New routing types
└── (existing structure)

ROOT
└── PHASE_2_4_IMPLEMENTATION.md        # This file
```

## Environment Setup

### Required Environment Variables

```env
# Phase 2: Voice Transcription
OPENAI_API_KEY=sk-...

# Phase 3: AI Analysis
CLAUDE_API_KEY=sk-ant-...

# Formation Database
NEXT_PUBLIC_STRAPI_URL=https://...
STRAPI_FORMATION_TOKEN=...

# App Configuration (for analyze-reflection endpoint)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (or production URL)
```

## Testing Checklist

### Phase 2: Voice Recording
- [ ] Start recording works
- [ ] Pause/resume recording works
- [ ] Stop recording works
- [ ] Duration tracking displays correctly
- [ ] Transcription completes successfully
- [ ] Transcribed text appears in textarea
- [ ] Error handling works for denied microphone
- [ ] Works in different browsers (Chrome, Firefox, Safari)

### Phase 3: AI Analysis
- [ ] Analysis endpoint receives requests
- [ ] Claude API integration works
- [ ] All four scores are calculated
- [ ] Sharpening questions are generated
- [ ] Routing type is determined correctly
- [ ] Fallback works when API fails
- [ ] Error messages are helpful

### Phase 4: Routing
- [ ] Routing data encodes correctly
- [ ] Routing data decodes correctly
- [ ] Routing page displays all four routing types
- [ ] Color coding matches routing type
- [ ] Guidance text is appropriate
- [ ] Action buttons link to correct pages
- [ ] Metadata displays correctly
- [ ] Error handling redirects appropriately

## Future Enhancements

### Phase 2 Extensions
- Multiple language support (using Whisper language parameter)
- Audio quality indicators
- Trim/edit audio before transcription
- Support for different audio formats
- Background noise reduction

### Phase 3 Extensions
- User history-based personalized analysis
- Cohort/group analysis trends
- Batch analysis for large reflections
- Analysis confidence scores
- Multi-language analysis support

### Phase 4 Extensions
- Peer review routing for high-depth reflections
- Custom routing rules per phase/section
- Routing history and trend visualization
- Integration with formation groups
- Reflection portfolio tracking

## Performance Considerations

- Routing data is URL-encoded to avoid session storage
- Analysis is non-blocking (fires after validation)
- Voice recording uses efficient Web Audio API
- Whisper API handles transcription (client sends only audio blob)
- Claude analysis runs server-side (client never sees raw prompts)
- Graceful degradation when APIs fail
- Loading states provide visual feedback during processing

## Security Considerations

- Audio data transmitted over HTTPS only
- API keys stored in environment variables (never exposed)
- URL-encoded data is base64 (not encrypted, for simplicity)
- User reflection stored in secure database
- Analysis results tied to user ID
- Routing decisions logged for audit trail

## Analytics and Monitoring

Events logged:
- `[Formation Analysis] Completed` - Analysis results
- `[Formation Event] Reflection Routed` - Routing decision
- `[Transcription API Error]` - Transcription failures
- `[Analysis API Error]` - Analysis failures
- `[Routing] Failed to encode/decode data` - Data transmission errors

These can be connected to monitoring tools for insights into:
- Analysis distribution across routing types
- Voice vs. text ratio
- Common reflection patterns
- API reliability

## Documentation

- **Component README**: `/components/formation/README.md` - Component-level docs
- **This File**: Architecture and integration overview
- **API Endpoints**: Documented in respective route.ts files
- **Types**: Documented in checkpoint.ts

## Conclusion

The Phase 2-4 implementation provides a complete workflow for voice-enhanced reflection capture, AI-powered analysis, and intelligent routing. Each phase builds on the previous one to create a sophisticated formation experience that balances technological enhancement with pedagogical soundness.

The modular design allows for future expansion while maintaining graceful degradation when components fail. The routing system helps users understand their reflection progress while encouraging deeper engagement with the formation process.
