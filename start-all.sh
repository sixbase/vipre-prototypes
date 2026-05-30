#!/bin/bash
#
# Starts all Vipre prototype dev servers at once.
# Usage:  ./start-all.sh
# Stop:   press Ctrl+C (stops all servers together)
#
export PATH="/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")"

# Ports must match the registry in vipre-prototypes/src/App.jsx
#   5180 = Directory (launcher)   5179 = MSP (Scope Navigator)
#   5181 = Action Rules           5183 = Marketing Overview

echo "Cleaning up any servers already on these ports..."
lsof -ti:5179,5180,5181,5183 2>/dev/null | xargs kill -9 2>/dev/null
sleep 1

echo "Starting all prototype servers..."
(cd vipre-prototypes   && npx vite --host --port 5180) &
(cd scope-navigator    && npx vite --host --port 5179) &
(cd action-rules       && npx vite --host --port 5181) &
(cd marketing-overview && npx vite --host --port 5183) &

# Stop every child server when this script is interrupted (Ctrl+C)
trap 'echo; echo "Stopping all servers..."; kill 0' INT TERM

cat <<'EOF'

  ┌─────────────────────────────────────────────┐
  │  Vipre Prototypes — all servers starting up  │
  ├─────────────────────────────────────────────┤
  │  Directory (launcher)  http://localhost:5180 │
  │  MSP (Scope Navigator) http://localhost:5179 │
  │  Action Rules          http://localhost:5181 │
  │  Marketing Overview    http://localhost:5183 │
  └─────────────────────────────────────────────┘

  Press Ctrl+C to stop all servers.

EOF

wait
