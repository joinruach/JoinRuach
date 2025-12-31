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
