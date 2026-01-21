# Mirror Capture Skill
**Log incident to Mirror working memory**

---

## Context Loading
This skill does NOT require loading doc files — it writes structured data.

---

## Your Task
Capture an incident (error, bug, unexpected behavior) into the Mirror system for later synthesis.

---

## Incident Data Structure

```json
{
  "id": "UUID",
  "timestamp": "ISO 8601",
  "type": "error|warning|performance|security",
  "severity": "critical|high|medium|low",
  "source": {
    "file": "path/to/file.ts",
    "line": 123,
    "function": "functionName",
    "component": "ComponentName"
  },
  "error": {
    "type": "TypeError|ReferenceError|etc",
    "message": "Error message",
    "stack": "Stack trace (first 10 lines)",
    "context": "Additional context"
  },
  "environment": {
    "env": "development|production|staging",
    "user_id": "user-123 (if applicable)",
    "request_id": "req-456 (if applicable)",
    "timestamp": "when it occurred"
  },
  "impact": {
    "user_facing": true|false,
    "data_loss": true|false,
    "service_disruption": true|false,
    "affected_users": 0
  },
  "resolution": {
    "status": "open|investigating|resolved",
    "steps_taken": [],
    "time_to_resolve": "duration in minutes",
    "root_cause": "description (if known)"
  },
  "metadata": {
    "captured_by": "mirror-system",
    "tags": ["auth", "jwt", "validation"],
    "related_incidents": []
  }
}
```

---

## Process

### 1. Gather Information
Ask user (if not provided):
- What error/issue occurred?
- Where did it happen? (file, line, function)
- What was the user doing?
- What environment? (dev/staging/prod)
- How severe is the impact?

### 2. Extract Technical Details
From error message/stack trace:
- Error type
- Error message
- Relevant stack trace lines
- Context (request, user action, etc.)

### 3. Assess Impact
Determine:
- Is this user-facing?
- Does it cause data loss?
- Does it disrupt service?
- How many users affected?

### 4. Document Resolution Status
If already resolved:
- What steps were taken?
- How long did it take?
- What was the root cause?

If still open:
- Status: "investigating"
- Steps taken so far

### 5. Tag for Later Synthesis
Add relevant tags:
- Component (auth, payment, media)
- Technology (jwt, redis, postgres)
- Type (validation, performance, security)

### 6. Write to Working Memory
Save to: `mirror-data/working/incident-{UUID}.json`

---

## Model Preference
**Use Sonnet** — Structured data capture, fast execution.

---

## Example Usage
```
User: "Q mirror capture - TypeError in auth service, JWT validation failed"

You:
1. Ask for additional context:
   - Where exactly? (file/line)
   - Environment?
   - User impact?
2. Extract from error:
   - Type: TypeError
   - Message: "Cannot read property 'exp' of undefined"
   - Stack: [first 10 lines]
3. Assess impact:
   - User-facing: Yes
   - Service disruption: Yes (login blocked)
   - Affected users: ~50 (estimation)
4. Document:
   - Status: investigating
   - Steps: Added null check, deployed fix
5. Tag:
   - ["auth", "jwt", "validation", "production"]
6. Write to: mirror-data/working/incident-{UUID}.json
7. Confirm capture to user
```

---

## Output Format

After capture, report to user:

```md
## Incident Captured: [ID]

**Type:** [error|warning|etc]
**Severity:** [critical|high|medium|low]
**Location:** [file:line]
**Impact:** [description]
**Status:** [open|investigating|resolved]
**Tags:** [tag1, tag2, tag3]

**File:** `mirror-data/working/incident-{UUID}.json`

This incident will be included in the next `Q mirror synthesize` run.
```

---

## Validation Rules

Before writing:
- ✅ UUID generated
- ✅ Timestamp in ISO 8601
- ✅ All required fields present
- ✅ No PII in logs (redact user data)
- ✅ No secrets in context
- ✅ Tags are relevant and consistent

---

## Privacy & Security

**CRITICAL:** Never log:
- Passwords
- API keys
- JWT tokens (log "REDACTED" instead)
- Full user data (use user_id only)
- Credit card info
- Personal identifiable information

**DO log:**
- User IDs (anonymized)
- Request IDs
- Error types and messages
- Stack traces (sanitized)
- Timestamps
- Environment context

---

**Fast capture is critical — don't over-analyze, just document accurately.**
