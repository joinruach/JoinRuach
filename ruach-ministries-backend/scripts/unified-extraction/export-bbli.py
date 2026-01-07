#!/usr/bin/env python3
"""
Export YAH Scriptures .bbli (SQLite) to JSONL format

Usage:
    python3 export-bbli.py /path/to/YSpc1.04.bbli --out yahscriptures.jsonl --clean
"""

import sqlite3
import json
import re
import argparse
from pathlib import Path

# Canonical book mapping (Books 1-66)
CANONICAL_BOOKS = {
    1: "Genesis", 2: "Exodus", 3: "Leviticus", 4: "Numbers", 5: "Deuteronomy",
    6: "Joshua", 7: "Judges", 8: "Ruth", 9: "1 Samuel", 10: "2 Samuel",
    11: "1 Kings", 12: "2 Kings", 13: "1 Chronicles", 14: "2 Chronicles",
    15: "Ezra", 16: "Nehemiah", 17: "Esther", 18: "Job", 19: "Psalms",
    20: "Proverbs", 21: "Ecclesiastes", 22: "Song of Solomon", 23: "Isaiah",
    24: "Jeremiah", 25: "Lamentations", 26: "Ezekiel", 27: "Daniel",
    28: "Hosea", 29: "Joel", 30: "Amos", 31: "Obadiah", 32: "Jonah",
    33: "Micah", 34: "Nahum", 35: "Habakkuk", 36: "Zephaniah", 37: "Haggai",
    38: "Zechariah", 39: "Malachi",
    40: "Matthew", 41: "Mark", 42: "Luke", 43: "John", 44: "Acts",
    45: "Romans", 46: "1 Corinthians", 47: "2 Corinthians", 48: "Galatians",
    49: "Ephesians", 50: "Philippians", 51: "Colossians", 52: "1 Thessalonians",
    53: "2 Thessalonians", 54: "1 Timothy", 55: "2 Timothy", 56: "Titus",
    57: "Philemon", 58: "Hebrews", 59: "James", 60: "1 Peter", 61: "2 Peter",
    62: "1 John", 63: "2 John", 64: "3 John", 65: "Jude", 66: "Revelation",
}

# Apocrypha/Deuterocanonical books (Books 67+)
APOCRYPHA_BOOKS = {
    67: "Tobit",
    68: "Judith",
    69: "Wisdom",
    70: "Sirach",
    71: "Baruch",
    72: "1 Maccabees",
    73: "2 Maccabees",
    74: "1 Esdras",
    75: "2 Esdras",
    76: "Additions to Esther",
    77: "Prayer of Azariah",
    78: "Prayer of Manasseh",
}

def strip_html_keep_breaks(s: str) -> str:
    """Remove HTML tags but preserve line breaks"""
    if s is None:
        return ""
    # Keep explicit line breaks
    s = s.replace("<br />", "\n").replace("<br/>", "\n").replace("<br>", "\n")
    # Remove tags but keep inner text
    s = re.sub(r"</?[^>]+>", "", s)
    # Normalize whitespace
    s = re.sub(r"[ \t]+", " ", s).strip()
    return s

def book_name(book_num: int) -> str:
    """Get book name from number"""
    if book_num in CANONICAL_BOOKS:
        return CANONICAL_BOOKS[book_num]
    if book_num in APOCRYPHA_BOOKS:
        return APOCRYPHA_BOOKS[book_num]
    return f"Book{book_num:02d}"

def book_testament(book_num: int) -> str:
    """Determine testament"""
    if 1 <= book_num <= 39:
        return "old"
    if 40 <= book_num <= 66:
        return "new"
    if book_num >= 67:
        return "apocrypha"
    return "unknown"

def main():
    ap = argparse.ArgumentParser(description="Export YAH Scriptures .bbli to JSONL")
    ap.add_argument("bbli", help="Path to .bbli (SQLite) file")
    ap.add_argument("--out", default="yahscriptures.jsonl", help="Output JSONL path")
    ap.add_argument("--clean", action="store_true", help="Strip HTML tags (keeps line breaks)")
    args = ap.parse_args()

    bbli_path = Path(args.bbli)
    if not bbli_path.exists():
        print(f"❌ File not found: {bbli_path}")
        return 1

    conn = sqlite3.connect(args.bbli)
    cur = conn.cursor()

    # Read metadata
    meta_row = cur.execute(
        "SELECT Title, Abbreviation, Version, OldTestament, NewTestament, Apocrypha FROM Details"
    ).fetchone()
    
    metadata = {
        "title": meta_row[0],
        "abbreviation": meta_row[1],
        "version": meta_row[2],
        "old_testament": bool(meta_row[3]),
        "new_testament": bool(meta_row[4]),
        "apocrypha": bool(meta_row[5]),
    }

    # Count verses by testament
    verse_counts = {
        "old": 0,
        "new": 0,
        "apocrypha": 0,
    }

    with open(args.out, "w", encoding="utf-8") as f:
        # Write metadata header
        f.write(json.dumps({"_meta": metadata}, ensure_ascii=False) + "\n")

        # Export verses
        for book, ch, vs, text in cur.execute(
            "SELECT Book, Chapter, Verse, Scripture FROM Bible ORDER BY Book, Chapter, Verse"
        ):
            raw = text or ""
            out_text = strip_html_keep_breaks(raw) if args.clean else raw
            
            testament = book_testament(book)
            verse_counts[testament] += 1
            
            rec = {
                "book_num": book,
                "book": book_name(book),
                "testament": testament,
                "chapter": ch,
                "verse": vs,
                "text": out_text,
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

    print(f"✅ Exported to: {args.out}")
    print(f"   Old Testament: {verse_counts['old']:,} verses")
    print(f"   New Testament: {verse_counts['new']:,} verses")
    print(f"   Apocrypha: {verse_counts['apocrypha']:,} verses")
    print(f"   Total: {sum(verse_counts.values()):,} verses")

    conn.close()
    return 0

if __name__ == "__main__":
    exit(main())
