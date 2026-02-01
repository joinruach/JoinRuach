# Formation Guidebook Phase 2-4 Features

This directory contains components and logic for advanced Formation Guidebook features including voice input, AI analysis, and routing decisions.

## Phase 2: Voice Input with Whisper

### Components
- **VoiceRecorder.tsx** - Client component for audio recording and transcription
  - Start/pause/resume/stop recording controls
  - Duration tracking with visual feedback
  - Integration with OpenAI Whisper API
  - Real-time transcription with error handling

### API Endpoints
- **POST /api/transcribe** - Transcribe audio to text
  - Accepts multipart/form-data with audio file
  - Uses OpenAI Whisper API for transcription
  - Returns transcribed text

### Integration Points
- Integrated into SectionView.tsx checkpoint form
- Shows voice recording UI option above reflection textarea
- Automatically inserts transcribed text into reflection textarea
- Allows editing of transcribed text before submission

## Phase 3: AI Analysis Integration

### Components
- **AIAnalysisDisplay.tsx** - Displays AI analysis results
  - Shows four key scores: depth, specificity, honesty, alignment (0-1 scale)
  - Displays overall depth score with color-coded rating
  - Shows sharpening questions for deeper reflection
  - Includes AI-generated summary and guidance

### API Endpoints
- **POST /api/analyze-reflection** - Analyze reflection using Claude AI
  - Request body:
    ```json
    {
      "reflection": "user's reflection text",
      "checkpointPrompt": "the checkpoint question",
      "sectionTitle": "section name",
      "scriptureAnchors": ["optional", "scripture", "references"]
    }
    ```
  - Response:
    ```json
    {
      "scores": {
        "depth": 0.75,
        "specificity": 0.82,
        "honesty": 0.68,
        "alignment": 0.79
      },
      "summary": "AI feedback about the reflection",
      "sharpeningQuestions": [
        {
          "question": "follow-up question",
          "context": "why this question matters"
        }
      ],
      "routing": "publish|journal|thread|review"
    }
    ```

### Analysis Criteria

#### Depth (0-1)
- Does the reflection go beyond surface-level?
- Is there genuine wrestling with the material?
- Evidence of personal processing vs. recitation

#### Specificity (0-1)
- Are there concrete examples and personal details?
- Use of particular language vs. generic statements
- Connection to specific Scripture passages or personal experiences

#### Honesty (0-1)
- Is the reflection vulnerable and authentic?
- Acknowledgment of struggle, doubt, or questions
- Transparency about the formation process

#### Alignment (0-1)
- Does it connect meaningfully to Scripture?
- Alignment with Christian formation principles
- Coherence with the checkpoint's learning objectives

### Integration in Submission Flow
1. User submits reflection at checkpoint
2. Server validates word count and dwell time
3. AI analysis is called asynchronously
4. Reflection and analysis results are stored
5. User is shown routing decision page with feedback

## Phase 4: Routing Logic

### Components
- **RoutingDecision.tsx** - Displays routing decision and next steps
  - Color-coded based on routing type
  - Shows depth score and routing type
  - Provides contextual guidance
  - Links to next actions based on routing

### Routing Types

#### Publish (depth >= 0.8)
- Reflection demonstrates deep spiritual insight
- Ready to be shared publicly with community
- Suggested actions:
  - Publish to community
  - Save to private journal
  - Continue to next section

#### Journal (0.6 <= depth < 0.8)
- Reflection shows good engagement
- Saved privately for personal spiritual journey
- Suggested actions:
  - Save to journal
  - Option to publish later
  - Continue to next section

#### Thread (0.4 <= depth < 0.6)
- Reflection has started well but needs depth
- Continue with sharpening prompts
- Suggested actions:
  - Continue with provided sharpening questions
  - Deepen specific areas
  - Save progress

#### Review (depth < 0.4)
- Reflection needs more work and revision
- User is encouraged to revisit the checkpoint
- Suggested actions:
  - Revise reflection
  - Access writing tips and guidelines
  - Return to checkpoint with fresh perspective

