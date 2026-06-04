#!/bin/bash
#
# Runs the two servers you use, from YOUR terminal so they stay up.
#   Scope Navigator     -> http://localhost:5179
#   Vipre Design System -> http://localhost:5182
#
# Usage:  ./dev.sh        Stop: press Ctrl+C (stops both together)
#
export PATH="/opt/homebrew/bin:$PATH"

echo "Freeing ports 5179 and 5182 if anything is on them..."
lsof -ti:5179,5182 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

echo "Starting servers..."
(cd "/Users/alvinthong/new wonder/scope-navigator" && npx vite --port 5179 --strictPort) &
(cd "/Users/alvinthong/vipre-design-system"        && npx vite --port 5182 --strictPort) &

# Ctrl+C stops both
trap 'echo; echo "Stopping both servers..."; kill 0' INT TERM

cat <<'EOF'

  ┌──────────────────────────────────────────────┐
  │  Scope Navigator      http://localhost:5179    │
  │  Vipre Design System  http://localhost:5182    │
  └──────────────────────────────────────────────┘
  Press Ctrl+C to stop both.

EOF

wait
