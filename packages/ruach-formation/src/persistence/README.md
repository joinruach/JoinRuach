# Formation Persistence Layer

**Anchoring formation in durable storage.**

---

## Purpose

The persistence layer handles writing and reading formation events, reflections, and journey state to/from the Strapi v5 backend.

**Design Principles:**
- Events are append-only (never updated or deleted)
- Reflections are immutable once created
- Journey state is updated, not recreated
- All operations are idempotent where possible

---

## Strapi Content Types

### 1. `formation-event` (Event Store)

**Collection:** `formation_events`
**Purpose:** Append-only event log for all formation interactions

**Schema:**
- `eventId` (string, unique) - Event UUID
- `eventType` (enum) - Type of event (17 types)
- `eventData` (json) - Event-specific data
- `eventMetadata` (json) - Optional context (IP, user agent, etc.)
- `timestamp` (datetime) - When event occurred
- `user` (relation) - Authenticated user (if logged in)
- `anonymousUserId` (string) - For anonymous users

**Events Never Modified:** Once created, events are immutable. No updates or deletes.

---

### 2. `formation-reflection` (User Reflections)

**Collection:** `formation_reflections`
**Purpose:** Store user reflections submitted at checkpoints

**Schema:**
- `reflectionId` (string, unique) - Reflection UUID
- `checkpointId` (string) - Which checkpoint
- `sectionId` (string) - Which section
- `phase` (enum) - Formation phase
- `reflectionType` (enum) - text | voice
- `content` (text) - Reflection text (or transcription)
- `audioUrl` (string, optional) - If voice reflection
- `wordCount` (integer) - Word count
- `submittedAt` (datetime) - Submission time
- `timeSinceCheckpointReached` (integer) - Seconds since checkpoint appeared
- `depthScore` (decimal, optional) - AI analysis score (0-1)
- `indicators` (json, optional) - AI analysis results
- `user` (relation) - Authenticated user
- `anonymousUserId` (string) - For anonymous users

---

### 3. `formation-journey` (User State Pointer)

**Collection:** `formation_journeys`
**Purpose:** Track user's current formation state (one per user)

**Schema:**
- `covenantType` (enum) - formation_journey | resource_explorer
- `currentPhase` (enum) - awakening | separation | discernment | commission | stewardship
- `phaseEnteredAt` (datetime) - When current phase started
- `covenantEnteredAt` (datetime) - When covenant was entered
- `lastActivityAt` (datetime) - Last formation activity
- `sectionsViewed` (json) - Array of section IDs
- `checkpointsReached` (json) - Array of checkpoint IDs
- `checkpointsCompleted` (json) - Array of checkpoint IDs
- `reflectionsSubmitted` (integer) - Total reflection count
- `unlockedCanonAxioms` (json) - Array of unlocked canon IDs
- `unlockedCourses` (json) - Array of unlocked course IDs
- `unlockedCannonReleases` (json) - Array of unlocked cannon IDs
- `user` (relation, oneToOne) - Authenticated user
- `anonymousUserId` (string, unique) - For anonymous users

**Constraint:** One journey per user (enforced by oneToOne relation or unique anonymousUserId)

---

## Client Usage

### Initialize Client

```typescript
import { initializeFormationClient } from '@ruach/formation';

const client = initializeFormationClient({
  strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL!,
  strapiToken: session?.strapiJwt, // Optional, for authenticated requests
});
```

### Write Event

```typescript
import { createCovenantEnteredEvent } from '@ruach/formation';

const event = createCovenantEnteredEvent(userId, covenantType, true);

await client.writeEvent(event, userId, userIdNumber);
```

### Write Reflection

```typescript
const reflection: Reflection = {
  id: 'reflection-123',
  userId: 'user-456',
  checkpointId: 'awakening-checkpoint-1',
  type: ReflectionType.Text,
  content: '...',
  wordCount: 147,
  submittedAt: new Date(),
  timeSinceCheckpointReached: 312,
};

await client.writeReflection(
  reflection,
  FormationPhase.Awakening,
  'awakening-1',
  userId,
  userIdNumber
);
```

### Get Events

```typescript
const events = await client.getEvents(userId, userIdNumber);

// Rebuild state from events
const state = rebuildState(userId, events);
```

