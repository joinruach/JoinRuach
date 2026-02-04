# Phase 9: Sync API - Frontend Integration Guide

This guide shows how to integrate the Phase 9 Sync API into your frontend application.

## API Endpoints

### 1. Compute Sync Offsets

**Endpoint:** `POST /api/recording-sessions/:id/sync/compute`

**Purpose:** Trigger automatic audio correlation sync for a session

**Request:**
```typescript
interface ComputeSyncRequest {
  masterCamera?: string; // Optional, defaults to session.anchorAngle or 'A'
}
```

**Response:**
```typescript
interface ComputeSyncResponse {
  success: boolean;
  data: {
    sessionId: string;
    masterCamera: string;
    offsets: Record<string, number>; // { "A": 0, "B": 1830, "C": -420 }
    confidence: Record<string, number>; // { "A": 100, "B": 12.5, "C": 8.2 }
    results: Array<{
      camera: string;
      offsetMs: number;
      confidence: number;
      classification: 'looks-good' | 'review-suggested' | 'needs-manual-nudge';
    }>;
    allReliable: boolean; // true if all cameras have confidence >= 5
  };
}
```

**Example:**
```typescript
const response = await fetch('/api/recording-sessions/123/sync/compute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ masterCamera: 'A' }),
});

const { data } = await response.json();

// Check if sync is reliable
if (data.allReliable) {
  console.log('All cameras synced with high confidence!');
} else {
  console.log('Some cameras need review:', data.results);
}
```

---

### 2. Get Sync Results

**Endpoint:** `GET /api/recording-sessions/:id/sync`

**Purpose:** Retrieve sync offsets and confidence scores for a session

**Response:**
```typescript
interface GetSyncResponse {
  success: boolean;
  data: {
    sessionId: string;
    masterCamera: string;
    offsets: Record<string, number>;
    confidence: Record<string, number>;
    classification: Record<string, 'looks-good' | 'review-suggested' | 'needs-manual-nudge'>;
    operatorStatus: 'pending' | 'approved' | 'corrected';
    status: string; // Session workflow status
  };
}
```

**Example:**
```typescript
const response = await fetch('/api/recording-sessions/123/sync');
const { data } = await response.json();

// Display classification badges in UI
Object.entries(data.classification).forEach(([camera, classification]) => {
  const badge = {
    'looks-good': { color: 'green', label: '✓ Looks Good' },
    'review-suggested': { color: 'yellow', label: '⚠ Review Suggested' },
    'needs-manual-nudge': { color: 'red', label: '✗ Needs Manual Nudge' },
  }[classification];

  console.log(`Camera ${camera}: ${badge.label}`);
});
```

---

### 3. Approve Sync Offsets

**Endpoint:** `POST /api/recording-sessions/:id/sync/approve`

**Purpose:** Operator confirms sync offsets are correct

**Request:**
```typescript
interface ApproveSyncRequest {
  approvedBy?: string; // User ID
  notes?: string; // Optional approval notes
}
```

**Response:**
```typescript
interface ApproveSyncResponse {
  success: boolean;
  message: string;
  data: {
    // Same as GetSyncResponse
    operatorStatus: 'approved';
    status: 'synced';
  };
}
```

**Example:**
```typescript
const response = await fetch('/api/recording-sessions/123/sync/approve', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    approvedBy: currentUser.id,
    notes: 'All cameras synced correctly, tested with preview',
  }),
});

if (response.ok) {
  console.log('Sync approved! Session is ready for editing.');
}
```

---

### 4. Manually Correct Sync Offsets

**Endpoint:** `POST /api/recording-sessions/:id/sync/correct`

**Purpose:** Operator manually adjusts sync offsets

**Request:**
```typescript
interface CorrectSyncRequest {
  offsets: Record<string, number>; // Required: { "A": 0, "B": 1850, "C": -400 }
  correctedBy?: string; // User ID
  notes?: string; // Optional correction notes
}
```

**Response:**
```typescript
interface CorrectSyncResponse {
  success: boolean;
  message: string;
  data: {
    // Same as GetSyncResponse
    operatorStatus: 'corrected';
    status: 'synced';
    offsets: Record<string, number>; // Updated offsets
  };
}
```

**Example:**
```typescript
// Get original offsets
const { data: syncData } = await fetch('/api/recording-sessions/123/sync').then(r => r.json());

// Apply manual adjustment (e.g., +50ms to camera B)
const correctedOffsets = {
  ...syncData.offsets,
  B: syncData.offsets.B + 50,
};

const response = await fetch('/api/recording-sessions/123/sync/correct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    offsets: correctedOffsets,
    correctedBy: currentUser.id,
    notes: 'Camera B needed +50ms adjustment after waveform review',
  }),
});

if (response.ok) {
  console.log('Sync corrected! Original offsets preserved in metadata.');
}
```

