#!/bin/bash
# Quick script to create a new golden run folder

if [ -z "$1" ]; then
  echo "Usage: ./create-run.sh <session-id>"
  echo "Example: ./create-run.sh abc-123"
  exit 1
fi

SESSION_ID=$1
DATE=$(date +%Y-%m-%d)
RUN_DIR="$DATE-session-$SESSION_ID"

echo "Creating golden run folder: $RUN_DIR"
mkdir -p "$RUN_DIR"

# Create empty files
touch "$RUN_DIR/sessionId.txt"
touch "$RUN_DIR/transcriptId.txt"
touch "$RUN_DIR/syncOffsets_ms.json"
touch "$RUN_DIR/export.srt"
touch "$RUN_DIR/export.vtt"

# Copy template notes
cp TEMPLATE_notes.md "$RUN_DIR/notes.md"

# Add session ID to file
echo "$SESSION_ID" > "$RUN_DIR/sessionId.txt"

echo ""
echo "✅ Golden run folder created: $RUN_DIR"
echo ""
echo "Next steps:"
echo "1. Run the golden run tests"
echo "2. Save artifacts to this folder:"
echo "   - transcriptId.txt"
echo "   - syncOffsets_ms.json"
echo "   - export.srt"
echo "   - export.vtt"
echo "   - screenproof-20s.mov"
echo "   - screenshots (aligned, before/after edits)"
echo "3. Fill out notes.md"
echo ""
