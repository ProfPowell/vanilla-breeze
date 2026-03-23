#!/usr/bin/env bash
# download-fonts.sh — Fetch variable font woff2 files for font packs
#
# Downloads from Google Fonts API (Latin subset).
# Run from repo root: bash scripts/download-fonts.sh
#
# Requirements: curl

set -euo pipefail
cd "$(dirname "$0")/.."

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

echo "=== Downloading variable font files ==="
echo ""

# Helper: extract the Latin subset woff2 URL from Google Fonts CSS
# Google Fonts response has /* latin */ comment before the Latin block
extract_latin_woff2() {
  grep -A8 '/\* latin \*/' | grep -o 'url([^)]*\.woff2)' | head -1 | sed 's/url(//;s/)//'
}

# Helper: extract first woff2 URL (for fonts with no unicode-range split)
extract_first_woff2() {
  grep -o 'url([^)]*\.woff2)' | head -1 | sed 's/url(//;s/)//'
}

# Helper: download a font file from Google Fonts CSS API
# Usage: download_gfont <css_url> <output_path> <label> [use_first]
download_gfont() {
  local css_url="$1"
  local output="$2"
  local label="$3"
  local use_first="${4:-}"

  local css
  css=$(curl -sS -H "User-Agent: $UA" "$css_url")

  local url
  if [ "$use_first" = "first" ]; then
    url=$(echo "$css" | extract_first_woff2)
  else
    url=$(echo "$css" | extract_latin_woff2)
    # Fallback to first URL if no latin block found
    if [ -z "$url" ]; then
      url=$(echo "$css" | extract_first_woff2)
    fi
  fi

  if [ -n "$url" ]; then
    curl -sS -o "$output" "$url"
    local size
    size=$(wc -c < "$output" | tr -d ' ')
    echo "  OK $label ($((size / 1024))KB)"
    return 0
  else
    echo "  WARN: Could not extract URL for $label"
    return 1
  fi
}

# ─── Foundation Pack ───
FDIR="src/packs/fonts-foundation/fonts"

echo "Foundation Pack:"
download_gfont \
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&display=swap" \
  "$FDIR/inter-variable.woff2" "Inter upright"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@1,14..32,100..900&display=swap" \
  "$FDIR/inter-variable-italic.woff2" "Inter italic"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@0,7..72,200..900&display=swap" \
  "$FDIR/literata-variable.woff2" "Literata upright"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@1,7..72,200..900&display=swap" \
  "$FDIR/literata-variable-italic.woff2" "Literata italic"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Recursive:slnt,wght,CASL,MONO@-15..0,300..1000,0..1,0..1&display=swap" \
  "$FDIR/recursive-variable.woff2" "Recursive"

# ─── Display Pack ───
DDIR="src/packs/fonts-display/fonts"

echo ""
echo "Display Pack:"
download_gfont \
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@0,9..144,100..900,0..100,0..1&display=swap" \
  "$DDIR/fraunces-variable.woff2" "Fraunces upright"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght,SOFT,WONK@1,9..144,100..900,0..100,0..1&display=swap" \
  "$DDIR/fraunces-variable-italic.woff2" "Fraunces italic"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@0,300..700&display=swap" \
  "$DDIR/cormorant-variable.woff2" "Cormorant upright"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Cormorant:ital,wght@1,300..700&display=swap" \
  "$DDIR/cormorant-variable-italic.woff2" "Cormorant italic"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900&display=swap" \
  "$DDIR/bodoni-moda-variable.woff2" "Bodoni Moda upright"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@1,6..96,400..900&display=swap" \
  "$DDIR/bodoni-moda-variable-italic.woff2" "Bodoni Moda italic"

# ─── Expressive Pack ───
EDIR="src/packs/fonts-expressive/fonts"

echo ""
echo "Expressive Pack:"
download_gfont \
  "https://fonts.googleapis.com/css2?family=Nabla:EDPT,EHLT@0..200,0..24&display=swap" \
  "$EDIR/nabla-variable.woff2" "Nabla"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Honk:MORF,SHLN@0..40,0..50&display=swap" \
  "$EDIR/honk-variable.woff2" "Honk"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Kablammo:MORF@0..40&display=swap" \
  "$EDIR/kablammo-variable.woff2" "Kablammo"

# ─── Icons ───
IDIR="src/packs/icons/fonts"

echo ""
echo "Icons Pack:"
download_gfont \
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" \
  "$IDIR/material-symbols-outlined.woff2" "Material Symbols Outlined" "first"

echo ""
echo "=== Summary ==="
echo ""

# Summary
TOTAL=0
for f in src/packs/*/fonts/*.woff2; do
  if [ -f "$f" ]; then
    SIZE=$(wc -c < "$f" | tr -d ' ')
    TOTAL=$((TOTAL + SIZE))
    echo "  $((SIZE / 1024))KB  $f"
  fi
done
echo ""
echo "Total: $((TOTAL / 1024))KB uncompressed"

# ─── Memphis Pack ───
MDIR="src/packs/memphis/fonts"

echo ""
echo "Memphis Pack:"
download_gfont \
  "https://fonts.googleapis.com/css2?family=Boogaloo&display=swap" \
  "$MDIR/boogaloo-400.woff2" "Boogaloo 400"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Outfit:wght@400&display=swap" \
  "$MDIR/outfit-400.woff2" "Outfit 400"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Outfit:wght@700&display=swap" \
  "$MDIR/outfit-700.woff2" "Outfit 700"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Outfit:wght@900&display=swap" \
  "$MDIR/outfit-900.woff2" "Outfit 900"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Space+Mono&display=swap" \
  "$MDIR/space-mono-400.woff2" "Space Mono 400"

download_gfont \
  "https://fonts.googleapis.com/css2?family=Space+Mono:wght@700&display=swap" \
  "$MDIR/space-mono-700.woff2" "Space Mono 700"
