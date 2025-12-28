# Formation Guidebook - Strapi Content Types Schema

This document defines the Strapi content types needed for the Formation Guidebook system.

## Overview

The Formation Guidebook is structured as:
- **Phases** (Awakening, Deepening, Mastery)
- **Sections** (Individual teaching units within a phase)
- **Checkpoints** (Reflection prompts that gate progress)

---

## Content Types

### 1. Formation Phase (Collection Type)

**API ID:** `formation-phase`
**Display Name:** Formation Phase
**Description:** A major phase in the formation journey (e.g., Awakening)

#### Fields:

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|---------------|
| `title` | Text | ✅ | "Phase 1: Awakening" |
| `slug` | UID (from title) | ✅ | "awakening" |
| `order` | Number | ✅ | 1, 2, 3 (for sorting) |
| `description` | Rich Text | ✅ | Phase overview and goals |
| `color` | Enumeration | ✅ | blue, purple, indigo, green |
| `icon` | Text | ❌ | Emoji or icon name (🔥, 📖) |
| `estimatedDuration` | Text | ❌ | "4-6 weeks" |
| `unlockRequirements` | JSON | ❌ | Conditions to unlock (for future) |
| `sections` | Relation | ✅ | Has many `formation-section` |
| `isPublished` | Boolean | ✅ | Default: false |

#### Relations:
- **Has many** `formation-section` (via `sections` field)

---

### 2. Formation Section (Collection Type)

**API ID:** `formation-section`
**Display Name:** Formation Section
**Description:** An individual teaching section within a phase

#### Fields:

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|---------------|
| `title` | Text | ✅ | "Covenant Foundations" |
| `slug` | UID (from title) | ✅ | "covenant-foundations" |
| `order` | Number | ✅ | 1, 2, 3... (within phase) |
| `phase` | Relation | ✅ | Belongs to `formation-phase` |
| `content` | Rich Text | ✅ | Main teaching content (Markdown) |
| `video` | Media | ❌ | Optional video file |
| `videoUrl` | Text | ❌ | Or external video URL (YouTube, Vimeo) |
| `estimatedReadTime` | Number | ❌ | Minutes to read |
| `hasCheckpoint` | Boolean | ✅ | Default: false |
| `checkpoint` | Component | ❌ | `formation.checkpoint` (if hasCheckpoint) |
| `resources` | Component (Repeatable) | ❌ | `formation.resource` links |
| `isPublished` | Boolean | ✅ | Default: false |

#### Relations:
- **Belongs to** `formation-phase` (via `phase` field)

---

### 3. Formation Checkpoint (Component)

**API ID:** `formation.checkpoint`
**Display Name:** Checkpoint
**Description:** A reflection prompt that users must complete to progress

#### Fields:

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|---------------|
| `prompt` | Rich Text | ✅ | The reflection question/prompt |
| `guidingQuestions` | Rich Text | ❌ | Optional sub-questions to help |
| `minimumWordCount` | Number | ❌ | Default: 50 |
| `minimumDwellTime` | Number | ❌ | Seconds, default: 120 (2 min) |
| `exampleResponse` | Rich Text | ❌ | Optional example for guidance |

---

### 4. Formation Resource (Component)

**API ID:** `formation.resource`
**Display Name:** Resource Link
**Description:** Additional resources linked to a section

#### Fields:

| Field Name | Type | Required | Options/Notes |
|------------|------|----------|---------------|
| `title` | Text | ✅ | "Watch: Understanding Covenant" |
| `url` | Text | ✅ | External URL or internal path |
| `type` | Enumeration | ✅ | video, article, pdf, scripture |
| `description` | Text | ❌ | Brief description |

---

## API Endpoints

Once created, these content types will be available at:

```
GET /api/formation-phases
GET /api/formation-phases/:id
GET /api/formation-phases/:id?populate=sections.checkpoint

GET /api/formation-sections
GET /api/formation-sections/:id
GET /api/formation-sections/:id?populate=checkpoint,resources
```

