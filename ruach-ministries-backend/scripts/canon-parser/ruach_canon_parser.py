#!/usr/bin/env python3
"""
Ruach Canon Parser

Deterministic, production-oriented pipeline:
file → blocks → structure → segments → canon nodes → JSON bundle
"""

from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Literal, Optional, Sequence, Tuple


ParserFormat = Literal["auto", "pdf", "md", "markdown", "docx", "epub"]
PARSER_VERSION = "1.0.2"


@dataclass(frozen=True)
class RawBlock:
    text: str
    page: Optional[int] = None
    style: Optional[Dict[str, Any]] = None


@dataclass(frozen=True)
class StructuralItem:
    kind: Literal["chapter", "heading", "paragraph"]
    text: str
    page: Optional[int] = None


@dataclass(frozen=True)
class Chapter:
    index: int
    title: str
    items: List[StructuralItem]


def sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def read_file_bytes(path: Path) -> bytes:
    with open(path, "rb") as handle:
        return handle.read()


def slugify(value: str) -> str:
    value = value.strip().lower()
    value = re.sub(r"[^a-z0-9]+", "-", value)
    value = re.sub(r"(^-|-$)", "", value)
    return value or "untitled"


def approx_token_count(text: str) -> int:
    # Conservative-ish heuristic for English.
    return max(1, (len(text) + 3) // 4)


def canon_node_id(book_slug: str, chapter_index: int, node_index: int) -> str:
    # Human-readable, deterministic ID (no randomness).
    # This is intentionally stable across runs when (slug, chapter_index, node_index) are stable.
    return f"ruach:book:{book_slug}:ch{chapter_index}:n{node_index}"


def split_sentences(text: str) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    # Simple sentence boundary splitting; deterministic and dependency-free.
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"“‘(])", text)
    return [p.strip() for p in parts if p.strip()]


def chunk_text(text: str, max_chars: int) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if not text:
        return []
    if len(text) <= max_chars:
        return [text]

    # Prefer sentence boundaries.
    sentences = split_sentences(text)
    if not sentences:
        return [text[:max_chars].strip(), text[max_chars:].strip()]

    chunks: List[str] = []
    buf: List[str] = []
    buf_len = 0
    for sentence in sentences:
        if buf_len and buf_len + 1 + len(sentence) > max_chars:
            chunks.append(" ".join(buf).strip())
            buf = []
            buf_len = 0
        buf.append(sentence)
        buf_len += len(sentence) + (1 if buf_len else 0)

    if buf:
        chunks.append(" ".join(buf).strip())

    # If any single sentence is still too large, hard split deterministically.
    final_chunks: List[str] = []
    for c in chunks:
        if len(c) <= max_chars:
            final_chunks.append(c)
            continue
        for i in range(0, len(c), max_chars):
            final_chunks.append(c[i : i + max_chars].strip())
    return [c for c in final_chunks if c]


def segment_paragraphs(paragraphs: Sequence[StructuralItem], max_chars: int) -> List[Tuple[str, Optional[int], Optional[int]]]:
    """
    Returns [(text, page_start, page_end)].
    Keeps paragraph boundaries where possible and avoids mid-sentence splits unless required.
    """
    nodes: List[Tuple[str, Optional[int], Optional[int]]] = []
    buf: List[str] = []
    page_start: Optional[int] = None
    page_end: Optional[int] = None

    def flush():
        nonlocal buf, page_start, page_end
        merged = " ".join([b.strip() for b in buf if b.strip()]).strip()
        if merged:
            for piece in chunk_text(merged, max_chars=max_chars):
                nodes.append((piece, page_start, page_end))
        buf = []
        page_start = None
        page_end = None

    for item in paragraphs:
        t = re.sub(r"\s+", " ", item.text).strip()
        if not t:
            continue

        if page_start is None and item.page is not None:
            page_start = item.page
        if item.page is not None:
            page_end = item.page

        candidate = (" ".join(buf + [t])).strip()
        if buf and len(candidate) > max_chars:
            flush()
            buf = [t]
            if item.page is not None:
                page_start = item.page
                page_end = item.page
        else:
            buf.append(t)

    flush()
    return nodes


