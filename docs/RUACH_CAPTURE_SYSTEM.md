# Ruach Content Capture System

**Status:** ✅ Implemented
**Date:** 2026-01-20
**Author:** Claude Code (based on blueprint from Jonathan Seals)

---

## 🎯 Overview

The Ruach Capture System is a **zero-friction content vault** that lets you dump raw ideas from anywhere (ChatGPT, voice notes, iPhone shortcuts, etc.) and automatically enriches them with AI-powered classification and metadata.

**Core Flow:**
```
Raw Text → /api/capture → Claude AI Enrichment → Strapi Raw Vault → (Optional) Refined Outputs
```

---

## 🏗️ Architecture

### 1. Raw Vault (Always Saves Everything)

**Content Type:** `ruach-snippet`

Every idea gets saved here first with:
- ✅ **Checksum-based deduplication** (never lose, never duplicate)
- ✅ **AI classification** (type, topics, summary, scripture refs)
- ✅ **Timestamped** (know when you had the idea)
- ✅ **Searchable** (find anything later)
- ✅ **Linked to refined outputs** (track what came from what)

### 2. Refined Outputs (Optional, Created Later)

Turn raw snippets into structured content:
- **`ruach-teaching`** → Teaching outlines with hooks and key points
- **`ruach-short`** → Scripts for Reels/Shorts/TikTok
- **`ruach-podcast-segment`** → Podcast talking points and scripts

All link back to the original `source_snippet`.

### 3. Topics (Auto-Created Tags)

**Content Type:** `ruach-topic`

AI suggests topics, and they're automatically created/linked. No manual tagging needed.

---

## 📦 What Was Built

### Strapi Content Types

Created 5 new content types in `ruach-ministries-backend/src/api/`:

1. **`ruach-snippet`** (Raw Vault)
   - Fields: title, body, type, status, topics, scripture_refs, checksum, capturedAt
   - Relations: refined_teachings, refined_shorts, refined_podcast_segments
   - Unique checksum for deduplication

2. **`ruach-topic`** (Tags)
   - Fields: name, slug
   - Auto-generated from AI classification

3. **`ruach-teaching`** (Teaching Outline)
   - Fields: title, hook, outline, key_points, scripture_refs, target_duration
   - Links back to source_snippet

4. **`ruach-short`** (Short-Form Script)
   - Fields: title, hook, script, beats, cta, duration_seconds
   - Links back to source_snippet

5. **`ruach-podcast-segment`** (Podcast Segment)
   - Fields: title, premise, talking_points, segment_script, estimated_minutes
   - Links back to source_snippet

### Next.js API Route

Created `/apps/ruach-next/src/app/api/capture/route.ts`

**Endpoint:** `POST /api/capture`

**Flow:**
1. Accept raw text
2. Create SHA-256 checksum
3. Check for duplicates
4. Call Claude AI for classification
5. Upsert topics
6. Save to Strapi

### Claude AI Service

Created `/apps/ruach-next/src/lib/ai/snippet-classifier.ts`

**Uses:** Claude 3.5 Sonnet (fast + accurate)

**Returns:**
```typescript
{
  title: string | null;        // Max 70 chars
  type: SnippetType;           // parable, idea, teaching, etc.
  topics: string[];            // 3-8 tags
  summary: string | null;      // 1-2 sentence summary
  scripture_refs: string[];    // Only if clearly relevant
}
```

---

## 🚀 Setup Instructions

### 1. Environment Variables

Add to your `.env` in `apps/ruach-next/`:

```bash
# Required
STRAPI_URL=http://localhost:1337
STRAPI_API_TOKEN=your_strapi_api_token_here
ANTHROPIC_API_KEY=sk-ant-your_key_here

# Already exists (make sure it's set)
NEXT_PUBLIC_STRAPI_URL=http://localhost:1337
```

### 2. Create Strapi API Token

1. Start Strapi: `cd ruach-ministries-backend && pnpm develop`
2. Go to: http://localhost:1337/admin
3. Settings → API Tokens → Create New Token
4. Name: "Ruach Capture"
5. Token type: **Full Access** (or Custom with these permissions):
   - `ruach-snippet` → create, find, findOne
   - `ruach-topic` → create, find, findOne
   - (Optional) `ruach-teaching`, `ruach-short`, `ruach-podcast-segment` → create
6. Copy the token and add to `.env` as `STRAPI_API_TOKEN`

