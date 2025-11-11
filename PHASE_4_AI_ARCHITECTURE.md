# Phase 4: AI Integration Architecture

**Status:** Design Complete - Ready for Implementation
**Estimated Timeline:** 2 weeks
**Last Updated:** 2025-11-11

---

## Executive Summary

Phase 4 transforms Ruach from a content platform into an intelligent spiritual learning companion by integrating:

1. **Semantic Search** - Find content by meaning, not just keywords
2. **Ruach AI Assistant** - Conversational guide for spiritual growth
3. **Auto-Transcription** - Automated video/audio transcription pipeline
4. **Smart Recommendations** - Personalized content discovery

---

## Current State Analysis

### ✅ Existing Infrastructure

**Transcript Support:**
- `lesson.transcript` (richtext) - Manual entry
- `lesson.transcriptFile` (media) - File upload
- `media-item.transcript` (richtext) - Manual entry
- `LessonTranscript` component - Display with show/hide/download

**Database:**
- PostgreSQL support (currently SQLite for dev)
- Can add pgvector extension for embeddings
- Migrations system in place

**Redis/Caching:**
- Upstash Redis configured
- Used for rate limiting
- Available for job queues

**Authentication:**
- NextAuth with user sessions
- Can track user interactions

### ❌ Missing Infrastructure

- No AI/ML packages (OpenAI, Anthropic, LangChain)
- No vector database (pgvector not installed)
- No job queue system (BullMQ)
- No embedding generation pipeline
- No AI configuration management
- No conversation history storage

---

## Architecture Design

### 1. AI Embeddings & Semantic Search

#### Technology Stack
- **Embedding Model:** OpenAI `text-embedding-3-small` (1536 dimensions)
  - Cost: $0.02 per 1M tokens (~$0.20 for all content)
  - Speed: ~3000 items/minute
  - Quality: Excellent for semantic search
- **Vector Database:** PostgreSQL with pgvector extension
  - No external service needed
  - Scales to millions of vectors
  - Standard SQL queries + vector similarity
- **Client Library:** `openai` npm package

#### Database Schema

```sql
-- Add pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Embeddings table
CREATE TABLE content_embeddings (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'media', 'lesson', 'blog', 'course', 'series'
  content_id INTEGER NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  text_content TEXT NOT NULL, -- What was embedded
  metadata JSONB, -- {title, description, tags, speakers, etc.}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- Composite unique constraint
  UNIQUE(content_type, content_id)
);

-- Vector similarity index (IVFFlat for speed)
CREATE INDEX content_embeddings_vector_idx
ON content_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Metadata index for filtering
CREATE INDEX content_embeddings_metadata_idx
ON content_embeddings
USING gin (metadata);

-- Type + ID index for updates
CREATE INDEX content_embeddings_content_idx
ON content_embeddings (content_type, content_id);
```

#### Embedding Pipeline

**Phase 1: Initial Bulk Generation**
```typescript
// packages/ruach-ai/src/embeddings/generator.ts
export async function generateEmbeddings(
  contentType: ContentType,
  batchSize = 100
) {
  // 1. Fetch content from Strapi
  const items = await fetchContentBatch(contentType, batchSize);

  // 2. Prepare text for embedding
  const texts = items.map(item => prepareTextForEmbedding(item));

  // 3. Generate embeddings (batch API call)
  const embeddings = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  // 4. Store in database
  await storeEmbeddings(contentType, items, embeddings);
}

function prepareTextForEmbedding(item: any): string {
  // Combine title, description, transcript, tags
  const parts = [
    item.title,
    item.description || item.excerpt || item.summary,
    item.transcript?.substring(0, 2000), // First 2000 chars
    item.tags?.map(t => t.name).join(' '),
    item.speakers?.map(s => s.name).join(' '),
  ].filter(Boolean);

  return parts.join(' | ');
}
```

