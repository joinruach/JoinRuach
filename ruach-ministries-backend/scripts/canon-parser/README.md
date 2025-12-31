# Ruach Canon Parser

Production-oriented, deterministic parsing pipeline for turning raw documents (PDF/EPUB/DOCX/Markdown) into canon-safe JSON nodes.

This is intentionally structured as isolated, testable stages:

1. **Adapter**: file → `RawBlock[]`
2. **Structural analysis**: `RawBlock[]` → chapters/headings/paragraphs
3. **Segmentation**: paragraphs → node-sized chunks (no mid-sentence cuts)
4. **Normalization**: chunks → canon nodes (deterministic IDs)
5. **Validation**: enforce invariants (non-empty, size limits, no duplicate IDs)

## Quickstart

1. Install Python deps (recommended in a venv):

```bash
pip install -r ruach-monorepo/ruach-ministries-backend/scripts/canon-parser/requirements.txt
```

2. Run the CLI:

```bash
python ruach-monorepo/ruach-ministries-backend/scripts/canon-parser/ruach_canon_parser.py \
  --input ./path/to/book.pdf \
  --title "The Ministry of Healing" \
  --author "Ellen G. White" \
  --slug ministry-of-healing \
  --out ./out/ministry-of-healing.canon.json
```

## Output

The parser emits a single JSON bundle:

```json
{
  "book": { "slug": "...", "title": "...", "author": "...", "sourceFile": "...", "sourceSha256": "..." },
  "nodes": [ ... ],
  "meta": { "parserVersion": "1.0.2", "determinismKey": "...", "createdAt": "..." }
}
```

## Deterministic IDs

Node IDs are derived from **stable positions**, not randomness:

`canonNodeId = "ruach:book:{book_slug}:ch{chapter_index}:n{node_index}"`

If two people run the parser on the same file with the same options → identical IDs and output.

## Text cleanup

Once a canon bundle is locked, run the normalization script before ingestion/vectorization to keep the structure intact while cleaning hyphenation, mashed words, and page markers:

```bash
cd ruach-monorepo
pnpm exec tsx ruach-ministries-backend/scripts/canon-parser/canon-text-normalize.ts \
  --input ./ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.canon.json \
  --apply \
  --diff
```

The script enforces the invariants you described:

* `canonNodeId` order and values are unchanged.
* Node count is stable.
* Only `node.content.text` mutates (non-text hashes are validated).
* The output metadata adds `textNormalized`, `normalizationPass`, and `canonIntegrity`.

The script now also accepts `--fail-on-diff` so you can gate pipelines (CI jobs should combine `--diff` + `--fail-on-diff` to break when unexpected changes appear). When `--apply` is omitted the script performs a dry run and prints a summary; add `--diff` to see the first 20 text diffs in `---/+++` format and attach `--fail-on-diff` to fail when diffs exist. The default output path mirrors the input (`*.canon.clean.json`). Use `--out` to override it.

## Pipeline guardrail & diff archive

We keep every pipeline stage explicit:

| Stage | Artifact |
| --- | --- |
| Raw parser output | `ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.canon.json` |
| Normalized text | `ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.canon.clean.json` |

`canon-text-normalize.ts` now emits diffs (and metadata) so the pipeline can prove no structural changes occur. We run this in CI via `.github/workflows/canon-guardrail.yml` (the job executes `pnpm exec tsx scripts/canon-parser/canon-text-normalize.ts --input ... --diff --fail-on-diff`). Any time the parser changes, the guardrail fails until the diff is intentional and reviewed.

We also archive the audit-friendly text diff you just inspected at `ruach-ministries-backend/scripts/canon-parser/diffs/ministry-of-healing/2025-01-14-parser-v1.0.2.md`. It summarizes node counts, fix counts, and includes sample `---/+++` diffs so reviewers can see exactly what touched without re-running the parser.

## Consumption guidance

Always point downstream jobs (Strapi importers, vector ingestion, AI agents) at the normalized clean file:

```
CANON_PATH=ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.canon.clean.json
```

Add optional pre-flight checks along the way:

```
if (!canon.meta?.textNormalized) {
  throw new Error("Canon must be normalized before consumption.");
}
```

This ensures clean embeddings, consistent citation data, and the new `meta.textNormalized` flag surfaces to every layer that relies on the canon.

## Ingestion helpers

Once the bundle is normalized, use these TypeScript helpers to move it into Strapi or your vector stores:

### Strapi importer

`canon-strapi-import.ts` posts each node into the `canon-nodes` collection.

```bash
pnpm exec tsx ruach-ministries-backend/scripts/canon-parser/canon-strapi-import.ts \
  --input ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.canon.clean.json
```

Environment:

* `STRAPI_URL` (default `http://localhost:1337`)
* `STRAPI_TOKEN` (required, create/update scope)

The import script queries `canonNodeId` before writing so existing entries are updated (PUT) while new ones are created (POST). Add `--dry-run` to preview every operation without mutating Strapi.

### Vector chunk exporter

`canon-to-vectors.ts` converts each node into a chunk with previous/next context, ready for embeddings.

```bash
pnpm exec tsx ruach-ministries-backend/scripts/canon-parser/canon-to-vectors.ts \
  --input ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.canon.clean.json \
  --output ruach-ministries-backend/scripts/canon-parser/out/ministry-of-healing.vectors.json
```

The output contains `id`, `text`, `context`, and `meta` (chapter/order/authority/source). Feed it into your vector pipeline (`embed(chunk.context)` + `vectorDB.upsert`) and all downstream AI agents will reference the normalized text with citation-ready metadata.
