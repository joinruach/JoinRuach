# Covenant Entrance (`/guidebook/enter`)

**The threshold moment where consent becomes architecture.**

---

## Purpose

This is not a signup form. This is a covenant.

Users choose between two paths:

1. **Formation Journey** - Full engagement with paced formation, reflection checkpoints, and adaptive content
2. **Resource Explorer** - Free browsing without formation tracking or accountability

---

## Design Principles

### 1. Clarity Over Persuasion

The copy is direct, not manipulative. It clearly states:
- Who this is for
- Who this is NOT for
- What each path entails

No urgency tactics. No FOMO. No pressure.

### 2. Informed Consent

Users must:
- Choose a path (radio selection)
- Acknowledge terms (checkbox)
- Understand consequences (explained in plain language)

The acknowledgment explicitly states:
> "Formation requires submission to Scripture and the Canon, not just information consumption."

### 3. Structural Restraint

- No images or visual distractions
- No timers or countdown clocks
- No "limited spots available"
- No social proof widgets

Just truth, choice, and commitment.

---

## Event Emission

When the form is submitted, the system emits:

```typescript
CovenantEnteredEvent {
  id: "uuid",
  userId: "user-id-or-anonymous",
  timestamp: Date,
  eventType: FormationEventType.CovenantEntered,
  data: {
    covenantType: "formation_journey" | "resource_explorer",
    acknowledgedTerms: true
  }
}
```

This event is:
- Immutable (never modified)
- Stored in event store (currently logged, will be Strapi)
- The **foundation** for all subsequent formation logic

---

## Routing Logic

After covenant entry:

| Covenant Type | Redirect To | Reason |
|---------------|-------------|--------|
| **Formation Journey** | `/guidebook/awakening` | Start at Phase 1 (gated progression) |
| **Resource Explorer** | `/guidebook` | Full content access (no gates) |

---

## Future Enhancements

### Phase 2: Covenant Status Check
- Prevent re-entry if user has already chosen
- Redirect users based on existing covenant
- Allow covenant type change (with explicit confirmation)

### Phase 3: Authentication Integration
- Require login for Formation Journey (accountability)
- Allow anonymous Resource Explorer access
- Sync covenant status across devices

### Phase 4: Covenant Version Tracking
- Track covenant version in event
- Notify users of covenant updates
- Require re-acknowledgment on major changes

---

## Files

```
/guidebook/enter/
├── page.tsx              # Server Component (metadata, layout)
├── CovenantEntrance.tsx  # Client Component (form UI)
├── actions.ts            # Server Actions (event emission, validation)
└── README.md             # This file
```

---

## Integration Points

### Strapi Content Type (Future)

Once `formation-event` content type exists in Strapi:

```typescript
// Replace console.log in actions.ts with:
await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/formation-events`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session?.strapiJwt}`,
  },
  body: JSON.stringify({ data: event }),
});
```

### Formation State Check

Add covenant status check to guidebook root:

```typescript
// In /guidebook/page.tsx
const covenantStatus = await getUserCovenantStatus(userId);

if (!covenantStatus.hasEntered) {
  redirect('/guidebook/enter');
}
```

---

## Philosophy

This page exists to **protect users from themselves**.

It:
- Prevents spiritual speed-running by requiring explicit consent to pacing
- Guards against superficial engagement by explaining depth requirements
- Honors user autonomy by offering a non-formation path

**The covenant is the load-bearing wall of the entire system.**

Without it, every checkpoint feels like friction.
With it, every checkpoint feels like faithfulness.

---

## Testing

To test locally:

```bash
cd apps/ruach-next
pnpm dev
```

Navigate to: `http://localhost:3000/en/guidebook/enter`

**Expected behavior:**
1. Form renders with two radio options
2. Checkbox required before submit
3. Clicking "Enter the Guidebook" emits event (check console)
4. Redirects to `/guidebook/awakening` (Formation) or `/guidebook` (Explorer)

---

**"This is not a transaction. This is a covenant. Enter accordingly."**