**Phase 2: Incremental Updates (Strapi Lifecycle Hooks)**
```typescript
// ruach-ministries-backend/src/api/media-item/content-types/media-item/lifecycles.ts
module.exports = {
  async afterCreate(event) {
    await queueEmbeddingJob('media', event.result.id);
  },

  async afterUpdate(event) {
    // Only regenerate if content changed
    const changedFields = ['title', 'description', 'transcript', 'tags'];
    if (hasChanges(event, changedFields)) {
      await queueEmbeddingJob('media', event.result.id);
    }
  },
};
```

#### Semantic Search API

```typescript
// apps/ruach-next/src/app/api/search/semantic/route.ts
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  const type = request.nextUrl.searchParams.get("type");

  // 1. Generate query embedding
  const queryEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: query,
  });

  // 2. Vector similarity search
  const results = await db.query(`
    SELECT
      content_type,
      content_id,
      metadata,
      1 - (embedding <=> $1::vector) AS similarity
    FROM content_embeddings
    WHERE ($2::text IS NULL OR content_type = $2)
      AND 1 - (embedding <=> $1::vector) > 0.7 -- 70% similarity threshold
    ORDER BY similarity DESC
    LIMIT 20
  `, [queryEmbedding.data[0].embedding, type]);

  // 3. Fetch full content from Strapi
  const enriched = await enrichWithStrapiData(results);

  return NextResponse.json({ results: enriched });
}
```

---

### 2. Ruach AI Assistant

#### Technology Stack
- **LLM:** Anthropic Claude 3.5 Sonnet
  - Best reasoning for complex spiritual questions
  - 200K context window
  - Streaming support
- **Framework:** Vercel AI SDK
  - Stream handling
  - React hooks (useChat)
  - Automatic error handling
- **Context Storage:** PostgreSQL
  - Conversation history
  - User preferences

#### Database Schema

```sql
-- Conversation sessions
CREATE TABLE ai_conversations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  title TEXT, -- Auto-generated from first message
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Message history
CREATE TABLE ai_messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
  content TEXT NOT NULL,
  metadata JSONB, -- {model, tokens, sources, etc.}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX ai_messages_conversation_idx ON ai_messages(conversation_id);
CREATE INDEX ai_conversations_user_idx ON ai_conversations(user_id);
```

#### System Prompt Design

```typescript
const SYSTEM_PROMPT = `You are the Ruach AI Assistant, a knowledgeable guide for Ruach Ministries.

**Your Role:**
- Help users discover relevant content (teachings, testimonies, worship)
- Answer questions about faith, spirituality, and biblical topics
- Recommend courses and lessons based on user interests
- Provide encouragement and spiritual guidance

**Your Knowledge:**
- Access to Ruach's complete content catalog (via RAG)
- Biblical references and theological understanding
- User's viewing history and preferences

**Your Tone:**
- Warm, encouraging, and pastoral
- Biblically grounded but accessible
- Respectful of diverse perspectives
- Focus on practical application

**When recommending content:**
- Cite specific videos, courses, or series
- Explain why the content is relevant
- Provide direct links

**Limitations:**
- You're an AI assistant, not a pastor or therapist
- Encourage users to seek human spiritual direction for serious matters
- Always ground responses in biblical truth`;
```

#### RAG (Retrieval-Augmented Generation)

```typescript
// apps/ruach-next/src/lib/ai/rag.ts
export async function getRelevantContext(
  userQuery: string,
  userId?: number
): Promise<string> {
  // 1. Semantic search for relevant content
  const semanticResults = await semanticSearch(userQuery, { limit: 5 });

  // 2. Get user's recent viewing history
  const history = userId
    ? await getUserRecentViews(userId, { limit: 3 })
    : [];

  // 3. Format context for LLM
  const context = [
    "# Relevant Content from Ruach Catalog:",
    ...semanticResults.map(formatContentForContext),
    "",
    "# User's Recent Activity:",
    ...history.map(formatHistoryForContext),
  ].join('\n');

  return context;
}

function formatContentForContext(item: SearchResult): string {
  return `
## ${item.title} (${item.contentType})
- **URL:** ${item.url}
- **Description:** ${item.description}
- **Speakers:** ${item.speakers?.join(', ')}
- **Key Topics:** ${item.tags?.join(', ')}
  `.trim();
}
```

