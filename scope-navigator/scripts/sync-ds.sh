#!/usr/bin/env bash
# Re-vendor the design system's compiled CSS into this prototype.
# The DS (../../vipre-design-system) is the source of truth — this rebuilds its
# styles and copies the fresh dist/vipre.css into src/vipre.css (keeping the
# vendor header). Run whenever the DS changes:  npm run sync:ds
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DS="$HERE/../../vipre-design-system"
DEST="$HERE/src/vipre.css"

if [ ! -d "$DS" ]; then
  echo "✗ design system not found at $DS" >&2
  exit 1
fi

echo "→ building DS styles…"
( cd "$DS" && npm run --silent build:styles )

echo "→ vendoring dist/vipre.css → src/vipre.css"
{
  printf '%s\n' '/* Vendored from vipre-design-system dist/vipre.css (build:styles output).'
  printf '%s\n' '   = tokens + Rubik typescale classes + every component BEM style, in one file.'
  printf '%s\n' '   Snapshot copied in so the GitHub Pages build stays self-contained. Re-sync:'
  printf '%s\n' '     npm run sync:ds   (rebuilds the DS and re-copies this file)'
  printf '%s\n' '   --vds-* custom props are mapped into Tailwind @theme in index.css. */'
  cat "$DS/dist/vipre.css"
} > "$DEST"

echo "✓ synced ($(wc -l < "$DEST" | tr -d ' ') lines)"
