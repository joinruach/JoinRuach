# YahScriptures PDF Input Directory

## Required File

Place your YahScriptures PDF file in this directory:

```
scripts/scripture-extraction/input/yahscriptures.pdf
```

## File Requirements

- **Format**: PDF
- **Content**: YahScriptures translation (103 books)
- **Special Features**: Must preserve Paleo-Hebrew divine names

## Where to Get YahScriptures

You can obtain the YahScriptures translation from:
- Official YahScriptures website
- Your personal copy if already purchased

## After Placing the File

Run the extraction script:

```bash
cd ruach-monorepo

python scripts/scripture-extraction/extract-yahscriptures.py \
  scripts/scripture-extraction/input/yahscriptures.pdf \
  scripts/scripture-extraction/output
```

This will create:
- `output/works.json` - Book metadata
- `output/verses_chunk_01.json` - Verse data (chunked)
- Additional chunks as needed