#### Streaming Chat API

```typescript
// apps/ruach-next/src/app/api/chat/route.ts
import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  // Get relevant context via RAG
  const lastMessage = messages[messages.length - 1];
  const context = await getRelevantContext(lastMessage.content);

  // Stream response
  const result = await streamText({
    model: createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })('claude-3-5-sonnet-20241022'),
    system: SYSTEM_PROMPT + '\n\n' + context,
    messages,
    temperature: 0.7,
    maxTokens: 1000,
  });

  // Save to database (async, don't await)
  saveConversation(conversationId, messages, result);

  return result.toDataStreamResponse();
}
```

#### Frontend Component

```typescript
// apps/ruach-next/src/components/ai/RuachAssistant.tsx
'use client';

import { useChat } from 'ai/react';

export function RuachAssistant() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
  });

  return (
    <div className="flex flex-col h-[600px]">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isLoading && <LoadingIndicator />}
      </div>

      <ChatInput
        value={input}
        onChange={handleInputChange}
        onSubmit={handleSubmit}
        disabled={isLoading}
      />
    </div>
  );
}
```

---

### 3. Automated Transcription Pipeline

#### Technology Stack
- **Transcription API:** OpenAI Whisper API
  - Cost: $0.006 per minute (~$3.60 for 10 hours)
  - Supports 50+ languages
  - High accuracy
- **Job Queue:** BullMQ
  - Redis-based
  - Retry logic
  - Priority queue
- **Worker Process:** Separate Node.js service

#### Database Schema

```sql
-- Transcription jobs
CREATE TABLE transcription_jobs (
  id SERIAL PRIMARY KEY,
  content_type VARCHAR(50) NOT NULL, -- 'media' | 'lesson'
  content_id INTEGER NOT NULL,
  video_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  progress INTEGER DEFAULT 0, -- 0-100
  error_message TEXT,
  transcript TEXT, -- Final result
  metadata JSONB, -- {duration, language, cost, etc.}
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE INDEX transcription_jobs_status_idx ON transcription_jobs(status);
CREATE INDEX transcription_jobs_content_idx ON transcription_jobs(content_type, content_id);
```

#### Queue Setup

```typescript
// packages/ruach-ai/src/transcription/queue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

export const transcriptionQueue = new Queue('transcription', { connection });

// Add job to queue
export async function queueTranscription(
  contentType: 'media' | 'lesson',
  contentId: number,
  videoUrl: string,
  priority: number = 0
) {
  return transcriptionQueue.add('transcribe', {
    contentType,
    contentId,
    videoUrl,
  }, {
    priority, // Higher = more urgent
    attempts: 3,
    backoff: { type: 'exponential', delay: 60000 },
  });
}
```

#### Worker Process

```typescript
// packages/ruach-ai/src/transcription/worker.ts
import { Worker } from 'bullmq';
import OpenAI from 'openai';
import { downloadVideo, extractAudio } from './media-utils';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const transcriptionWorker = new Worker(
  'transcription',
  async (job) => {
    const { contentType, contentId, videoUrl } = job.data;

    // Update job status
    await updateJobStatus(job.id, 'processing', 10);

    // 1. Download video
    const videoPath = await downloadVideo(videoUrl);
    await job.updateProgress(30);

    // 2. Extract audio
    const audioPath = await extractAudio(videoPath);
    await job.updateProgress(50);

    // 3. Transcribe with Whisper
    const transcript = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
    });
    await job.updateProgress(80);

    // 4. Save to database and Strapi
    await saveTranscript(contentType, contentId, transcript.text);
    await updateJobStatus(job.id, 'completed', 100);

    // 5. Cleanup temp files
    await cleanup([videoPath, audioPath]);

    return { transcript: transcript.text };
  },
  { connection }
);

transcriptionWorker.on('failed', async (job, err) => {
  await updateJobStatus(job.id, 'failed', 0, err.message);
});
```

#### Strapi Integration