def normalize_pdf_text(text: str) -> str:
    """
    Light normalization for PDF-extracted prose:
    - Remove inline page markers like "[296]"
    - Repair common line-break hyphenation artifacts (e.g. "under- stands" -> "understands")
    """
    text = re.sub(r"\[\d{1,4}\]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    # Join word-break hyphenation where the second chunk is lowercase (heuristic).
    text = re.sub(r"\b([A-Za-z]{2,})-\s+([a-z]{2,})\b", r"\1\2", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def is_chapter_heading(text: str) -> bool:
    t = text.strip()
    if not t:
        return False
    # Only treat explicit chapter headings as chapters.
    # This avoids false positives like citation fragments (e.g. "A.R.V.; 4:7.").
    t = re.sub(r"^\[\d{1,4}\]\s*", "", t)
    return bool(re.match(r"^chapter\s+\d+\b", t, re.IGNORECASE))


def classify_block(block: RawBlock) -> StructuralItem:
    t = block.text.strip()
    if is_chapter_heading(t):
        return StructuralItem(kind="chapter", text=t, page=block.page)
    # Heuristic heading: short, not ending in punctuation, and not a verse-like line.
    if len(t) < 60 and not re.search(r"[.!?]$", t) and not re.match(r"^\d+:\d+\b", t):
        return StructuralItem(kind="heading", text=t, page=block.page)
    return StructuralItem(kind="paragraph", text=t, page=block.page)

def looks_like_toc_line(text: str) -> bool:
    """
    Detect table-of-contents / dotted leader navigation lines.

    Example:
      "Preface . . . . . iii The True Medical Missionary . . . 11"

    We intentionally keep this heuristic strict to avoid false positives on prose ellipses.
    """
    t = text.strip()
    if not t:
        return False

    # Some PDFs include TOC chapter entries without dotted leaders, e.g.:
    # "Chapter 39—The Knowledge Received Through God’s Word 322"
    # Treat these as TOC if they end with a page number and are not the in-body heading
    # (in-body headings in this PDF are prefixed by bracketed page markers like "[458]").
    if re.match(r"^chapter\s+\d+\b", t, re.IGNORECASE) and re.search(r"\s\d{1,4}$", t):
        if not re.match(r"^\[\d{1,4}\]\s*", t):
            return True

    # Spaced dotted leaders (". . . . .") typically used in TOCs.
    # Require a *contiguous* dotted leader run to avoid false positives on normal prose periods.
    if not re.search(r"(?:\.\s){10,}", t):
        return False

    # TOC lines often end with a page marker (roman numerals or digits).
    if not re.search(r"(\b\d{1,4}\b|\b[ivxlcdm]{1,8}\b)\s*$", t.lower()):
        return False

    return True


def build_structure(blocks: Sequence[RawBlock]) -> List[Chapter]:
    # Drop TOC-style navigation before structural detection to prevent chapter drift.
    prefiltered: List[RawBlock] = []
    for b in blocks:
        if not b.text or not b.text.strip():
            continue
        if looks_like_toc_line(b.text):
            continue
        prefiltered.append(b)

    items = [classify_block(b) for b in prefiltered]

    chapters: List[Chapter] = []
    current: Optional[Chapter] = None

    # Chapter indices are assigned from the detected chapter headings (1..N).
    # Any content before the first heading goes into a deterministic "Front Matter" chapter at index 0.
    chapter_index = 0

    def ensure_default_chapter() -> Chapter:
        nonlocal current, chapter_index
        if current is None:
            # If we have no chapter markers yet, create a deterministic default chapter.
            current = Chapter(index=0, title="Front Matter", items=[])
            chapters.append(current)
        return current

    i = 0
    while i < len(items):
        item = items[i]
        if item.kind == "chapter":
            cleaned_title = re.sub(r"^\[\d{1,4}\]\s*", "", item.text.strip())
            match = re.match(r"^chapter\s+(\d+)\b", cleaned_title, re.IGNORECASE)
            if match:
                chapter_index = int(match.group(1))
            else:
                chapter_index += 1

            # Some PDFs split the chapter title across lines; stitch the next short heading line
            # if it looks like a continuation (e.g., "Chapter 39—... Through" + "God’s Word").
            stitched_title = cleaned_title
            j = i + 1
            while j < len(items):
                next_item = items[j]
                if next_item.kind != "heading" or (next_item.page != item.page):
                    break

                continuation = re.sub(r"^\[\d{1,4}\]\s*", "", next_item.text.strip()).strip()
                if not continuation or re.fullmatch(r"\d{1,4}", continuation):
                    j += 1
                    continue
                if len(continuation) > 60 or re.search(r"\d+:\d+", continuation):
                    break

                stitched_title = f"{stitched_title} {continuation}".strip()
                i = j  # consume up to this heading line
                break

            current = Chapter(index=chapter_index, title=stitched_title, items=[])
            chapters.append(current)
            i += 1
            continue

        ensure_default_chapter().items.append(item)
        i += 1

    if not chapters:
        chapters.append(Chapter(index=1, title="Chapter 1", items=[]))
    return chapters


class FileAdapter:
    def extract(self, file_path: Path) -> List[RawBlock]:
        raise NotImplementedError


class PdfAdapter(FileAdapter):
    def extract(self, file_path: Path) -> List[RawBlock]:
        try:
            import pdfplumber  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Missing dependency: pdfplumber (pip install pdfplumber)") from exc

        blocks: List[RawBlock] = []
        with pdfplumber.open(str(file_path)) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                # Prefer word-based reconstruction; this preserves spaces more reliably than
                # line-based extraction for many PDFs and reduces "smashed" words.
                try:
                    words = page.extract_words(use_text_flow=True)
                except TypeError:
                    # Older pdfplumber versions may not support use_text_flow.
                    words = page.extract_words()

                if words:
                    lines: Dict[float, List[Dict[str, Any]]] = {}
                    for w in words:
                        top = round(float(w.get("top", 0.0)), 1)
                        lines.setdefault(top, []).append(w)

                    for top in sorted(lines.keys()):
                        line_words = sorted(lines[top], key=lambda x: float(x.get("x0", 0.0)))
                        line = " ".join([str(w.get("text", "")).strip() for w in line_words]).strip()
                        if line:
                            blocks.append(RawBlock(text=line, page=page_num))
                    continue

                # Fallback: line-based extraction.
                text = page.extract_text() or ""
                for line in text.split("\n"):
                    line = line.strip()
                    if line:
                        blocks.append(RawBlock(text=line, page=page_num))
        return blocks


class MarkdownAdapter(FileAdapter):
    def extract(self, file_path: Path) -> List[RawBlock]:
        content = file_path.read_text(encoding="utf-8", errors="replace")
        blocks: List[RawBlock] = []
        for line in content.splitlines():
            line = line.rstrip()
            if not line.strip():
                continue
            # Preserve markdown headings as their own blocks.
            if re.match(r"^#{1,6}\s+", line):
                blocks.append(RawBlock(text=line.strip(), page=None, style={"mdHeading": True}))
            else:
                blocks.append(RawBlock(text=line.strip(), page=None))
        return blocks


class DocxAdapter(FileAdapter):
    def extract(self, file_path: Path) -> List[RawBlock]:
        try:
            import docx  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Missing dependency: python-docx (pip install python-docx)") from exc

        doc = docx.Document(str(file_path))
        blocks: List[RawBlock] = []
        for para in doc.paragraphs:
            text = (para.text or "").strip()
            if not text:
                continue
            blocks.append(RawBlock(text=text, page=None))
        return blocks


class EpubAdapter(FileAdapter):
    def extract(self, file_path: Path) -> List[RawBlock]:
        try:
            from ebooklib import epub  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Missing dependency: ebooklib (pip install ebooklib)") from exc

        try:
            from bs4 import BeautifulSoup  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Missing dependency: beautifulsoup4 (pip install beautifulsoup4)") from exc

        book = epub.read_epub(str(file_path))
        blocks: List[RawBlock] = []

        for item in book.get_items():
            # Only parse XHTML/HTML documents.
            if item.get_type() != epub.ITEM_DOCUMENT:
                continue
            soup = BeautifulSoup(item.get_content(), "html.parser")
            text = soup.get_text("\n")
            for line in text.splitlines():
                line = line.strip()
                if not line:
                    continue
                blocks.append(RawBlock(text=line))

        return blocks


def select_adapter(fmt: ParserFormat) -> FileAdapter:
    if fmt == "pdf":
        return PdfAdapter()
    if fmt in ("md", "markdown"):
        return MarkdownAdapter()
    if fmt == "docx":
        return DocxAdapter()
    if fmt == "epub":
        return EpubAdapter()
    raise ValueError(f"Unsupported format: {fmt}")


def detect_format(path: Path) -> ParserFormat:
    ext = path.suffix.lower()
    if ext == ".pdf":
        return "pdf"
    if ext in (".md", ".markdown"):
        return "md"
    if ext == ".docx":
        return "docx"
    if ext == ".epub":
        return "epub"
    return "auto"


def validate_nodes(nodes: Sequence[Dict[str, Any]], max_tokens: int) -> None:
    seen: set[str] = set()
    for node in nodes:
        node_id = node.get("canonNodeId")
        if not node_id:
            raise ValueError("Node missing canonNodeId")
        if node_id in seen:
            raise ValueError(f"Duplicate canonNodeId: {node_id}")
        seen.add(node_id)

        text = ((node.get("content") or {}).get("text") or "").strip()
        if not text:
            raise ValueError(f"Empty node content for {node_id}")
        if approx_token_count(text) > max_tokens:
            raise ValueError(f"Node exceeds token limit ({max_tokens}): {node_id}")


def parse_to_bundle(
    input_path: Path,
    fmt: ParserFormat,
    title: str,
    author: str,
    slug: str,
    max_chars: int,
    max_tokens: int,
    include_toc: bool,
) -> Dict[str, Any]:
    adapter = select_adapter(fmt)
    blocks = adapter.extract(input_path)
    chapters = build_structure(blocks)

    nodes: List[Dict[str, Any]] = []
    for chapter in chapters:
        paragraphs = [i for i in chapter.items if i.kind == "paragraph"]
        if not include_toc:
            paragraphs = [p for p in paragraphs if not looks_like_toc_line(p.text)]
        if fmt == "pdf":
            normalized: List[StructuralItem] = []
            for p in paragraphs:
                cleaned = normalize_pdf_text(p.text)
                if cleaned:
                    normalized.append(dataclasses.replace(p, text=cleaned))
            paragraphs = normalized
        segments = segment_paragraphs(paragraphs, max_chars=max_chars)
        for chapter_node_index, (segment_text, page_start, page_end) in enumerate(segments, 1):
            node = {
                "canonNodeId": canon_node_id(slug, chapter.index, chapter_node_index),
                "canonType": "book",
                "source": {
                    "slug": slug,
                    "title": title,
                    "author": author,
                },
                "location": {
                    "chapter": {
                        "index": chapter.index,
                        "title": chapter.title,
                    },
                    "order": chapter_node_index,
                    "pageStart": page_start,
                    "pageEnd": page_end,
                },
                "content": {
                    "type": "paragraph",
                    "text": normalize_pdf_text(segment_text) if fmt == "pdf" else segment_text,
                },
                "anchors": {
                    "themes": [],
                    "scriptureRefs": [],
                    "axioms": [],
                },
                "authority": {
                    "tier": 2,
                    "weight": 0.7,
                },
            }
            nodes.append(node)

    validate_nodes(nodes, max_tokens=max_tokens)

    source_bytes = read_file_bytes(input_path)
    source_hash = sha256_hex(source_bytes)

    determinism_key = sha256_hex(
        f"{PARSER_VERSION}:{slug}:{fmt}:{max_chars}:{max_tokens}:{include_toc}:{source_hash}".encode(
            "utf-8"
        )
    )[:24]

    return {
        "book": {
            "slug": slug,
            "title": title,
            "author": author,
            "sourceFile": str(input_path),
            "sourceSha256": source_hash,
        },
        "nodes": nodes,
        "meta": {
            "parserVersion": PARSER_VERSION,
            "format": fmt,
            "maxChars": max_chars,
            "maxTokens": max_tokens,
            "includeToc": include_toc,
            "createdAt": dt.datetime.now(dt.timezone.utc).isoformat(),
            "determinismKey": determinism_key,
        },
    }


def main(argv: Optional[Sequence[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Ruach Canon Parser (deterministic)")
    parser.add_argument("--input", required=True, help="Path to input file (PDF/EPUB/DOCX/MD)")
    parser.add_argument("--format", default="auto", choices=["auto", "pdf", "md", "markdown", "docx", "epub"])
    parser.add_argument("--title", required=True, help="Book title")
    parser.add_argument("--author", default="", help="Book author")
    parser.add_argument("--slug", default="", help="Book slug (defaults to slugified title)")
    parser.add_argument("--out", required=True, help="Output JSON path")
    parser.add_argument("--max-chars", type=int, default=1200, help="Max chars per node (default: 1200)")
    parser.add_argument("--max-tokens", type=int, default=500, help="Max approx tokens per node (default: 500)")
    parser.add_argument("--pretty", action="store_true", help="Pretty-print JSON")
    parser.add_argument(
        "--include-toc",
        action="store_true",
        help="Include table-of-contents style dotted-leader lines (default: filtered).",
    )

    args = parser.parse_args(argv)

    input_path = Path(args.input).expanduser().resolve()
    if not input_path.exists():
        print(f"ERROR: Input not found: {input_path}", file=sys.stderr)
        return 2

    fmt: ParserFormat = args.format
    if fmt == "auto":
        detected = detect_format(input_path)
        if detected == "auto":
            print(f"ERROR: Unable to detect format from extension: {input_path.suffix}", file=sys.stderr)
            return 2
        fmt = detected

    slug = args.slug.strip() or slugify(args.title)
    out_path = Path(args.out).expanduser().resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)

    bundle = parse_to_bundle(
        input_path=input_path,
        fmt=fmt,
        title=args.title,
        author=args.author,
        slug=slug,
        max_chars=args.max_chars,
        max_tokens=args.max_tokens,
        include_toc=args.include_toc,
    )

    with open(out_path, "w", encoding="utf-8") as handle:
        json.dump(bundle, handle, ensure_ascii=False, indent=2 if args.pretty else None)

    print(f"✅ Wrote {len(bundle['nodes'])} nodes → {out_path}")
    print(f"   determinismKey: {bundle['meta']['determinismKey']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
