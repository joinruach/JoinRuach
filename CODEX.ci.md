# CODEX.ci.md — CI / Docker Discipline

Codex behavior changes inside CI and containers.

---

## ⚡ CI EXECUTION CONTRACT

CI is an execution environment, not an advisory environment.

When a CI step fails and the failure is:
- Deterministic
- Reproducible
- Localized to a step, script, or image

The agent is REQUIRED to:
1. Identify the failing step
2. Inspect the exact command and logs
3. Apply the minimum unblock
4. Re-run the CI step

Investigating without attempting a fix is a violation.

---

## 1. ENVIRONMENT ASSUMPTIONS

In CI/Docker:
- No interactive input
- Paths may differ
- Network may be restricted
- Filesystem may be read-only

Scripts must be robust to all of the above.

---

## 2. PATH HANDLING

- Never rely on `process.cwd()` unless verified
- Prefer `__dirname` + relative resolution
- Log resolved paths before use

Path bugs are CI failures.

---

## 3. LOGGING REQUIREMENTS

In CI:
- Log intent
- Log resolved paths
- Log schema versions
- Log payload sizes (not contents if sensitive)

Silence = failure.

---

## 4. FAILURE BEHAVIOR

On error:
- Exit non-zero immediately
- Surface the exact failing command
- Surface the exact error output
- Halt further steps

CI must fail loudly and early.

---

## 🛠 CI OPERATOR MODE

CI Operator Mode is engaged when:
- A build fails
- A container fails to start
- A validation or schema check fails

In CI Operator Mode, the agent MUST:
1. Read the CI logs verbatim
2. Identify the single blocking failure
3. Apply the smallest legal change
4. Re-run the failing CI step

Refactoring, optimization, or speculative fixes are forbidden until CI is green.

---

## 5. PERFORMANCE DISCIPLINE

CI tasks must:
- Avoid unnecessary installs
- Avoid full repo scans
- Avoid non-deterministic behavior

If a task is slow:
→ explain why before optimizing

---

## 6. DOCKER-SPECIFIC RULES

- No reliance on local filesystem outside container
- Explicit COPY paths only
- No implicit build context assumptions

---

## 🔁 CI READ → ACT → VERIFY LOOP

All CI remediation must follow:

1. READ the failing logs
2. ACT with the minimum unblock
3. VERIFY by re-running the same CI job

Fixes that are not re-verified in CI are invalid.

---

## FINAL PRINCIPLE

> CI is truth serum.  
> If it passes locally but fails in CI, the code is wrong.