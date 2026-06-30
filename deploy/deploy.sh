#!/usr/bin/env bash
# Deploy the production stack to a remote host (e.g. Raspberry Pi 5) over SSH.
# Syncs the project, then builds + starts the containers there.
#
# Usage:
#   PI_HOST=95.173.229.167 ./deploy/deploy.sh
# Optional env: PI_USER (default raspberry), SSH_PORT (default 22),
#               PI_DIR (default /home/<user>/site_management)
# Password auth: install sshpass and prefix with SSHPASS='...' plus
#   RSYNC_RSH / ssh using sshpass, or (recommended) set up an SSH key first.
set -euo pipefail

PI_USER="${PI_USER:-raspberry}"
PI_HOST="${PI_HOST:?set PI_HOST to the Pi IP/hostname}"
SSH_PORT="${SSH_PORT:-22}"
PI_DIR="${PI_DIR:-/home/$PI_USER/site_management}"

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "→ Syncing project to $PI_USER@$PI_HOST:$PI_DIR"
rsync -az --delete \
  --exclude '.git' \
  --exclude 'node_modules' \
  --exclude 'dist' \
  --exclude '.env' \
  -e "ssh -p $SSH_PORT" \
  "$ROOT/" "$PI_USER@$PI_HOST:$PI_DIR/"

echo "→ Building and starting containers on the Pi"
ssh -p "$SSH_PORT" "$PI_USER@$PI_HOST" bash -s <<EOF
set -euo pipefail
cd "$PI_DIR"
[ -f .env ] || cp .env.prod.example .env
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
EOF

echo "✓ Deployed. Web UI: http://$PI_HOST:8080 (or your WEB_PORT)"