```typescript
// ruach-ministries-backend/src/api/media-item/controllers/media-item.ts
async requestTranscription(ctx) {
  const { id } = ctx.params;

  // Get media item
  const media = await strapi.entityService.findOne(
    'api::media-item.media-item',
    id,
    { fields: ['videoUrl'] }
  );

  if (!media.videoUrl) {
    return ctx.badRequest('No video URL found');
  }

  // Queue transcription job
  const job = await queueTranscription('media', id, media.videoUrl, 5);

  ctx.send({
    message: 'Transcription queued',
    jobId: job.id
  });
}
```

---

### 4. Smart Content Recommendations

#### Technology Stack
- **Algorithm:** Hybrid (embeddings + collaborative filtering)
- **Storage:** PostgreSQL
- **Caching:** Redis (1-hour TTL)

#### Database Schema

```sql
-- User content interactions
CREATE TABLE user_interactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  content_type VARCHAR(50) NOT NULL,
  content_id INTEGER NOT NULL,
  interaction_type VARCHAR(20) NOT NULL, -- 'view', 'complete', 'like', 'bookmark'
  duration_sec INTEGER, -- For videos
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX user_interactions_user_idx ON user_interactions(user_id, created_at DESC);
CREATE INDEX user_interactions_content_idx ON user_interactions(content_type, content_id);
```

#### Recommendation Engine

```typescript
// apps/ruach-next/src/lib/recommendations/engine.ts

export async function getRecommendations(
  userId: number,
  options: {
    contentType?: string;
    limit?: number;
    excludeViewed?: boolean;
  } = {}
): Promise<RecommendedContent[]> {
  // 1. Get user's recent interactions
  const userHistory = await getUserHistory(userId, { limit: 20 });

  if (userHistory.length === 0) {
    // New user - show popular content
    return getPopularContent(options);
  }

  // 2. Content-based: Find similar items using embeddings
  const contentBased = await getContentBasedRecommendations(
    userHistory,
    options
  );

  // 3. Collaborative: Users with similar taste
  const collaborative = await getCollaborativeRecommendations(
    userId,
    options
  );

  // 4. Merge and rank
  const merged = mergeRecommendations(
    contentBased,
    collaborative,
    { contentWeight: 0.6, collaborativeWeight: 0.4 }
  );

  return merged.slice(0, options.limit || 10);
}

async function getContentBasedRecommendations(
  userHistory: UserInteraction[],
  options: RecommendationOptions
): Promise<RecommendedContent[]> {
  // Calculate average embedding of user's liked content
  const likedEmbeddings = await getEmbeddings(
    userHistory.filter(h => h.completed || h.duration_sec > 300)
  );

  const avgEmbedding = calculateAverageEmbedding(likedEmbeddings);

  // Find similar content via vector search
  const similar = await db.query(`
    SELECT
      content_type,
      content_id,
      metadata,
      1 - (embedding <=> $1::vector) AS similarity
    FROM content_embeddings
    WHERE ($2::text IS NULL OR content_type = $2)
      AND (content_type, content_id) NOT IN (
        SELECT content_type, content_id
        FROM user_interactions
        WHERE user_id = $3
      )
    ORDER BY similarity DESC
    LIMIT 20
  `, [avgEmbedding, options.contentType, userId]);

  return similar.rows;
}
```

#### Recommendation Widget

```typescript
// apps/ruach-next/src/components/recommendations/RecommendedForYou.tsx
'use client';

export async function RecommendedForYou({ userId }: { userId: number }) {
  const recommendations = await getRecommendations(userId, { limit: 6 });

  return (
    <section className="py-12">
      <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map(item => (
          <ContentCard
            key={`${item.contentType}-${item.contentId}`}
            item={item}
            reason={item.reason} // "Because you watched X" or "Similar to your interests"
          />
        ))}
      </div>
    </section>
  );
}
```

---

## Implementation Plan

### Phase 4A: Semantic Search (Week 1)

**Day 1-2: Infrastructure Setup**
- [ ] Add pgvector extension to PostgreSQL
- [ ] Create embeddings table and indexes
- [ ] Install AI packages (`openai`, `@ai-sdk/anthropic`, `ai`, `bullmq`)
- [ ] Set up environment variables

