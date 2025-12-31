# CODEX.ci.md — CI / Docker Discipline

Codex behavior changes inside CI and containers.

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
- Exit non-zero
- Surface actionable message
- Do not continue execution

Retries must be explicit, not implicit.

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

## FINAL PRINCIPLE

> CI is truth serum.  
> If it passes locally but fails in CI, the code is wrong.