### Upsert Journey

```typescript
await client.upsertJourney(
  {
    covenantType: CovenantType.FormationJourney,
    currentPhase: FormationPhase.Awakening,
    phaseEnteredAt: new Date().toISOString(),
    covenantEnteredAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
    sectionsViewed: [],
    checkpointsReached: [],
    checkpointsCompleted: [],
    reflectionsSubmitted: 0,
    unlockedCanonAxioms: [],
    unlockedCourses: [],
    unlockedCannonReleases: [],
  },
  userId,
  userIdNumber
);
```

---

## Integration Pattern

### Server Action (Next.js)

```typescript
"use server";

import { auth } from "@/lib/auth";
import {
  createCovenantEnteredEvent,
  initializeFormationClient,
} from "@ruach/formation";

export async function enterCovenant(formData: FormData) {
  // 1. Get user session
  const session = await auth();
  const userId = session?.user?.id || "anonymous";
  const userIdNumber = session?.user?.id ? Number(session.user.id) : undefined;

  // 2. Initialize client
  const client = initializeFormationClient({
    strapiUrl: process.env.NEXT_PUBLIC_STRAPI_URL!,
    strapiToken: session?.strapiJwt,
  });

  // 3. Create event
  const event = createCovenantEnteredEvent(userId, covenantType, true);

  // 4. Write event to Strapi
  await client.writeEvent(event, userId, userIdNumber);

  // 5. Create journey
  await client.upsertJourney(
    {
      covenantType,
      currentPhase: FormationPhase.Awakening,
      phaseEnteredAt: new Date().toISOString(),
      covenantEnteredAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
      // ...
    },
    userId,
    userIdNumber
  );
}
```

---

## Authentication Handling

The client supports both:
1. **Authenticated users** - Uses `user` relation (Strapi user ID)
2. **Anonymous users** - Uses `anonymousUserId` (e.g., session ID or device ID)

**Best Practice:**
- Always pass both `userId` (string) and `userIdNumber` (number | undefined)
- Client will use `user` relation if `userIdNumber` is provided
- Otherwise, uses `anonymousUserId`

---

## Error Handling

All methods throw errors on failure:

```typescript
try {
  await client.writeEvent(event, userId);
} catch (error) {
  console.error('Failed to write event:', error);
  // Handle error (retry, log, notify user)
}
```

**Common Errors:**
- `Failed to write formation event` - Network or Strapi error
- `Failed to fetch formation events` - Query error
- `Formation client not initialized` - Forgot to call `initializeFormationClient()`

---

## Performance Considerations

1. **Event Store Growth**
   - Events are append-only
   - Consider archiving or partitioning old events (>1 year)
   - Query with `pagination[limit]` for large event histories

2. **Journey Updates**
   - Journey is updated frequently (every section view)
   - Consider debouncing rapid updates (client-side)
   - Use `lastActivityAt` to track engagement

3. **Reflection Storage**
   - Reflections can be large (unlimited text)
   - Consider truncating very long reflections (>5000 words)
   - Audio URLs stored separately (not in Strapi directly)

---

## Roadmap

### Phase 1 (Current): Write + Read
- ✅ Event store (write)
- ✅ Reflection store (write)
- ✅ Journey upsert (create/update)
- ✅ Query events by user
- ✅ Query reflections by user
- ✅ Query journey by user

### Phase 2: State Projection
- Rebuild `FormationState` from events
- Cache state snapshots (Redis)
- Incremental state updates (from last event)
- Readiness computation from events

### Phase 3: Analytics & Insights
- Formation pace analysis
- Reflection depth trends
- Checkpoint completion rates
- Phase transition patterns
- Mentor dashboard views

---

## Schema Locations

**Strapi Schemas:**
```
ruach-ministries-backend/src/api/
├── formation-event/content-types/formation-event/schema.json
├── formation-reflection/content-types/formation-reflection/schema.json
└── formation-journey/content-types/formation-journey/schema.json
```

**Client Code:**
```
packages/ruach-formation/src/persistence/
├── strapi.ts         # Client implementation
├── index.ts          # Exports
└── README.md         # This file
```

---

**Formation requires memory. Events are that memory.**
