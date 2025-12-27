# @ruach/formation

**Formation Engine** — Event-sourced spiritual discipleship system for Ruach Ministries.

---

## Overview

The Formation Engine is not a course platform. It is a **spiritual operating system** that:

- **Observes** how users engage with content
- **Responds** to spiritual maturity markers
- **Guards** against premature exposure to advanced teaching
- **Remembers** the full formation journey
- **Adapts** content depth to readiness
- **Connects** users to others at similar formation stages

---

## Core Principles

### 1. Event Sourcing as Source of Truth

Every formation interaction is captured as an immutable event:

```typescript
UserEnteredCovenant(userId, covenantType: "formation_journey")
PhaseStarted(userId, phase: "awakening")
CheckpointReached(checkpointId, timestamp)
ReflectionSubmitted(reflectionId, wordCount: 847, dwellTime: 1847s)
PauseTriggered(reason: "speed_run_detected")
```

**Why this matters:**

- Full auditability of formation journey
- State can be rebuilt from events at any time
- No data loss or revisionist history
- Enables sophisticated pattern detection

### 2. Formation State as Projection

The `FormationState` is **derived** from events, not stored as source of truth:

```typescript
const events = await getFormationEvents(userId);
const currentState = rebuildState(userId, events);
```

This means:
- State can change as logic improves (re-project from same events)
- No state corruption (events are immutable)
- Easy to add new state fields (re-derive from existing events)

### 3. Readiness Over Completion

Traditional LMS: "You completed 47% of Phase 2"

**Formation Engine:**

```typescript
{
  currentPhase: "separation",
  phaseEnteredAt: "2025-01-03",
  daysInPhase: 23,
  readiness: {
    reflectionDepth: "maturing",
    pace: "appropriate",
    canonEngagement: "emerging",
    redFlags: []
  }
}
```

### 4. AI as Advisor, Not Authority

The AI analyzes reflections and suggests actions, but **does not make decisions**:

```typescript
ReflectionAnalyzed(reflectionId, {
  depthScore: 0.73,
  recommendedAction: "unlock_next" // Suggestion only
})
```

Humans (or rules engines) decide whether to follow AI recommendations.

---

## Architecture

### Phase 1 (Awakening) - MVP Focus

The initial implementation supports:

- **Covenant entrance** (Formation Journey vs Resource Explorer)
- **Event tracking** for all user interactions
- **State projection** from events
- **Checkpoint gating** based on dwell time and reflection completion
- **Basic readiness indicators** (pace, reflection count)

Future phases add:
- AI reflection analysis
- Cohort formation
- Builder Path unlocking
- Discernment Dashboard

---

## Usage

### 1. Track Formation Events

```typescript
import { createCheckpointReachedEvent, createReflectionSubmittedEvent } from '@ruach/formation';

// User reaches a checkpoint
const event = createCheckpointReachedEvent(
  userId,
  checkpointId,
  sectionId,
  FormationPhase.Awakening
);

await saveEvent(event); // Store in database
```

### 2. Rebuild Formation State

```typescript
import { rebuildState, updateDaysInPhase } from '@ruach/formation';

// Get all events for user
const events = await getFormationEvents(userId);

// Project to current state
let state = rebuildState(userId, events);

// Update computed fields
state = updateDaysInPhase(state);

console.log(state.currentPhase); // "awakening"
console.log(state.daysInPhase); // 23
console.log(state.reflectionsSubmitted); // 4
```

### 3. Apply New Event to State

```typescript
import { applyEvent } from '@ruach/formation';

const newEvent = createReflectionSubmittedEvent(
  userId,
  reflectionId,
  checkpointId,
  ReflectionType.Text,
  432, // word count
  1847 // seconds since checkpoint reached
);

const updatedState = applyEvent(currentState, newEvent);
```

---

## Integration with Strapi

The Formation Engine is storage-agnostic, but integrates cleanly with Strapi v5:

### Content Types to Create

1. **`formation-event`** (Event store)
   - `userId` (relation to user)
   - `eventType` (enum)
   - `eventData` (json)
   - `timestamp` (datetime)

2. **`formation-snapshot`** (Cached state projections)
   - `userId` (relation to user)
   - `state` (json - serialized FormationState)
   - `lastEventId` (string - for incremental updates)
   - `updatedAt` (datetime)

3. **`formation-section`** (Content)
   - `phase` (enum)
   - `order` (integer)
   - `slug` (string)
   - `content` (richtext)
   - `checkpoints` (relation to formation-checkpoint)

4. **`formation-checkpoint`** (Gates)
   - `section` (relation)
   - `prompt` (text)
   - `minimumDwellSeconds` (integer)
   - `requiresReflection` (boolean)

---

## Event Flow

```
User Action (Frontend)
  ↓
API Endpoint (Strapi)
  ↓
Create Formation Event
  ↓
Save to Event Store (PostgreSQL)
  ↓
Emit via BullMQ Job (async)
  ↓
Worker Processes Event
  ↓
Update Cached State Snapshot
  ↓
(Optional) Trigger System Events
  - PauseTriggered
  - ContentUnlocked
  - RecommendationIssued
```

---

## Design Constraints

### What AI Can Do
- Analyze reflection depth (score 0-1)
- Detect patterns (regurgitation, wrestling, etc)
- Suggest next actions (unlock, pause, revisit)

### What AI Cannot Do
- Make final decisions on content access
- Judge spiritual maturity authoritatively
- Override human-defined gates

### What Humans Control
- Canon definitions (source of truth)
- Phase progression rules
- Checkpoint requirements
- Final approval of AI suggestions

---

## Roadmap

### Phase 1: Foundation ✅ (Current)
- Event sourcing infrastructure
- Basic state projection
- Covenant entrance
- Phase 1 (Awakening) content structure

### Phase 2: Intelligence (Next)
- AI reflection analysis
- Adaptive gating logic
- Pause protocol (speed-run detection)
- Formation gap detection

### Phase 3: Community
- Cohort formation
- Shared reflections
- Mentor signal system

### Phase 4: Multiplication
- Builder Path
- Discernment Dashboard
- Voice reflection mode

---

## Philosophy

This system is designed for **faithfulness over scale**.

It intentionally:
- Slows people down
- Locks content behind maturity
- Refuses to let people speed-run formation
- Values depth over completion metrics

**This will be smaller. But it will be real.**

---

## License

UNLICENSED - Proprietary to Ruach Ministries
