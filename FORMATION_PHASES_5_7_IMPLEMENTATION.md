# Formation Guidebook Phases 5-7 Implementation

## Overview

This document describes the complete implementation of Phases 5-7 of the Formation Guidebook system:

- **Phase 5: Canon Axiom Unlocking** - Axiom prerequisites checking and unlock management
- **Phase 6: Progress Dashboard** - Comprehensive progress visualization and reflection archive
- **Phase 7: Error Handling & Polish** - Robust error handling, validation, and network resilience

## Phase 5: Canon Axiom Unlocking

### Components

#### `AxiomUnlockService.ts`
Location: `/apps/ruach-next/src/lib/formation/AxiomUnlockService.ts`

Service for managing axiom unlock logic. Provides:
- Prerequisites checking (checkpoint, phase, readiness, pace)
- Unlock status determination
- Newly unlocked axiom detection
- Axiom filtering by phase

**Key Methods:**
```typescript
// Check if an axiom's prerequisites are satisfied
checkPrerequisites(axiom, state): { satisfied: boolean; details: [...] }

// Get all unlocked axioms for a user
getUnlockedAxioms(state): AxiomUnlockResult[]

// Check a specific axiom
checkAxiomUnlock(axiomId, state): AxiomUnlockResult | null

// Get axiom details
getAxiomDetails(axiomId): CanonAxiom | null
```

**Prerequisite Types:**
- `checkpoint`: Completion of specific checkpoint
- `phase`: Progression to specific phase
- `phase_duration`: Minimum days in phase
- `readiness`: Achieving readiness level
- `pace`: Maintaining specific pace

### API Routes

#### `GET /api/axioms/list`
Get all axioms with unlock status for current user.

Response:
```json
{
  "ok": true,
  "count": 5,
  "unlockedCount": 3,
  "axioms": [
    {
      "axiomId": "axiom-awakening-identity",
      "title": "Identity in Christ",
      "isUnlocked": true,
      "prerequisites": [...],
      "message": "Axiom is now available!"
    }
  ],
  "meta": {
    "currentPhase": "awakening",
    "daysInPhase": 5,
    "checkpointsCompleted": 2
  }
}
```

#### `POST /api/axioms/check`
Check unlock status of specific axiom(s).

Request:
```json
{
  "axiomId": "axiom-awakening-identity"  // or axiomIds: [...]
}
```

Response:
```json
{
  "ok": true,
  "checked": 1,
  "results": [...],
  "summary": {
    "unlockedCount": 1,
    "lockedCount": 0,
    "notFoundCount": 0
  }
}
```

#### `GET /api/axioms/details?axiomId=...`
Get detailed information about a specific axiom.

Response:
```json
{
  "ok": true,
  "axiom": {
    "id": "axiom-awakening-identity",
    "title": "Identity in Christ",
    "content": "...",
    "phase": "awakening",
    "prerequisites": [...],
    "tags": [...],
    "unlock": {
      "isUnlocked": true,
      "prerequisites": [...]
    }
  }
}
```

### Frontend Components

#### `AxiomLibrary.tsx`
Location: `/apps/ruach-next/src/components/formation/AxiomLibrary.tsx`

Displays all axioms with lock status. Features:
- Grouped by formation phase
- Expandable prerequisite details
- Filter toggle for unlocked axioms only
- Progress bar showing unlock percentage
- Responsive grid layout

**Usage:**
```tsx
import { AxiomLibrary } from "@/components/formation/AxiomLibrary";

<AxiomLibrary
  locale={locale}
  onSelectAxiom={(axiomId) => handleSelect(axiomId)}
/>
```

#### `AxiomUnlockCelebration.tsx`
Location: `/apps/ruach-next/src/components/formation/AxiomUnlockCelebration.tsx`

Celebration animation and modal for newly unlocked axioms. Features:
- Animated sparkle effects
- Confetti particles
- Auto-close with countdown
- Deduplication hook to prevent duplicate celebrations

**Usage:**
```tsx
import {
  AxiomUnlockCelebration,
  useAxiomCelebration
} from "@/components/formation/AxiomUnlockCelebration";

const { celebratingAxiom, celebrate, closeCelebration } = useAxiomCelebration();

// Trigger celebration
celebrate("axiom-id", "Axiom Title");

{celebratingAxiom && (
  <AxiomUnlockCelebration
    axiomTitle={celebratingAxiom.title}
    axiomId={celebratingAxiom.id}
    onClose={closeCelebration}
  />
)}
```

## Phase 6: Progress Dashboard

### Dashboard Page
Location: `/apps/ruach-next/src/app/[locale]/guidebook/progress/page.tsx`

Main progress dashboard server component. Renders:
- Checkpoint progress grid
- Phase readiness indicators
- Recent activity timeline
- Reflection archive

### Components

#### `ProgressGrid.tsx`
Location: `/apps/ruach-next/src/components/formation/ProgressGrid.tsx`