### 3. Rebuild Strapi

After adding the new content types, rebuild Strapi:

```bash
cd ruach-ministries-backend
pnpm build
pnpm develop
```

You should now see the new content types in the admin panel.

### 4. Start Next.js App

```bash
cd apps/ruach-next
pnpm dev
```

---

## 📝 Usage Examples

### Example 1: Simple Text Capture

```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Power doesn'\''t need permission. It needs ignition. Stop waiting for someone to validate your calling. The anointing isn'\''t a license—it'\''s a fire that starts when you obey, not when others approve.",
    "source": "ChatGPT"
  }'
```

**Response:**
```json
{
  "ok": true,
  "saved": {
    "id": 1,
    "title": "Power Doesn't Need Permission",
    "type": "parable",
    "status": "raw",
    "checksum": "a1b2c3..."
  },
  "meta": {
    "title": "Power Doesn't Need Permission",
    "type": "parable",
    "topics": ["agency", "authority", "calling", "obedience"],
    "summary": "A reminder that divine calling doesn't require human approval—obedience ignites the anointing.",
    "scripture_refs": ["James 4:17", "Galatians 1:10"]
  }
}
```

### Example 2: With Hints

```bash
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Love isn'\''t a feeling. It'\''s a decision you make when the feeling is gone.",
    "title": "Love Is A Decision",
    "type": "quote",
    "topics": ["love", "commitment", "marriage"],
    "source": "VoiceNote"
  }'
```

### Example 3: Deduplication Test

Sending the exact same text twice:

```bash
# First time - creates new snippet
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{"text": "Test content here"}'

# Second time - returns existing snippet
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d '{"text": "Test content here"}'
```

**Response (second time):**
```json
{
  "ok": true,
  "deduped": true,
  "saved": { "id": 1, ... },
  "message": "This snippet already exists"
}
```

---

## 📱 Quick Capture Methods

### iPhone Shortcut (Recommended)

1. Open Shortcuts app
2. Create new shortcut:
   - **Get text from:** Share Sheet
   - **Get contents of URL:**
     - URL: `https://yoursite.com/api/capture`
     - Method: POST
     - Headers: `Content-Type: application/json`
     - Body: `{"text": [Shortcut Input], "source": "iPhone"}`
3. Add to Share Sheet

Now you can share any text → "Ruach Capture" → Done!

### Alfred Workflow (Mac)

```bash
# Add to Alfred workflow
curl -X POST http://localhost:3000/api/capture \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$1\", \"source\": \"Alfred\"}"
```

### Telegram Bot

Create a bot that forwards messages to `/api/capture`.

### Voice Notes

Use a transcription service → pipe to `/api/capture`.

---

## 🔍 Finding Captured Content

### Strapi Admin

All snippets appear in:
- **Content Manager → Ruach Snippets**

Filter by:
- Type (parable, idea, teaching, etc.)
- Status (raw, refining, ready, published)
- Topics
- Date captured

### API Queries

```bash
# Get all snippets
curl http://localhost:1337/api/ruach-snippets \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter by type
curl "http://localhost:1337/api/ruach-snippets?filters[type][$eq]=parable" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search by topic
curl "http://localhost:1337/api/ruach-snippets?filters[topics][name][$eq]=calling" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get with relations
curl "http://localhost:1337/api/ruach-snippets?populate=*" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Next Steps: Refined Outputs

Once you have 50+ raw snippets, you can create refined outputs:

### Manual Conversion (in Strapi Admin)

1. View a snippet
2. Click "Create Teaching" (or Short, Podcast Segment)
3. AI generates structured content
4. Edit and publish

### Automatic Conversion (TODO)

Add a service that:
- Monitors new snippets
- Auto-generates refined outputs based on type
- Queues for review

Example rule:
```
if snippet.type === "parable" → generate ruach-short
if snippet.type === "teaching" → generate ruach-teaching
```

---

## 🛠️ Technical Details

### Deduplication Strategy

Uses SHA-256 hash of the raw text body:
```typescript
checksum = sha256(body)
```

Before creating a new snippet, checks:
```sql
SELECT * FROM ruach_snippets WHERE checksum = ?
```

### AI Classification Prompt

```
You are a content librarian for Ruach Ministries.

