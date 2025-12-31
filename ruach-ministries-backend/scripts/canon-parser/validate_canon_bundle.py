#!/usr/bin/env python3
"""
Ruach Canon Bundle Validator

Checks:
- Unique canonNodeId
- No empty text
- Token/char ceilings
- TOC dotted-leader lines filtered (unless allowed)
- Location schema has chapter + order
"""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


def approx_token_count(text: str) -> int:
    return max(1, (len(text) + 3) // 4)


def looks_like_toc_line(text: str) -> bool:
    # Must have contiguous dotted-leader run.
    if not re.search(r"(?:\.\s){10,}", text):
        return False
    # Must end with a page marker.
    if not re.search(r"(\b\d{1,4}\b|\b[ivxlcdm]{1,8}\b)\s*$", text.lower()):
        return False
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Ruach canon JSON bundle")
    parser.add_argument("--input", required=True, help="Path to canon JSON bundle")
    parser.add_argument("--max-tokens", type=int, default=500)
    parser.add_argument("--max-chars", type=int, default=1500)
    parser.add_argument(
        "--allow-toc",
        action="store_true",
        help="Allow TOC dotted-leader lines (default: fail if present).",
    )
    args = parser.parse_args()

    path = Path(args.input).expanduser().resolve()
    data = json.loads(path.read_text(encoding="utf-8"))

    nodes = data.get("nodes") or []
    seen = set()
    toc_hits = 0

    for idx, node in enumerate(nodes):
        node_id = node.get("canonNodeId")
        if not node_id:
            raise SystemExit(f"FAIL: nodes[{idx}] missing canonNodeId")
        if node_id in seen:
            raise SystemExit(f"FAIL: duplicate canonNodeId: {node_id}")
        seen.add(node_id)

        loc = node.get("location") or {}
        chapter = loc.get("chapter") or {}
        if "index" not in chapter or "title" not in chapter:
            raise SystemExit(f"FAIL: nodes[{idx}] missing location.chapter index/title")
        if "order" not in loc:
            raise SystemExit(f"FAIL: nodes[{idx}] missing location.order")

        content = node.get("content") or {}
        text = (content.get("text") or "").strip()
        if not text:
            raise SystemExit(f"FAIL: empty content.text at nodes[{idx}] ({node_id})")

        if len(text) > args.max_chars:
            raise SystemExit(f"FAIL: node too long (chars>{args.max_chars}) {node_id}")
        if approx_token_count(text) > args.max_tokens:
            raise SystemExit(f"FAIL: node too long (tokens>{args.max_tokens}) {node_id}")

        if looks_like_toc_line(text):
            toc_hits += 1

    if toc_hits and not args.allow_toc:
        raise SystemExit(f"FAIL: found {toc_hits} TOC-like nodes; re-run parser with TOC filtering")

    print(f"OK: nodes={len(nodes)} unique={len(seen)} tocHits={toc_hits}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

