# CODEX.schemas.md — Schema Is Law

In this repository, **schemas are authoritative truth**.

---

## 1. GENERAL RULE

If code and schema disagree:
→ CODE IS WRONG

Codex must never “adjust” schema meaning.

---

## 2. STRAPI SCHEMA RULES

- `schema.json` is the source of truth
- Field names must match exactly
- Required fields must be present
- Enums must be validated against schema
- Relations must follow Strapi shape exactly

Never:
- Infer optional fields
- Add undocumented keys
- Ignore private flags
- Assume defaults

---

## 3. PAYLOAD VALIDATION REQUIREMENTS

Before POST / PUT:
- Validate keys against schema
- Reject unknown keys
- Validate enum values
- Validate relation structure

Preferred failure:
```text
Invalid payload:
Unknown keys: ["set"]
Expected keys: [...]
```

---

## 4. SCHEMA LOADING RULES

- Load schema from filesystem
- Do not hardcode field lists
- Do not duplicate schema in code
- Log schema version/hash if helpful

---

5. SCHEMA DRIFT DETECTION

If production schema ≠ local schema:
	•	Stop execution
	•	Surface diff
	•	Do NOT auto-merge

Schema drift is a blocking error, not a warning.

---

6. CANON / CONTENT SCHEMAS

Canon schemas must:
	•	Preserve source authority
	•	Preserve ordering where meaningful
	•	Never merge Scripture with commentary
	•	Never collapse verses or nodes

Lossy transforms are forbidden.

---

FINAL PRINCIPLE

Schema is not guidance.
Schema is law.
---

# 📄 `CODEX.ai.md`  
### AI + Canon Ingestion Constraints

```md
# CODEX.ai.md — AI Discipline & Canon Integrity

AI systems in this repo are **bounded assistants**, not authorities.

---

## 1. AUTHORITY HIERARCHY

All AI reasoning must respect declared authority:

1. Scripture (primary)
2. Canon texts
3. Ruach teachings
4. Commentary / notes

AI must NEVER:
- Elevate lower authority over higher
- Merge layers without labeling
- Invent doctrinal conclusions

---

## 2. CANON INGESTION RULES

Canon ingestion must:
- Be deterministic
- Preserve original text
- Preserve source attribution
- Preserve ordering and IDs

Never:
- Rewrite text
- Normalize theology
- Collapse distinct verses/nodes
- Add interpretation

---

## 3. AI PROMPT BOUNDARIES

AI writers must:
- Use retrieved sources only
- Cite source + location
- Say “Scripture is silent” when applicable
- Refuse to speculate

Forbidden behaviors:
- “God told me” language
- Personalized prophecy
- Fear-based conclusions
- Mystical extrapolation

---

## 4. VECTOR / RETRIEVAL RULES

- Retrieval before reasoning
- No retrieval → no answer
- Log source IDs used
- Prefer fewer, higher-authority sources

---

## 5. OUTPUT CONTRACT

AI outputs must separate:
- Quotation
- Explanation
- Application
- Guardrails

Blended responses are forbidden.

---

## FINAL PRINCIPLE

> AI assists discernment.  
> Scripture governs truth.</file>