#!/usr/bin/env bash
# Install Docker Engine + Compose plugin if they are not already present.
# Safe to re-run. See docs/setup.md.
set -euo pipefail

if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo "✓ Docker and the Compose plugin are already installed."
    docker --version
    docker compose version
    exit 0
fi

echo "Docker (or the Compose plugin) was not found. Attempting installation..."

if [[ "$(uname -s)" != "Linux" ]]; then
    echo "Automatic install is only scripted for Linux." >&2
    echo "Install Docker Desktop manually: https://docs.docker.com/get-docker/" >&2
    exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo is required to install Docker." >&2
    exit 1
fi

# Use Docker's convenience script, which supports common Linux distributions.
echo "Downloading and running the official Docker install script..."
curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
sudo sh /tmp/get-docker.sh
rm -f /tmp/get-docker.sh

# Allow the current user to run docker without sudo (effective after re-login).
if getent group docker >/dev/null 2>&1; then
    sudo usermod -aG docker "$USER" || true
    echo "Added $USER to the 'docker' group. Log out and back in for it to take effect."
fi

echo "✓ Docker installation complete."
docker --version || true
docker compose version || true
