#!/bin/bash
# ─────────────────────────────────────────────────────
# ErrPulse Demo Recording Helper
# ─────────────────────────────────────────────────────
#
# Usage:
#   1. Record your screen with QuickTime (Cmd+Shift+5)
#   2. Save as .mov file
#   3. Run this script to convert to optimized GIF:
#
#      ./scripts/record-demo.sh dashboard-demo.mov docs/assets/dashboard.gif
#      ./scripts/record-demo.sh devtools-demo.mov docs/assets/devtools.gif
#
# Tips for recording:
#   - Use a clean browser window (no bookmarks bar, no extensions)
#   - Record at 2x display, script downscales for crisp result
#   - Keep recordings under 30 seconds for GitHub (10MB limit)
#   - Dashboard: show Overview → Errors → click one → Requests → Logs
#   - DevTools: show floating icon → click open → Errors tab → expand one →
#              Console tab → expand JSON → Network tab → expand request →
#              maximize panel → drag icon → close
# ─────────────────────────────────────────────────────

set -e

INPUT="$1"
OUTPUT="$2"
FPS="${3:-12}"
WIDTH="${4:-800}"

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ]; then
  echo "Usage: $0 <input.mov> <output.gif> [fps=12] [width=800]"
  exit 1
fi

if ! command -v ffmpeg &> /dev/null; then
  echo "Error: ffmpeg not found. Install with: brew install ffmpeg"
  exit 1
fi

echo "Converting $INPUT → $OUTPUT (${WIDTH}px, ${FPS}fps)..."

# Generate optimized palette for best quality
PALETTE="/tmp/errpulse-palette.png"
ffmpeg -y -i "$INPUT" \
  -vf "fps=$FPS,scale=$WIDTH:-1:flags=lanczos,palettegen=stats_mode=diff" \
  "$PALETTE" 2>/dev/null

# Convert with palette for high-quality GIF
ffmpeg -y -i "$INPUT" -i "$PALETTE" \
  -lavfi "fps=$FPS,scale=$WIDTH:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" \
  "$OUTPUT" 2>/dev/null

SIZE=$(du -h "$OUTPUT" | cut -f1)
echo "Done! $OUTPUT ($SIZE)"

# Warn if too large for GitHub
BYTES=$(stat -f%z "$OUTPUT" 2>/dev/null || stat -c%s "$OUTPUT" 2>/dev/null)
if [ "$BYTES" -gt 10485760 ]; then
  echo "⚠ File is over 10MB — GitHub may not render it inline."
  echo "  Try: $0 $INPUT $OUTPUT 10 600"
fi
