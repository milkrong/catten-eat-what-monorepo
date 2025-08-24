#!/usr/bin/env bash
set -euo pipefail

# Run service and app concurrently and handle shutdown
pids=()

start() {
  local name="$1"
  shift
  echo "Starting $name: $*"
  (
    exec "$@"
  ) &
  pids+=($!)
}

# Start the API service (Bun)
start "service" bun run --cwd "$PWD/catten-eat-what-service" dev

# Start the Expo app
start "app" bun run --cwd "$PWD/eat-what-app" start

cleanup() {
  echo "\nStopping processes..."
  for pid in "${pids[@]}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
  done
  # Wait for any remaining processes to finish
  wait || true
}

trap cleanup INT TERM EXIT

# Portable: wait for all child processes (macOS Bash doesn't support `wait -n`)
wait || true
exit 0