---

## Workflow States

The sync workflow follows this state machine:

```
draft
  ↓
syncing (POST /sync/compute starts)
  ↓
needs-review (POST /sync/compute completes)
  ↓
synced (POST /sync/approve OR /sync/correct)
```

**Operator Status:**
- `pending` - Sync computed, awaiting operator review
- `approved` - Operator confirmed offsets are correct
- `corrected` - Operator manually adjusted offsets

---

## Frontend Helper Functions

### React Hook Example

```typescript
import { useState, useCallback } from 'react';

interface SyncResult {
  offsets: Record<string, number>;
  confidence: Record<string, number>;
  classification: Record<string, string>;
  operatorStatus: string;
}

export function useSessionSync(sessionId: string) {
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeSync = useCallback(async (masterCamera?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recording-sessions/${sessionId}/sync/compute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterCamera }),
      });

      if (!response.ok) throw new Error('Failed to compute sync');

      const { data } = await response.json();
      setSyncResult(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const approveSync = useCallback(async (notes?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recording-sessions/${sessionId}/sync/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) throw new Error('Failed to approve sync');

      const { data } = await response.json();
      setSyncResult(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const correctSync = useCallback(async (
    offsets: Record<string, number>,
    notes?: string
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/recording-sessions/${sessionId}/sync/correct`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offsets, notes }),
      });

      if (!response.ok) throw new Error('Failed to correct sync');

      const { data } = await response.json();
      setSyncResult(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  return {
    syncResult,
    isLoading,
    error,
    computeSync,
    approveSync,
    correctSync,
  };
}
```

### Usage in Component

```typescript
function SyncReviewPanel({ sessionId }: { sessionId: string }) {
  const { syncResult, isLoading, computeSync, approveSync, correctSync } = useSessionSync(sessionId);

  const handleComputeSync = async () => {
    await computeSync('A');
  };

  const handleApprove = async () => {
    await approveSync('Verified with preview');
  };

  const handleCorrect = async () => {
    const correctedOffsets = {
      ...syncResult!.offsets,
      B: syncResult!.offsets.B + 50, // Add 50ms
    };
    await correctSync(correctedOffsets, 'Manual adjustment after review');
  };

  if (isLoading) return <div>Computing sync...</div>;

  return (
    <div>
      {!syncResult ? (
        <button onClick={handleComputeSync}>Compute Sync</button>
      ) : (
        <div>
          <h3>Sync Results</h3>
          {Object.entries(syncResult.classification).map(([camera, classification]) => (
            <div key={camera}>
              Camera {camera}: {classification}
              (offset: {syncResult.offsets[camera]}ms,
              confidence: {syncResult.confidence[camera].toFixed(2)})
            </div>
          ))}

          {syncResult.operatorStatus === 'pending' && (
            <div>
              <button onClick={handleApprove}>✓ Approve</button>
              <button onClick={handleCorrect}>✎ Correct</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

## Confidence Classification Guide

| Classification | Score Range | Meaning | Action |
|----------------|-------------|---------|--------|
| **looks-good** | ≥ 10 | High confidence, reliable sync | One-click approve |
| **review-suggested** | 5-10 | Medium confidence | Visual waveform review recommended |
| **needs-manual-nudge** | < 5 | Low confidence | Manual offset adjustment required |

---

## Error Handling

### Common Errors

**400 Bad Request** - Invalid request body
```json
{
  "error": "Invalid request",
  "details": {
    "offsets": ["At least one camera offset must be provided"]
  }
}
```

**404 Not Found** - Session or sync result not found
```json
{
  "error": "Sync results not found"
}
```

**500 Internal Server Error** - Sync computation failed
```json
{
  "error": "Sync computation failed"
}
```

### Error Handling Example

```typescript
try {
  await computeSync();
} catch (error) {
  if (error.response?.status === 404) {
    alert('Session not found. Please refresh and try again.');
  } else if (error.response?.status === 500) {
    alert('Sync failed. Check that audio-offset-finder is installed.');
  } else {
    alert('An unexpected error occurred.');
  }
}
```

---

## Testing Checklist

Before integrating into production:

- [ ] Test golden path: compute → high confidence → approve → synced
- [ ] Test low confidence: compute → low confidence → manual correct → synced
- [ ] Test error handling: missing session, network failures, validation errors
- [ ] Test UI responsiveness during long-running sync operations
- [ ] Verify original offsets preserved in metadata after correction
- [ ] Test with real 3-camera footage (different start times, sample rates)

---

## Next Steps

After successful sync:
- Session status becomes `synced`
- Offsets are ready for Phase 10/11 (EDL generation, Remotion rendering)
- Preview proxies available for operator review at `asset.r2_proxy_url`
