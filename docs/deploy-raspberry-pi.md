# Deploying to a Raspberry Pi 5 (Docker)

[← Documentation index](README.md)

The production stack is defined in
[`docker-compose.prod.yml`](../docker-compose.prod.yml) and builds three
services natively on the Pi's arm64 architecture:

- **db** — PostgreSQL 16 (schema + seed applied on first start)
- **backend** — Node.js API ([`backend/Dockerfile`](../backend/Dockerfile))
- **frontend** — Vue SPA built and served by nginx, which also proxies `/api`
  to the backend ([`frontend/Dockerfile`](../frontend/Dockerfile),
  [`frontend/nginx.conf`](../frontend/nginx.conf))

Only the frontend port is published (default `8080`); the API and database stay
on the internal compose network.

## Prerequisites on the Pi

- Docker + the Compose plugin (already installed on this Pi).
- The project files on the Pi (see transfer options below).

## 1. Get the code onto the Pi

Pick whichever fits your access:

**a) Over SSH from your computer (the files already live here):**

```bash
PI_HOST=95.173.229.167 PI_USER=raspberry ./deploy/deploy.sh
```

This `rsync`s the project and runs the build/start on the Pi in one shot. For
password auth, set up an SSH key first, or wrap the ssh/rsync calls with
`sshpass`.

**b) Via the casos web terminal (no direct SSH):**

1. Upload the project to the Pi using the panel's file manager (or
   `git clone` if you push this repo to a Git host first).
2. In the web terminal, continue with step 2 below.

## 2. Configure environment

```bash
cd ~/site_management
cp .env.prod.example .env
nano .env          # set strong POSTGRES_PASSWORD and JWT_SECRET
```

## 3. Build and start

```bash
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend   # optional
```

The first build takes a few minutes on a Pi. PostgreSQL applies
[`db/init`](../db/init) automatically on the first run.

## 4. Open it

```
http://<pi-ip>:8080
```

Sign in with a demo account (password `password123`) — change passwords from the
profile menu, and change `JWT_SECRET`/`POSTGRES_PASSWORD` before real use.

## Updating later

```bash
cd ~/site_management
git pull            # or re-run ./deploy/deploy.sh from your computer
docker compose -f docker-compose.prod.yml up -d --build
```

> Schema/seed only run on an empty database volume. To reset data:
> `docker compose -f docker-compose.prod.yml down -v` (deletes the DB).