Checkpoint completion visualization. Features:
- Grid view of checkpoints by phase
- Completion status indicators
- Overall progress percentage
- Days in current phase
- Links to checkpoint pages

#### `PhaseReadiness.tsx`
Location: `/apps/ruach-next/src/components/formation/PhaseReadiness.tsx`

Phase readiness indicators. Displays:
- Reflection depth progress
- Canon engagement progress
- Pace status (On Track/Speed Running/Stalled)
- Red flags if applicable
- Formation guidance

#### `ActivityTimeline.tsx`
Location: `/apps/ruach-next/src/components/formation/ActivityTimeline.tsx`

Recent formation events timeline. Shows:
- Formation entry
- Phase transitions
- Checkpoint completions
- Reflection submissions
- Axiom unlocks
- Relative timestamps (e.g., "5m ago")

#### `ReflectionArchive.tsx`
Location: `/apps/ruach-next/src/components/formation/ReflectionArchive.tsx`

Searchable reflection history. Features:
- Search by checkpoint or content
- Filter by phase
- Sort by newest/oldest
- Word count display
- Submission date
- Expandable details

## Phase 7: Error Handling & Polish

### Error Handling Utilities
Location: `/apps/ruach-next/src/lib/formation/error-handling.ts`

Comprehensive error handling system:

#### Custom Errors
```typescript
// Validation error with field and code
ValidationError(field, code, message, details?)

// Network error with retry capability
NetworkError(message, statusCode?, retryable?, details?)

// Duplicate submission error
DuplicateSubmissionError(operationId, previousTime, cooldownMs?)
```

#### Services

**DeduplicationService**
Prevents duplicate submissions with cooldown periods:
```typescript
const dedup = new DeduplicationService();

if (dedup.checkDuplicate(operationId)) {
  throw new DuplicateSubmissionError(...);
}

dedup.recordSuccess(operationId, result);
```

**FormationDataCache**
Local caching for network resilience:
```typescript
const cache = new FormationDataCache();

// Store data
cache.set("key", data, ttlMs);

// Retrieve (returns null if expired)
const data = cache.get("key");

// Check existence
if (cache.has("key")) { ... }
```

**FormationValidation**
Content and input validation:
```typescript
// Validate reflection
const { valid, errors } = FormationValidation.validateReflection(content);

// Validate dwell time
const { valid, error } = FormationValidation.validateDwellTime(actual, required);

// Validate checkpoint ID
const { valid, error } = FormationValidation.validateCheckpointId(id);
```

#### Helpers

**withRetry**
Exponential backoff retry logic:
```typescript
const result = await withRetry(
  async () => fetch("/api/axioms/list"),
  { maxAttempts: 3, initialDelayMs: 1000 }
);
```

**withOptimisticUpdate**
Optimistic UI updates with rollback:
```typescript
await withOptimisticUpdate(
  {
    previousValue: oldState,
    optimisticValue: newState,
    execute: async () => await api.update(newState)
  },
  {
    onOptimistic: (val) => setState(val),
    onSuccess: (val) => showSuccess(),
    onError: (err, prev) => setState(prev)
  }
);
```

**executeWithPartialFailureRecovery**
Batch operations with partial failure handling:
```typescript
const result = await executeWithPartialFailureRecovery(
  items,
  async (item) => await process(item),
  { stopOnFirst: false }
);

// result.successful, result.failed, result.partialSuccess
```

### Error Boundary Component
Location: `/apps/ruach-next/src/components/formation/FormationErrorBoundary.tsx`

React error boundary for formation components:
```tsx
<FormationErrorBoundary
  fallback={(error, reset) => <CustomFallback />}
  onError={(error, info) => logError(error, info)}
>
  <YourComponent />
</FormationErrorBoundary>
```

### Error Notification Component
Real-time error and notification display:
```tsx
const [error, setError] = useState(null);

<ErrorNotification
  error={error}
  onDismiss={() => setError(null)}
  type="error"
  duration={5000}
/>
```

## Integration Guide

### 1. Setup Error Handling

Wrap formation components with error boundary:
```tsx
import { FormationErrorBoundary } from "@/components/formation/FormationErrorBoundary";

<FormationErrorBoundary>
  <ProgressDashboard />
</FormationErrorBoundary>
```

### 2. Use Deduplication

Prevent duplicate checkpoint submissions:
```tsx
import { DeduplicationService } from "@/lib/formation/error-handling";

const dedup = new DeduplicationService();

const handleSubmit = async (data) => {
  const submitId = `submit-${checkpointId}-${Date.now()}`;

  if (dedup.checkDuplicate(submitId)) {
    setError("Please wait before submitting again");
    return;
  }

  try {
    const result = await submitReflection(data);
    dedup.recordSuccess(submitId, result);
  } catch (err) {
    handleError(err);
  }
};
```

### 3. Use Cache for Offline Support

```tsx
import { FormationDataCache } from "@/lib/formation/error-handling";

const cache = new FormationDataCache();

const fetchAxioms = async () => {
  try {
    const axioms = await fetch("/api/axioms/list").then(r => r.json());
    cache.set("axioms", axioms);
    return axioms;
  } catch (err) {
    const cached = cache.get("axioms");
    if (cached) return cached;
    throw err;
  }
};
```

