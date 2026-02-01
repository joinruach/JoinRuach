# Formation Phases 5-7 Quick Start Guide

## What Was Built

Three complete phases implementing axiom management, progress tracking, and error handling.

## Quick Integration

### 1. Add Axiom Library to Your Page
```tsx
import { AxiomLibrary } from "@/components/formation/AxiomLibrary";

export default function AxiomsPage({ params }) {
  return (
    <div>
      <AxiomLibrary 
        locale={params.locale}
        onSelectAxiom={(axiomId) => console.log(axiomId)}
      />
    </div>
  );
}
```

### 2. Display Progress Dashboard
```tsx
// Already created at: /app/[locale]/guidebook/progress/page.tsx
// Just navigate to: /en/guidebook/progress
```

### 3. Add Axiom Celebration
```tsx
import { 
  AxiomUnlockCelebration, 
  useAxiomCelebration 
} from "@/components/formation/AxiomUnlockCelebration";

export default function MyComponent() {
  const { celebratingAxiom, celebrate, closeCelebration } = useAxiomCelebration();

  // Trigger celebration when axiom unlocks
  const handleUnlock = () => {
    celebrate("axiom-id", "Axiom Title");
  };

  return (
    <>
      {celebratingAxiom && (
        <AxiomUnlockCelebration
          axiomTitle={celebratingAxiom.title}
          axiomId={celebratingAxiom.id}
          onClose={closeCelebration}
        />
      )}
    </>
  );
}
```

### 4. Use Error Boundary
```tsx
import { FormationErrorBoundary } from "@/components/formation/FormationErrorBoundary";

<FormationErrorBoundary>
  <YourComponent />
</FormationErrorBoundary>
```

### 5. Use Deduplication Service
```tsx
import { DeduplicationService } from "@/lib/formation/error-handling";

const dedup = new DeduplicationService();

const handleSubmit = async () => {
  const submitId = `submit-${checkpointId}`;
  
  if (dedup.checkDuplicate(submitId)) {
    alert("Please wait before submitting again");
    return;
  }

  try {
    const result = await submitCheckpoint();
    dedup.recordSuccess(submitId, result);
  } catch (err) {
    handleError(err);
  }
};
```

## API Endpoints

### GET /api/axioms/list
Get all axioms with unlock status
```bash
curl http://localhost:3000/api/axioms/list \
  -H "Authorization: Bearer $TOKEN"
```

### POST /api/axioms/check
Check specific axiom(s)
```bash
curl -X POST http://localhost:3000/api/axioms/check \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"axiomIds": ["axiom-awakening-identity"]}'
```

### GET /api/axioms/details
Get axiom details
```bash
curl http://localhost:3000/api/axioms/details?axiomId=axiom-awakening-identity \
  -H "Authorization: Bearer $TOKEN"
```

## Key Classes & Services

### AxiomUnlockService
```typescript
// Check if prerequisites are met
AxiomUnlockService.checkAxiomUnlock(axiomId, state)

// Get all axioms
AxiomUnlockService.getAllAxiomsWithStatus(state)

// Get newly unlocked
AxiomUnlockService.getNewlyUnlockedAxioms(current, previous)
```

### Error Handling
```typescript
import {
  DeduplicationService,
  FormationDataCache,
  FormationValidation,
  withRetry,
  withOptimisticUpdate
} from "@/lib/formation/error-handling";

// Prevent duplicates
const dedup = new DeduplicationService();

// Cache data locally
const cache = new FormationDataCache();

// Validate content
FormationValidation.validateReflection(text, 50)

// Retry with backoff
await withRetry(operation, { maxAttempts: 3 })

// Optimistic updates
await withOptimisticUpdate(update, callbacks)
```

## Component API

### AxiomLibrary
Props:
- `locale: string` - Current locale
- `onSelectAxiom?: (axiomId: string) => void` - Selection callback

### AxiomUnlockCelebration
Props:
- `axiomTitle: string` - Axiom title
- `axiomId: string` - Axiom ID
- `onClose: () => void` - Close callback
- `autoCloseDuration?: number` - Auto-close in ms (default 5000)

### PhaseReadiness
Props:
- `state: FormationState` - Current formation state

### ProgressGrid
Props:
- `state: FormationState` - Current formation state
- `locale: string` - Current locale

### ActivityTimeline
Props:
- `state: FormationState` - Current formation state

### ReflectionArchive
Props:
- `state: FormationState` - Current formation state
- `locale: string` - Current locale

## Validation

Validate reflection before submission:
```typescript
const { valid, errors } = FormationValidation.validateReflection(
  content, 
  50 // minimum words
);

if (!valid) {
  errors.forEach(err => {
    console.error(`${err.field}: ${err.code} - ${err.message}`);
  });
}
```

## Offline Support

Cache data for offline access:
```typescript
const cache = new FormationDataCache();

// Save response
cache.set("axioms", axiomData, 3600000); // 1 hour TTL

// Use cached data if offline
const data = cache.get("axioms") || fallbackData;
```

## Testing

Run integration tests:
```bash
npm run test -- lib/formation/__tests__/integration.test.ts
```

## Troubleshooting

### Axiom not unlocking?
1. Check prerequisites: `AxiomUnlockService.checkPrerequisites(axiom, state)`
2. Verify checkpoint completion: `state.checkpointsCompleted`
3. Check phase: `state.currentPhase`

### Dashboard not loading?
1. Verify authentication
2. Check formation state: `await getCurrentFormationState()`
3. Check error boundary logs

### Duplicate submissions not prevented?
1. Ensure dedup service is initialized
2. Unique operation ID format: `submit-${id}-${timestamp}`
3. Default cooldown is 5 seconds

### Error boundary not catching errors?
1. Only catches render errors, not event handlers
2. For async, use `useFormationErrorHandler` hook
3. Wrap promise in error boundary manually

## Environment Setup

```bash
# Required
STRAPI_FORMATION_TOKEN=your_token

# Optional
NEXT_PUBLIC_STRAPI_URL=https://strapi.example.com
```

## Files Reference

### Core
- `lib/formation/AxiomUnlockService.ts` - Axiom logic
- `lib/formation/error-handling.ts` - Error utilities
- `app/[locale]/guidebook/progress/page.tsx` - Dashboard

### Components
- `components/formation/AxiomLibrary.tsx`
- `components/formation/AxiomUnlockCelebration.tsx`
- `components/formation/ProgressGrid.tsx`
- `components/formation/PhaseReadiness.tsx`
- `components/formation/ActivityTimeline.tsx`
- `components/formation/ReflectionArchive.tsx`
- `components/formation/FormationErrorBoundary.tsx`

### API Routes
- `app/api/axioms/list/route.ts`
- `app/api/axioms/check/route.ts`
- `app/api/axioms/details/route.ts`

## Documentation

- `FORMATION_PHASES_5_7_IMPLEMENTATION.md` - Complete guide
- `IMPLEMENTATION_SUMMARY.md` - Full summary
- `PHASES_5_7_QUICKSTART.md` - This file

## Support

See `FORMATION_PHASES_5_7_IMPLEMENTATION.md` for:
- Complete API documentation
- Integration patterns
- Data flow diagrams
- Testing checklist
- Future enhancements

---

**Quick Start Version 1.0**
**Last Updated: February 2026**
