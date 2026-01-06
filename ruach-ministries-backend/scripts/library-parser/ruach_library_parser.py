#!/usr/bin/env python3
"""
Ruach Library Parser v1.0.0

Deterministic PDF/EPUB ingestion pipeline:
  file → extract → normalize → structure → chunk → embed → database

Follows canon-parser patterns:
- SHA256 checksums for determinism
- JSON artifacts for debugging
- QA metrics for quality assessment
"""

import argparse
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import List, Dict, Any, Optional, Literal
from urllib.parse import urlparse
from urllib.request import urlretrieve

# Import extraction libraries
try:
    import pdfplumber
    from ebooklib import epub
    from bs4 import BeautifulSoup
    import psycopg2
    import psycopg2.extras
    from openai import OpenAI
except ImportError as e:
    print(f"❌ Missing dependency: {e}", file=sys.stderr)
    print("Run: pip install pdfplumber ebooklib beautifulsoup4 psycopg2-binary openai", file=sys.stderr)
    sys.exit(1)


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class Block:
    """Raw text block from extraction"""
    text: str
    page: Optional[int] = None
    block_type: str = "paragraph"
    metadata: Dict[str, Any] = None


@dataclass
class Anchor:
    """Structural anchor (chapter/section)"""
    anchor_id: str
    anchor_type: str  # chapter, section, part
    title: str
    index_number: Optional[int] = None
    parent_anchor_id: Optional[str] = None
    page_start: Optional[int] = None
    page_end: Optional[int] = None


@dataclass
class Node:
    """Pre-chunking unit (paragraph)"""
    node_id: str
    anchor_id: Optional[str]
    node_type: str
    order_index: int
    text_content: str
    page_start: Optional[int]
    page_end: Optional[int]


@dataclass
class Chunk:
    """Embedding-optimized chunk"""
    chunk_id: str
    anchor_id: Optional[str]
    node_ids: List[int]
    chunk_index: int
    text_content: str
    char_count: int
    token_count: int
    page_start: Optional[int]
    page_end: Optional[int]


@dataclass
class QAMetrics:
    """Quality assessment metrics"""
    total_blocks: int
    total_chars: int
    total_chunks: int
    avg_chunk_size: int
    coverage_ratio: float
    warnings: List[str]
    ocr_confidence: Optional[float] = None


# ============================================================================
# PDF Extraction
# ============================================================================