### 4. Validate Input

```tsx
import { FormationValidation } from "@/lib/formation/error-handling";

const handleReflectionChange = (text) => {
  const { valid, errors } = FormationValidation.validateReflection(text);

  if (!valid) {
    setValidationErrors(errors);
    return;
  }

  setReflection(text);
};
```

### 5. Use Optimistic Updates

```tsx
import { withOptimisticUpdate } from "@/lib/formation/error-handling";

const handleUnlock = async (axiomId) => {
  const previous = axioms;
  const optimistic = axioms.map(a =>
    a.id === axiomId ? { ...a, isUnlocked: true } : a
  );

  await withOptimisticUpdate(
    {
      previousValue: previous,
      optimisticValue: optimistic,
      execute: async () => {
        const resp = await fetch("/api/axioms/unlock", {
          method: "POST",
          body: JSON.stringify({ axiomId })
        });
        return resp.json();
      }
    },
    {
      onOptimistic: (val) => setAxioms(val),
      onSuccess: (val) => {
        setAxioms(val);
        celebrate(axiomId);
      },
      onError: (err, prev) => {
        setAxioms(prev);
        setError(err.message);
      }
    }
  );
};
```

## Data Flow

### Axiom Unlock Flow
1. User completes checkpoint
2. Frontend emits `CheckpointCompletedEvent`
3. Formation engine processes event
4. State is rebuilt from events
5. `AxiomUnlockService` checks prerequisites
6. Newly unlocked axioms trigger `AxiomUnlockCelebration`
7. Update stored in Strapi formation events

### Dashboard Update Flow
1. Dashboard page fetches current formation state
2. `ProgressGrid` renders checkpoint status
3. `PhaseReadiness` calculates readiness metrics
4. `ActivityTimeline` displays recent events
5. `ReflectionArchive` shows reflection history
6. Real-time updates via polling or websockets (future)

## Testing Checklist

- [ ] Axiom prerequisites are correctly checked
- [ ] Newly unlocked axioms show celebration animation
- [ ] Duplicate submissions are prevented
- [ ] Validation errors are clearly displayed
- [ ] Network errors are handled gracefully
- [ ] Local cache is used when offline
- [ ] Optimistic updates rollback correctly
- [ ] Error boundary catches and displays errors
- [ ] All phases display correctly in dashboard
- [ ] Reflection archive search and filter work

## Future Enhancements

1. **Real-time Updates** - WebSocket integration for live axiom unlocks
2. **AI-Powered Insights** - Reflection analysis and formation recommendations
3. **Sharing** - Share reflection highlights with community
4. **Mobile Offline** - Service worker for full offline support
5. **Gamification** - Badges and milestones for formation progress
6. **Pastoral Dashboard** - Mentor view of formation communities
7. **Analytics** - Formation cohort analysis and insights
8. **Localization** - Full i18n for all components

## Performance Considerations

- Axiom list is paginated (50 per page)
- Reflection archive uses virtual scrolling for large lists
- Dashboard renders server-side (NextJS App Router)
- Client components use React.memo for axiom cards
- Error boundaries prevent full app crashes
- Cache invalidation every 1 hour

## Security

- All axiom operations require authentication
- Formation state is user-scoped
- Reflection archive is private
- Error messages don't expose sensitive data
- Validation prevents invalid checkpoint IDs
- Deduplication prevents replay attacks

## File Structure

```
/apps/ruach-next/src/
├── lib/formation/
│   ├── AxiomUnlockService.ts          # Axiom unlock logic
│   ├── error-handling.ts               # Error utilities
│   ├── state.ts                        # Formation state projection
│   └── routing.ts                      # Phase routing
├── components/formation/
│   ├── AxiomLibrary.tsx                # Axiom list component
│   ├── AxiomUnlockCelebration.tsx      # Celebration animation
│   ├── ProgressGrid.tsx                # Checkpoint grid
│   ├── PhaseReadiness.tsx              # Readiness indicators
│   ├── ActivityTimeline.tsx            # Event timeline
│   ├── ReflectionArchive.tsx           # Reflection search
│   └── FormationErrorBoundary.tsx      # Error boundary
└── app/[locale]/guidebook/
    ├── progress/page.tsx               # Dashboard page
    ├── enter/page.tsx
    └── awakening/[slug]/page.tsx
/app/api/axioms/
├── list/route.ts                       # GET all axioms
├── check/route.ts                      # POST check axiom
└── details/route.ts                    # GET axiom details
```

## Deployment Notes

1. Ensure `STRAPI_FORMATION_TOKEN` is set in environment
2. Database migrations for formation events table
3. Axiom content in Strapi canon-axiom collection
4. Clear analytics cache on new deployment
5. Monitor error tracking (Sentry/LogRocket)

---

**Last Updated:** February 2026
**Version:** 1.0.0