**Day 3-4: Embedding Pipeline**
- [ ] Create embedding generator package (`packages/ruach-ai`)
- [ ] Implement batch embedding generation
- [ ] Add Strapi lifecycle hooks for incremental updates
- [ ] Generate initial embeddings for all content

**Day 5: Semantic Search API**
- [ ] Implement `/api/search/semantic` endpoint
- [ ] Update SearchBar component to toggle search modes
- [ ] Add "AI Search" badge and explanation
- [ ] Test semantic vs keyword search

### Phase 4B: AI Assistant (Week 1-2)

**Day 6-7: Database & Backend**
- [ ] Create conversation tables
- [ ] Implement RAG context retrieval
- [ ] Build streaming chat API endpoint
- [ ] Add conversation history management

**Day 8-9: Frontend**
- [ ] Create RuachAssistant component
- [ ] Design chat interface
- [ ] Add keyboard shortcuts (⌘/ to open)
- [ ] Implement streaming message display
- [ ] Add source citations

**Day 10: Integration**
- [ ] Add assistant button to navbar
- [ ] Create standalone /assistant page
- [ ] Add contextual suggestions ("Ask AI about this video")
- [ ] Test end-to-end flows

### Phase 4C: Auto-Transcription (Week 2)

**Day 11-12: Queue Infrastructure**
- [ ] Set up BullMQ with Redis
- [ ] Create transcription queue and worker
- [ ] Implement video download and audio extraction
- [ ] Integrate Whisper API

**Day 13: Strapi Integration**
- [ ] Add transcription request endpoint
- [ ] Create admin UI for bulk transcription
- [ ] Add auto-transcription checkbox to media/lesson forms
- [ ] Test with real video content

### Phase 4D: Recommendations (Week 2)

**Day 14: Backend**
- [ ] Create user_interactions table
- [ ] Implement interaction tracking API
- [ ] Build recommendation engine
- [ ] Add Redis caching layer

**Day 15: Frontend**
- [ ] Create RecommendedForYou component
- [ ] Add to homepage and media pages
- [ ] Implement "Because you watched X" explanations
- [ ] Track widget performance

### Phase 4E: Testing & Documentation (Week 2)

**Day 16: Testing**
- [ ] E2E tests for semantic search
- [ ] E2E tests for AI assistant
- [ ] Integration tests for transcription pipeline
- [ ] Performance testing for recommendations

**Day 17: Documentation & Deployment**
- [ ] Create PHASE_4_COMPLETE.md
- [ ] Update environment variable docs
- [ ] Write deployment guide
- [ ] Create monitoring dashboards

---

## Configuration Management

### Environment Variables

```bash
# apps/ruach-next/.env
# AI Services
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...

# Vector Search
POSTGRES_VECTOR_ENABLED=true

# Transcription
TRANSCRIPTION_AUTO_QUEUE=false # Manual by default
TRANSCRIPTION_PRIORITY_THRESHOLD=1000 # Auto for >1000 views

# AI Assistant
AI_ASSISTANT_ENABLED=true
AI_ASSISTANT_MAX_HISTORY=20 # Messages per conversation

# Recommendations
RECOMMENDATIONS_CACHE_TTL=3600 # 1 hour
RECOMMENDATIONS_MIN_INTERACTIONS=3 # Min user history
```

### Feature Flags

```typescript
// apps/ruach-next/src/lib/features.ts
export const AI_FEATURES = {
  semanticSearch: process.env.NEXT_PUBLIC_SEMANTIC_SEARCH_ENABLED === 'true',
  aiAssistant: process.env.NEXT_PUBLIC_AI_ASSISTANT_ENABLED === 'true',
  autoTranscription: process.env.TRANSCRIPTION_AUTO_QUEUE === 'true',
  recommendations: process.env.NEXT_PUBLIC_RECOMMENDATIONS_ENABLED === 'true',
};
```

---

## Cost Estimation

### Monthly Costs (Estimated)

