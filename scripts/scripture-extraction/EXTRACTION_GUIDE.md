# YahScriptures + Apocrypha Extraction Guide

## ✅ Script Now Supports 103 Books Total!

The extraction script has been updated to handle:
- **66 Canonical Books** (Tanakh + Renewed Covenant)
- **37 Apocryphal Books** (Deuterocanonical + Pseudepigrapha)

## 📚 Book Coverage

### Tanakh (39 books)
- Torah (5): Genesis → Deuteronomy
- Former Prophets (6): Joshua → 2 Kings
- Latter Prophets (17): Isaiah → Malachi
- Writings (11): Psalms → Nehemiah

### Renewed Covenant (27 books)
- Gospels (4): Matthew → John
- History (1): Acts
- Epistles (21): Romans → Jude
- Apocalyptic (1): Revelation

### Apocrypha (37 books)
**Deuterocanonical:**
- Tobit, Judith, Additions to Esther
- Wisdom of Solomon, Sirach/Ecclesiasticus
- Baruch, Letter of Jeremiah
- Prayer of Azariah, Susanna, Bel and the Dragon
- 1-4 Maccabees, 1-2 Esdras
- Prayer of Manasseh, Psalm 151

**Pseudepigrapha:**
- Book of Enoch (1 Enoch)
- Book of Jubilees, Book of Jasher
- Odes, Psalms of Solomon
- Epistle of Barnabas, Shepherd of Hermas, Didache
- Testaments of the Twelve Patriarchs
- Assumption of Moses, Martyrdom/Ascension of Isaiah
- 2 Baruch (Apocalypse of Baruch)
- Life of Adam and Eve, Apocalypse of Moses
- Testaments of Abraham, Isaac, and Jacob
- Apocalypse of Elijah

## 🚀 Extraction Commands

### Option 1: Extract Both PDFs Together
```bash
cd ruach-monorepo

# Extract main YahScriptures
python ruach-ministries-backend/scripts/scripture-extraction/extract-yahscriptures.py \
  scripts/scripture-extraction/input/yahscriptures.pdf \
  scripts/scripture-extraction/output/main

# Extract Apocrypha
python ruach-ministries-backend/scripts/scripture-extraction/extract-yahscriptures.py \
  scripts/scripture-extraction/input/Apocrypha.pdf \
  scripts/scripture-extraction/output/apocrypha
```

### Option 2: Merge Output (Recommended)
Extract to the same output directory for unified dataset:

```bash
cd ruach-monorepo

# Extract main YahScriptures
python ruach-ministries-backend/scripts/scripture-extraction/extract-yahscriptures.py \
  scripts/scripture-extraction/input/yahscriptures.pdf \
  scripts/scripture-extraction/output

# Extract Apocrypha to same directory (will append to existing files)
python ruach-ministries-backend/scripts/scripture-extraction/extract-yahscriptures.py \
  scripts/scripture-extraction/input/Apocrypha.pdf \
  scripts/scripture-extraction/output
```

## 📊 Expected Output

After extracting both PDFs:

```
scripts/scripture-extraction/output/
├── works.json                 # Combined book metadata (103 books)
├── verses_chunk_01.json       # First 5,000 verses
├── verses_chunk_02.json       # Next 5,000 verses
├── verses_chunk_03.json       # Next 5,000 verses
└── verses_chunk_XX.json       # Remaining verses
```

## 📥 Import to Strapi

Once extraction is complete:

```bash
cd ruach-monorepo

# Set API token
export STRAPI_API_TOKEN=your_token_here

# Import all data (main + apocrypha)
pnpm tsx ruach-ministries-backend/scripts/scripture-extraction/import-to-strapi.ts \
  scripts/scripture-extraction/output
```

## 🔍 Verify Import

```bash
# Check total works (should be 103)
curl http://localhost:1337/api/scripture-works | jq '.meta.pagination.total'

# Get Tobit (first Apocrypha book)
curl 'http://localhost:1337/api/scripture-works?filters[shortCode][$eq]=TOB' | jq '.data[0]'

# Get Book of Enoch
curl 'http://localhost:1337/api/scripture-works?filters[shortCode][$eq]=ENO' | jq '.data[0]'

# Check Apocrypha verses
curl 'http://localhost:1337/api/scripture-verses?filters[work][testament][$eq]=apocrypha' | jq '.meta.pagination.total'
```

## 📝 Notes

### Alternate Book Names
The script handles alternate names automatically:
- **Sirach** = **Ecclesiasticus** (both map to `SIR`)
- **Book of Enoch** = **1 Enoch** (both map to `ENO`)
- **Jasher** = **Book of Jasher** (both map to `JSR`)
- **2 Baruch** = **Apocalypse of Baruch** (both map to `2BA`)

### PDF Format Requirements
Both PDFs must follow similar formatting:
- Clear book headers (script detects book names)
- Chapter markers ("Chapter 1", "Chapter 2", etc.)
- Verse numbers at start of lines (1, 2, 3, etc.)
- Paleo-Hebrew characters preserved in PDF encoding

### Troubleshooting

**"Book not found" warnings:**
- Check PDF formatting matches expected structure
- Verify book names in PDF match names in BOOK_MAPPING
- Some books may use alternate titles

**Duplicate verses:**
- Import script is idempotent - duplicates are automatically skipped
- Safe to re-run extraction/import

**Missing chapters:**
- Verify PDF chapter markers are consistent
- Check for non-standard formatting

## ✅ Ready to Extract!

The script now fully supports both:
1. **YahScriptures main PDF** (66 canonical books)
2. **Apocrypha PDF** (37 additional books)

Place both PDFs in `scripts/scripture-extraction/input/` and run the extraction commands above!