---

## Permissions

Configure in **Settings → Roles → Public**:

### Public Role (Unauthenticated):
- ✅ `formation-phase`: find, findOne
- ✅ `formation-section`: find, findOne
- ❌ All other operations (create, update, delete)

### Authenticated Role:
- ✅ `formation-phase`: find, findOne
- ✅ `formation-section`: find, findOne
- ❌ All other operations (create, update, delete)

### Admin:
- ✅ All operations

---

## Sample Content Structure

### Example Phase:

```json
{
  "title": "Phase 1: Awakening",
  "slug": "awakening",
  "order": 1,
  "description": "An introduction to covenant thinking...",
  "color": "blue",
  "icon": "🔥",
  "estimatedDuration": "4-6 weeks",
  "isPublished": true,
  "sections": [
    { "id": 1 },
    { "id": 2 },
    { "id": 3 }
  ]
}
```

### Example Section:

```json
{
  "title": "Covenant Foundations",
  "slug": "covenant-foundations",
  "order": 1,
  "phase": { "id": 1 },
  "content": "# Covenant Foundations\n\nIn this section...",
  "videoUrl": "https://www.youtube.com/watch?v=...",
  "estimatedReadTime": 15,
  "hasCheckpoint": true,
  "checkpoint": {
    "prompt": "Reflect on how covenant thinking differs from modern approaches...",
    "minimumWordCount": 100,
    "minimumDwellTime": 180,
    "guidingQuestions": "- What is covenant?\n- How does it apply today?"
  },
  "isPublished": true
}
```

---

## Implementation Steps

### 1. Create Content Types in Strapi

1. Go to **Content-Type Builder**
2. Click **"Create new collection type"**
3. Create `formation-phase` with fields above
4. Create `formation-section` with fields above
5. Create components:
   - `formation.checkpoint`
   - `formation.resource`

### 2. Set Up Relations

- In `formation-section`, add relation:
  - **Many-to-One** with `formation-phase`
  - Field name: `phase`
  - Display name: "Phase"

- In `formation-phase`, the relation is auto-created:
  - `sections` (one-to-many)

### 3. Configure Permissions

Settings → Roles → Public:
- Enable `find` and `findOne` for both content types

### 4. Add Sample Content

1. Create Phase 1: Awakening
2. Create 3-5 sections within it
3. Add checkpoints to at least one section
4. Publish all content

### 5. Test API

```bash
curl https://api.joinruach.org/api/formation-phases?populate=*
```

---

## Next.js Integration

Once Strapi schema is ready, update Next.js:

### Fetch Phases:

```typescript
// lib/strapi/formation.ts
export async function getFormationPhases() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_STRAPI_URL}/api/formation-phases?populate=sections&sort=order:asc`,
    { next: { revalidate: 3600 } } // Cache 1 hour
  );
  return res.json();
}
```

### Update Guidebook Page:

```typescript
// app/[locale]/guidebook/page.tsx
import { getFormationPhases } from "@/lib/strapi/formation";

export default async function GuidebookPage() {
  const { data: phases } = await getFormationPhases();

  // Render phases dynamically
}
```

---

## Future Enhancements

### Phase 2: Add these fields/features

1. **Quizzes** - Multiple choice assessments
2. **Certifications** - Completion certificates
3. **Prerequisites** - Lock phases behind completion
4. **Localization** - Multi-language support
5. **Versioning** - Track content changes over time
6. **Analytics** - Track which sections are most engaging

---

## Questions?

- How should unlocking work? (Complete all checkpoints? Or just read?)
- Should videos be hosted on Strapi or external (YouTube)?
- Do you want section prerequisites within a phase?
- Should there be a "summary" or "review" section per phase?

---

**Ready to implement!** Let me know when you've created these in Strapi, and I'll update the Next.js app to fetch from the API.
