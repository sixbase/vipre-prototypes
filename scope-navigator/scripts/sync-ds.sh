#!/usr/bin/env bash
# Re-vendor the design system into this prototype. The DS
# (../../vipre-design-system) is the source of truth; this prototype consumes it.
#
# Syncs THREE things, which must move together — the compiled CSS targets the
# markup the components render, so vendoring one without the other silently
# breaks layout (e.g. .vds-metric__in styles landing on markup that has no such
# wrapper). Run whenever the DS changes:  npm run sync:ds
#
#   1. dist/vipre.css  → src/vipre.css        (tokens + typescale + component CSS)
#   2. src/lib/        → src/vds/lib/         (cx.js etc, imported by components)
#   3. src/components/ → src/vds/components/  (the component JSX)
#
# Prototype-local forks are NOT overwritten — see FORKED below.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DS="$HERE/../../vipre-design-system"
DEST="$HERE/src/vipre.css"

# ---- prototype-local forks, protected from the sync -------------------------
# ScopeNavigator: the prototype extracted TypeChip/DropdownPopover into a local
# parts.jsx so the MSP left-nav breadcrumb (ScopeTree.jsx) could reuse them. The
# DS's ScopeNavigator is self-contained and has neither file, so syncing it would
# delete ScopeTree + parts and break the MSP shell. Excluded until the refactor is
# upstreamed to the DS — at which point drop this and delete the local copies.
FORKED=(ScopeNavigator)

if [ ! -d "$DS" ]; then
  echo "✗ design system not found at $DS" >&2
  exit 1
fi

# ---- 1. styles --------------------------------------------------------------
echo "→ building DS styles…"
( cd "$DS" && npm run --silent build:styles )

echo "→ vendoring dist/vipre.css → src/vipre.css"
{
  printf '%s\n' '/* Vendored from vipre-design-system dist/vipre.css (build:styles output).'
  printf '%s\n' '   = tokens + Rubik typescale classes + every component BEM style, in one file.'
  printf '%s\n' '   Snapshot copied in so the GitHub Pages build stays self-contained. Re-sync:'
  printf '%s\n' '     npm run sync:ds   (rebuilds the DS, re-copies this file AND the components)'
  printf '%s\n' '   --vds-* custom props are mapped into Tailwind @theme in index.css. */'
  cat "$DS/dist/vipre.css"
} > "$DEST"
echo "  ✓ $(wc -l < "$DEST" | tr -d ' ') lines"

# ---- 2. lib -----------------------------------------------------------------
echo "→ vendoring src/lib → src/vds/lib"
rsync -a --delete "$DS/src/lib/" "$HERE/src/vds/lib/"

# ---- 3. components ----------------------------------------------------------
# --delete keeps the copy honest (components removed from the DS disappear here).
# rsync protects --exclude'd paths from deletion by default, so the forks survive.
echo "→ vendoring src/components → src/vds/components"
EXCLUDES=()
for f in "${FORKED[@]}"; do EXCLUDES+=(--exclude "/$f/"); done
rsync -a --delete "${EXCLUDES[@]}" "$DS/src/components/" "$HERE/src/vds/components/"

# The DS barrel doesn't know about the prototype's local additions, so re-export
# them after copying. ScopeNavigator/index.js is inside the excluded fork and
# still exports ScopeTree alongside the standard ScopeNavigator names.
cat >> "$HERE/src/vds/components/index.js" <<'EOF'

// ---- prototype-local additions (not yet upstreamed to the DS) ----
// Appended by scripts/sync-ds.sh — see FORKED there.
export { ScopeTree } from './ScopeNavigator/index.js'
EOF

echo "  ✓ $(find "$HERE/src/vds/components" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ') components"
echo "  ⚠ forked, not synced: ${FORKED[*]}"
echo "✓ synced"
