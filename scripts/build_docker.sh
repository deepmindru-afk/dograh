#!/usr/bin/env bash
set -euo pipefail

# Build Docker images with submodule initialization.
#
# Usage:
#   ./scripts/build_docker.sh              # build all services
#   ./scripts/build_docker.sh api          # build only the api service
#   ./scripts/build_docker.sh --no-cache   # build with --no-cache flag

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOGRAH_DIR="$(dirname "$SCRIPT_DIR")"

cd "$DOGRAH_DIR"

# Ensure pipecat submodule is initialized before Docker build.
# The Dockerfile uses COPY pipecat /tmp/pipecat, which copies an empty
# directory if the submodule isn't checked out — causing a build failure.
echo "→ Ensuring pipecat submodule is initialized..."
git submodule update --init pipecat
echo "✓ pipecat submodule initialized at $(git -C pipecat rev-parse --short HEAD)"

# Build Docker images with docker compose
echo "→ Building Docker images..."
docker compose build "$@"