### Routing Decision Page
- **Page: /guidebook/awakening/routing**
- Displays:
  - AI analysis results (scores and summary)
  - Routing decision explanation
  - Sharpening questions if applicable
  - Next steps based on routing type
  - Metadata (reflection ID, checkpoint, scores)

### Data Persistence
Routing decisions are logged as formation events:
```json
{
  "type": "reflection_routed",
  "reflectionId": "...",
  "checkpointId": "...",
  "sectionId": "...",
  "phase": "awakening",
  "depthScore": 0.72,
  "routing": "journal",
  "scores": {
    "depth": 0.75,
    "specificity": 0.82,
    "honesty": 0.68,
    "alignment": 0.79
  },
  "summary": "...",
  "sharpeningQuestions": [...],
  "timestamp": "2025-02-01T..."
}
```

## File Structure

```
components/formation/
├── VoiceRecorder.tsx         # Phase 2: Voice recording UI
├── AIAnalysisDisplay.tsx     # Phase 3: Analysis results display
├── RoutingDecision.tsx       # Phase 4: Routing decision display
└── README.md                 # This file

app/api/
├── transcribe/
│   └── route.ts              # Phase 2: Whisper transcription
└── analyze-reflection/
    └── route.ts              # Phase 3: Claude analysis

app/[locale]/guidebook/awakening/
├── [slug]/
│   ├── SectionView.tsx       # Updated with voice recorder
│   └── actions.ts            # Updated with analysis and routing
└── routing/
    └── page.tsx              # Phase 4: Routing feedback page
```

## Configuration

Required environment variables:
```env
# Phase 2: Voice transcription
OPENAI_API_KEY=sk-...

# Phase 3: AI analysis
CLAUDE_API_KEY=sk-ant-...

# Formation database
NEXT_PUBLIC_STRAPI_URL=https://...
STRAPI_FORMATION_TOKEN=...
```

## Error Handling

### Voice Recording Errors
- Microphone permission denied → User-friendly error message
- Recording failure → Graceful fallback to typing
- Transcription timeout → Retry or manual entry

### Analysis Errors
- API unavailable → Fall back to default routing (journal)
- Invalid response → Use fallback analysis
- Timeout → Proceed to next section instead of routing page

### Routing Errors
- Routing data corruption → Redirect to guidebook
- Page navigation errors → Graceful fallback

## Future Enhancements

### Phase 2 Extensions
- Multiple language support (Phase 3 checkpoint)
- Audio editing and trimming
- Voice confidence metrics
- Accent and dialect optimization

### Phase 3 Extensions
- Multi-dimensional analysis scoring
- Personalized feedback based on user history
- Batch analysis for cohorts
- Analysis result versioning

### Phase 4 Extensions
- Peer-review routing for advanced reflections
- Custom routing rules per phase
- Routing history and trends
- Integration with formation groups

## Testing

### Voice Recording
```typescript
// Test audio capture and transcription
const recorder = new VoiceRecorder({
  onTranscriptionComplete: (text) => {
    console.log("Transcribed:", text);
  }
});
```

### Analysis
```typescript
// Test AI analysis endpoint
const analysis = await fetch("/api/analyze-reflection", {
  method: "POST",
  body: JSON.stringify({
    reflection: "Test reflection text",
    checkpointPrompt: "What did you learn?",
    sectionTitle: "Section Title",
  })
});
```

### Routing
```typescript
// Test routing page with encoded data
const data = {
  reflectionId: "...",
  routing: "publish",
  scores: { depth: 0.85, ... }
};
const encoded = Buffer.from(JSON.stringify(data)).toString("base64");
window.location = `/guidebook/awakening/routing?data=${encoded}`;
```

## Development Notes

- VoiceRecorder uses Web Audio API for recording
- Whisper API handles all transcription (no client-side processing)
- Claude AI provides deep semantic analysis, not simple keyword matching
- Routing is deterministic based on depth score ranges
- All analysis is non-blocking and gracefully degrades
