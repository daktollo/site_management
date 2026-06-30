#!/usr/bin/env bash
# Start the PostgreSQL container and apply the schema. See docs/setup.md.
set -euo pipefail

# Resolve paths relative to this script so it can be run from anywhere.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
ENV_FILE="$DOCKER_DIR/.env"

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
    echo "Docker or the Compose plugin is missing. Run ./docker/scripts/install-docker.sh first." >&2
    exit 1
fi

# Create .env from the example on first run.
if [[ ! -f "$ENV_FILE" ]]; then
    cp "$DOCKER_DIR/.env.example" "$ENV_FILE"
    echo "Created $ENV_FILE from .env.example — review the credentials before production use."
fi

echo "Starting PostgreSQL..."
docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

echo "Waiting for the database to become healthy..."
for _ in $(seq 1 30); do
    status="$(docker inspect -f '{{.State.Health.Status}}' site_management_db 2>/dev/null || echo starting)"
    if [[ "$status" == "healthy" ]]; then
        echo "✓ Database is up and healthy."
        echo "  On first start the schema in db/init/ was applied automatically."
        exit 0
    fi
    sleep 2
done

echo "Database did not report healthy in time. Check logs:" >&2
echo "  docker compose -f $COMPOSE_FILE logs db" >&2
exit 1
