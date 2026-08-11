#!/usr/bin/env bash
# sync-from-book-writer.sh — copy the canonical skill kit from the book-writer
# dev copy into this plugin repo, so the published plugin tracks the latest
# edits made in book-writer.
#
# Usage: bash scripts/sync-from-book-writer.sh [book-writer-path]
#   default source: ~/Documents/github/book-writer
set -euo pipefail

SRC="${1:-$HOME/Documents/github/book-writer}"
KIT_REL="skills/book-cover-designer"
SRC_KIT="$SRC/$KIT_REL"
DEST_KIT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/plugins/book-cover-designer/skills/book-cover-designer"

if [ ! -d "$SRC_KIT" ]; then
  echo "error: source kit not found: $SRC_KIT" >&2
  exit 1
fi

echo "syncing from: $SRC_KIT"
echo "          to: $DEST_KIT"

# Remove dest first so deletions in the source propagate (rsync --delete).
mkdir -p "$DEST_KIT"
rsync -a --delete \
  --exclude 'bin/install.sh' \
  "$SRC_KIT/" "$DEST_KIT/"

# Show what changed (summary, not full scroll).
git -C "$(dirname "$DEST_KIT")/../../.." diff --stat -- plugins/book-cover-designer/skills/book-cover-designer 2>/dev/null || true

echo "done. Review with: git diff plugins/book-cover-designer/skills/book-cover-designer"
echo "then commit + push in this repo."