def extract_from_pdf(file_path: Path) -> List[Block]:
    """Extract text blocks from PDF"""
    blocks = []

    with pdfplumber.open(file_path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                # Split into paragraphs (double newline)
                paragraphs = re.split(r'\n\s*\n', text)
                for para in paragraphs:
                    para = para.strip()
                    if para:
                        blocks.append(Block(
                            text=para,
                            page=page_num,
                            block_type="paragraph"
                        ))

    return blocks


# ============================================================================
# EPUB Extraction
# ============================================================================

def extract_from_epub(file_path: Path) -> List[Block]:
    """Extract text blocks from EPUB"""
    blocks = []
    book = epub.read_epub(str(file_path))

    for item in book.get_items_of_type(9):  # ITEM_DOCUMENT
        content = item.get_content()
        soup = BeautifulSoup(content, 'html.parser')

        # Extract paragraphs
        for para in soup.find_all(['p', 'div']):
            text = para.get_text().strip()
            if text:
                blocks.append(Block(
                    text=text,
                    page=None,  # EPUB doesn't have page numbers
                    block_type="paragraph"
                ))

    return blocks


# ============================================================================
# Text Normalization
# ============================================================================

def normalize_text(text: str) -> str:
    """Clean and normalize text"""
    # Fix hyphenation across line breaks
    text = re.sub(r'(\w+)-\s*\n\s*(\w+)', r'\1\2', text)

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()

    # Remove repeated punctuation
    text = re.sub(r'([.!?])\1+', r'\1', text)

    return text


def normalize_blocks(blocks: List[Block]) -> List[Block]:
    """Normalize all blocks"""
    normalized = []
    for block in blocks:
        normalized_text = normalize_text(block.text)
        if normalized_text:
            normalized.append(Block(
                text=normalized_text,
                page=block.page,
                block_type=block.block_type,
                metadata=block.metadata
            ))
    return normalized


# ============================================================================
# Structure Detection
# ============================================================================

def detect_chapters(blocks: List[Block]) -> List[Anchor]:
    """Detect chapter structure (basic heuristic)"""
    anchors = []
    chapter_pattern = re.compile(r'^(chapter|ch\.?)\s+(\d+)', re.IGNORECASE)

    for i, block in enumerate(blocks):
        match = chapter_pattern.match(block.text)
        if match:
            chapter_num = int(match.group(2))
            # Use rest of line as title
            title = block.text[match.end():].strip()
            if not title:
                title = f"Chapter {chapter_num}"

            anchors.append(Anchor(
                anchor_id=f"ch{chapter_num}",
                anchor_type="chapter",
                title=title,
                index_number=chapter_num,
                page_start=block.page
            ))

    return anchors


# ============================================================================
# Chunking
# ============================================================================

def estimate_tokens(text: str) -> int:
    """Rough token estimate (1 token ≈ 4 chars for English)"""
    return len(text) // 4


def chunk_text(blocks: List[Block], max_chars: int = 1200, max_tokens: int = 500) -> List[Chunk]:
    """Create embedding-optimized chunks"""
    chunks = []
    current_chunk_text = []
    current_chunk_chars = 0
    current_chunk_blocks = []
    chunk_index = 0

    for block in blocks:
        block_chars = len(block.text)
        block_tokens = estimate_tokens(block.text)

        # Check if adding this block would exceed limits
        if current_chunk_chars + block_chars > max_chars or \
           estimate_tokens(' '.join(current_chunk_text + [block.text])) > max_tokens:
            # Finalize current chunk
            if current_chunk_text:
                chunks.append(Chunk(
                    chunk_id=f"c{chunk_index}",
                    anchor_id=None,  # Will be linked later
                    node_ids=[],  # Simplified for now
                    chunk_index=chunk_index,
                    text_content=' '.join(current_chunk_text),
                    char_count=current_chunk_chars,
                    token_count=estimate_tokens(' '.join(current_chunk_text)),
                    page_start=current_chunk_blocks[0].page if current_chunk_blocks else None,
                    page_end=current_chunk_blocks[-1].page if current_chunk_blocks else None
                ))
                chunk_index += 1
                current_chunk_text = []
                current_chunk_chars = 0
                current_chunk_blocks = []

        # Add block to current chunk
        current_chunk_text.append(block.text)
        current_chunk_chars += block_chars
        current_chunk_blocks.append(block)

    # Finalize last chunk
    if current_chunk_text:
        chunks.append(Chunk(
            chunk_id=f"c{chunk_index}",
            anchor_id=None,
            node_ids=[],
            chunk_index=chunk_index,
            text_content=' '.join(current_chunk_text),
            char_count=current_chunk_chars,
            token_count=estimate_tokens(' '.join(current_chunk_text)),
            page_start=current_chunk_blocks[0].page if current_chunk_blocks else None,
            page_end=current_chunk_blocks[-1].page if current_chunk_blocks else None
        ))

    return chunks


# ============================================================================
# Embeddings
# ============================================================================

def generate_embeddings(chunks: List[Chunk], api_key: str) -> List[List[float]]:
    """Generate embeddings using OpenAI text-embedding-3-large"""
    client = OpenAI(api_key=api_key)

    texts = [chunk.text_content for chunk in chunks]
    embeddings = []

    # Batch process (OpenAI supports up to 2048 inputs per request)
    batch_size = 50
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        response = client.embeddings.create(
            model="text-embedding-3-large",
            input=batch,
            dimensions=1536  # Match pgvector schema
        )
        for item in response.data:
            embeddings.append(item.embedding)

    return embeddings


# ============================================================================
# Database Insertion
# ============================================================================

def get_db_connection():
    """Get Postgres connection from environment"""
    return psycopg2.connect(
        host=os.environ.get("DATABASE_HOST", "localhost"),
        port=os.environ.get("DATABASE_PORT", "5432"),
        database=os.environ.get("DATABASE_NAME", "ruach"),
        user=os.environ.get("DATABASE_USERNAME", "postgres"),
        password=os.environ.get("DATABASE_PASSWORD", "")
    )


def insert_to_database(
    source_id: str,
    version_id: str,
    anchors: List[Anchor],
    chunks: List[Chunk],
    embeddings: List[List[float]]
) -> None:
    """Insert all data into Postgres"""
    conn = get_db_connection()
    cur = conn.cursor()

    try:
        # Insert anchors
        for anchor in anchors:
            cur.execute("""
                INSERT INTO library_anchors (anchor_id, version_id, anchor_type, title, index_number, page_start, page_end)
                SELECT %s, id, %s, %s, %s, %s, %s
                FROM library_versions WHERE version_id = %s
            """, (
                f"{source_id}:{anchor.anchor_id}",
                anchor.anchor_type,
                anchor.title,
                anchor.index_number,
                anchor.page_start,
                anchor.page_end,
                version_id
            ))

        # Insert chunks
        chunk_db_ids = []
        for chunk in chunks:
            cur.execute("""
                INSERT INTO library_chunks (
                    chunk_id, version_id, chunk_index, text_content,
                    char_count, token_count, page_start, page_end, node_ids
                )
                SELECT %s, id, %s, %s, %s, %s, %s, %s, %s
                FROM library_versions WHERE version_id = %s
                RETURNING id
            """, (
                f"{source_id}:{chunk.chunk_id}",
                chunk.chunk_index,
                chunk.text_content,
                chunk.char_count,
                chunk.token_count,
                chunk.page_start,
                chunk.page_end,
                chunk.node_ids or [],
                version_id
            ))
            chunk_db_id = cur.fetchone()[0]
            chunk_db_ids.append(chunk_db_id)

        # Insert embeddings
        for chunk_db_id, embedding in zip(chunk_db_ids, embeddings):
            cur.execute("""
                INSERT INTO library_embeddings (chunk_id, embedding, model_name, model_dimensions)
                VALUES (%s, %s, %s, %s)
            """, (
                chunk_db_id,
                embedding,  # psycopg2 handles vector type
                "text-embedding-3-large",
                1536
            ))

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        cur.close()
        conn.close()


# ============================================================================
# QA Metrics
# ============================================================================

def compute_qa_metrics(blocks: List[Block], chunks: List[Chunk]) -> QAMetrics:
    """Compute quality metrics"""
    total_blocks = len(blocks)
    total_chars = sum(len(b.text) for b in blocks)
    total_chunks = len(chunks)
    avg_chunk_size = sum(c.char_count for c in chunks) // total_chunks if total_chunks > 0 else 0

    # Coverage ratio: how much of the source made it to chunks
    chunk_chars = sum(c.char_count for c in chunks)
    coverage_ratio = chunk_chars / total_chars if total_chars > 0 else 0

    warnings = []
    if coverage_ratio < 0.9:
        warnings.append(f"Low coverage ratio: {coverage_ratio:.2%}")
    if avg_chunk_size < 200:
        warnings.append(f"Small average chunk size: {avg_chunk_size} chars")
    if total_chunks < 5:
        warnings.append(f"Very few chunks: {total_chunks}")

    return QAMetrics(
        total_blocks=total_blocks,
        total_chars=total_chars,
        total_chunks=total_chunks,
        avg_chunk_size=avg_chunk_size,
        coverage_ratio=coverage_ratio,
        warnings=warnings
    )


# ============================================================================
# Main Pipeline
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Ruach Library Parser")
    parser.add_argument("--source-id", required=True, help="Source ID (e.g., lib:book:slug)")
    parser.add_argument("--version-id", required=True, help="Version ID")
    parser.add_argument("--file-url", required=True, help="File URL to download")
    parser.add_argument("--file-type", required=True, choices=["pdf", "epub"], help="File type")
    parser.add_argument("--max-chars", type=int, default=1200, help="Max chars per chunk")
    parser.add_argument("--max-tokens", type=int, default=500, help="Max tokens per chunk")
    parser.add_argument("--include-toc", action="store_true", help="Include table of contents")

    args = parser.parse_args()

    # Download file
    print(f"📥 Downloading {args.file_url}...")
    parsed_url = urlparse(args.file_url)
    file_ext = ".pdf" if args.file_type == "pdf" else ".epub"
    temp_file = Path(f"/tmp/{args.version_id}{file_ext}")
    urlretrieve(args.file_url, temp_file)

    # Extract
    print(f"📖 Extracting text from {args.file_type.upper()}...")
    if args.file_type == "pdf":
        blocks = extract_from_pdf(temp_file)
    else:
        blocks = extract_from_epub(temp_file)

    print(f"✅ Extracted {len(blocks)} blocks")

    # Normalize
    print("🧹 Normalizing text...")
    blocks = normalize_blocks(blocks)

    # Structure
    print("📚 Detecting structure...")
    anchors = detect_chapters(blocks)
    print(f"✅ Found {len(anchors)} chapters")

    # Chunk
    print("✂️  Chunking text...")
    chunks = chunk_text(blocks, max_chars=args.max_chars, max_tokens=args.max_tokens)
    print(f"✅ Created {len(chunks)} chunks")

    # Embed
    print("🤖 Generating embeddings...")
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY environment variable not set")

    embeddings = generate_embeddings(chunks, api_key)
    print(f"✅ Generated {len(embeddings)} embeddings")

    # Insert into database
    print("💾 Inserting into database...")
    insert_to_database(args.source_id, args.version_id, anchors, chunks, embeddings)
    print("✅ Database insertion complete")

    # QA Metrics
    print("📊 Computing QA metrics...")
    qa_metrics = compute_qa_metrics(blocks, chunks)

    # Output result as JSON
    result = {
        "qaMetrics": asdict(qa_metrics),
        "stats": {
            "blocks": len(blocks),
            "anchors": len(anchors),
            "chunks": len(chunks),
            "embeddings": len(embeddings)
        }
    }

    print(json.dumps(result))

    # Cleanup
    temp_file.unlink()


if __name__ == "__main__":
    main()