**OpenAI Embeddings:**
- Initial: 10,000 items × $0.02/1M tokens ≈ $2
- Incremental: 100 items/month × $0.02/1M tokens ≈ $0.10/month

**OpenAI Whisper:**
- 20 hours/month × $0.36/hour = $7.20/month

**Anthropic Claude:**
- 1,000 conversations × 200K tokens avg = 200M tokens
- Input: 150M × $3/1M = $450
- Output: 50M × $15/1M = $750
- **Total: $1,200/month** (optimize with caching)

**Infrastructure:**
- PostgreSQL (existing): $0
- Redis (Upstash): $0-10/month
- BullMQ worker (existing infra): $0

**Total Monthly Estimate: ~$1,220**

### Cost Optimization Strategies

1. **Aggressive Caching:**
   - Cache common queries for 24 hours
   - Save ~70% on AI assistant costs

2. **Prompt Optimization:**
   - Use shorter system prompts
   - Implement context compression
   - Save ~30% on Claude costs

3. **Tiered Features:**
   - AI Assistant: Partners only
   - Semantic Search: All users
   - Auto-transcription: High-value content only

4. **Batch Processing:**
   - Generate embeddings in bulk
   - Queue transcriptions overnight
   - Save on API rate limit charges

---

## Success Metrics

### Phase 4 KPIs

**Engagement:**
- [ ] 30% of users try semantic search within first month
- [ ] 20% of partners use AI assistant weekly
- [ ] Average 5 questions per AI session

**Content Discovery:**
- [ ] 40% increase in content views from recommendations
- [ ] 25% reduction in search abandonment
- [ ] 15% increase in course completion rates

**Operational:**
- [ ] 90% of new videos auto-transcribed within 24 hours
- [ ] <2 second response time for semantic search
- [ ] <1 second time-to-first-token for AI assistant

**Quality:**
- [ ] >80% user satisfaction with AI responses
- [ ] <5% AI hallucination rate (verified through sampling)
- [ ] >70% of recommendations clicked

---

## Risk Management

### Technical Risks

**1. AI Hallucination**
- **Risk:** Assistant provides incorrect biblical information
- **Mitigation:**
  - Add source citations for all claims
  - Include disclaimer about AI limitations
  - Human review of common queries

**2. Embedding Quality**
- **Risk:** Semantic search returns irrelevant results
- **Mitigation:**
  - A/B test with keyword search
  - Collect user feedback
  - Iterate on text preparation

**3. Transcription Accuracy**
- **Risk:** Whisper misses spiritual terminology
- **Mitigation:**
  - Custom vocabulary list
  - Human review for published content
  - Display confidence scores

**4. Cost Overruns**
- **Risk:** Unexpected API usage spikes
- **Mitigation:**
  - Rate limiting on AI assistant
  - Usage monitoring and alerts
  - Tiered access (partners only)

### Ethical Risks

**1. Over-Reliance on AI**
- **Risk:** Users replace human spiritual guidance with AI
- **Mitigation:**
  - Clear disclaimers in UI
  - Encourage community and mentorship
  - Limit session lengths

**2. Bias in Recommendations**
- **Risk:** Algorithm creates filter bubbles
- **Mitigation:**
  - Mix personalized with popular content
  - Include diverse content types
  - Allow manual exploration

---

## Next Steps

1. **Review & Approve:** Stakeholder sign-off on architecture
2. **Provision Resources:** Set up API keys, upgrade PostgreSQL
3. **Begin Week 1:** Start with semantic search infrastructure
4. **Weekly Check-ins:** Review progress and adjust timeline

---

## Appendix

### Package Dependencies

```json
{
  "dependencies": {
    "openai": "^4.67.3",
    "@ai-sdk/anthropic": "^1.0.4",
    "ai": "^4.0.0",
    "bullmq": "^5.30.0",
    "ioredis": "^5.4.1",
    "pgvector": "^0.2.0",
    "ffmpeg-static": "^5.2.0"
  }
}
```

### References

- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [BullMQ Guide](https://docs.bullmq.io/)