Return ONLY valid JSON:
{
  "title": "Concise title (max 70 chars)",
  "type": "parable|idea|teaching|quote|outline|prayer|script|dream|warning",
  "topics": ["tag1", "tag2", "tag3"],
  "summary": "One sentence summary",
  "scripture_refs": ["Reference 1", "Reference 2"]
}
```

**Model:** Claude 3.5 Sonnet (fast + accurate)
**Temperature:** 0.3 (consistent results)
**Max Tokens:** 1024 (structured output)

### Topic Auto-Creation

For each topic in the AI response:
1. Search Strapi: `filters[name][$eq]=topic-name`
2. If exists: use existing ID
3. If not: create new topic
4. Return array of topic IDs for relation

---

## 🐛 Troubleshooting

### "STRAPI_API_TOKEN not set"

Make sure `.env` has:
```bash
STRAPI_API_TOKEN=your_token_here
```

Restart Next.js after adding:
```bash
pnpm dev
```

### "Content type ruach-snippet not found"

Rebuild Strapi:
```bash
cd ruach-ministries-backend
pnpm build
pnpm develop
```

### "Claude API error"

Check:
1. `ANTHROPIC_API_KEY` is set in `.env`
2. API key is valid (not expired)
3. Account has credits

Fallback: AI classification will return safe defaults on error.

### Duplicate detection not working

Check:
1. `checksum` field is unique in `ruach-snippet` schema
2. Database has been migrated
3. Text is identical (whitespace matters)

---

## 📊 Monitoring & Analytics

### Track Usage

```sql
-- Count snippets by type
SELECT type, COUNT(*)
FROM ruach_snippets
GROUP BY type;

-- Most used topics
SELECT name, COUNT(snippet_id)
FROM ruach_topics
JOIN ruach_snippets_topics_links ON topic_id = id
GROUP BY name
ORDER BY COUNT(*) DESC;

-- Capture rate over time
SELECT DATE(capturedAt), COUNT(*)
FROM ruach_snippets
GROUP BY DATE(capturedAt)
ORDER BY DATE(capturedAt) DESC;
```

### AI Classification Quality

Monitor:
- How often title is auto-generated vs user-provided
- Topic suggestion accuracy (manual review)
- Scripture reference relevance

---

## 🔐 Security Notes

### API Token Storage

✅ **DO:**
- Store token in `.env` (gitignored)
- Use environment variables
- Rotate tokens quarterly

❌ **DON'T:**
- Commit tokens to git
- Hardcode in source
- Share tokens in Slack/docs

### Rate Limiting (TODO)

Add to `/api/capture`:
```typescript
import { Ratelimit } from "@upstash/ratelimit";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, "1 m"),
});

const { success } = await ratelimit.limit(ip);
if (!success) throw new Error("Rate limit exceeded");
```

---

## 📈 Roadmap

### Phase 1: Core Capture (✅ Complete)
- [x] Raw vault (ruach-snippet)
- [x] AI classification
- [x] Topic auto-creation
- [x] Deduplication
- [x] iPhone shortcut support

### Phase 2: Refined Outputs (Next)
- [ ] Manual "Convert to Teaching" action in Strapi
- [ ] Auto-generate short scripts from parables
- [ ] Podcast segment generator
- [ ] Batch processing queue

### Phase 3: Search & Discovery
- [ ] Full-text search across snippets
- [ ] Topic-based recommendations
- [ ] "Similar snippets" using embeddings
- [ ] Export to Notion/Obsidian

### Phase 4: Publishing Pipeline
- [ ] One-click publish to site
- [ ] YouTube script queue
- [ ] Social media scheduler
- [ ] Email newsletter integration

---

## 🤝 Contributing

To add new snippet types:

1. Add to enum in `ruach-snippet/schema.json`:
```json
"type": {
  "enum": ["parable", "idea", "teaching", "NEW_TYPE_HERE"]
}
```

2. Update TypeScript type in `snippet-classifier.ts`:
```typescript
export type SnippetType = "parable" | "idea" | "NEW_TYPE_HERE";
```

3. Rebuild Strapi and Next.js

---

## 📞 Support

Questions? Issues?

- **Documentation:** This file
- **Strapi Admin:** http://localhost:1337/admin
- **API Reference:** http://localhost:1337/api/documentation
- **GitHub Issues:** (your repo)

---

**Built with:**
- Strapi v5
- Next.js 16
- Claude 3.5 Sonnet
- TypeScript (strict mode)
- Love and coffee ☕
