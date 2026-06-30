# Local setup & Docker

[← Documentation index](README.md) · [← Architecture](architecture.md)

The local environment runs **PostgreSQL inside Docker** so no host-level database
install is required. Two helper scripts automate the process.

## Prerequisites

- A Linux/macOS host with `bash`.
- `sudo` privileges (only needed if Docker is not yet installed).
- Node.js (for the [frontend](frontend.md)) — see that document.

## 1. Install Docker (if needed)

```bash
./docker/scripts/install-docker.sh
```

This script checks whether Docker and the Compose plugin are present and installs
them via the platform package manager if they are missing. It is safe to re-run.

## 2. Start the database

```bash
./docker/scripts/setup.sh
```

This script:

1. Copies [`docker/.env.example`](../docker/.env.example) to `docker/.env` if no
   `.env` exists yet.
2. Brings up the PostgreSQL container defined in
   [`docker/docker-compose.yml`](../docker/docker-compose.yml).
3. On the container's **first** start, PostgreSQL automatically runs every script
   in [`db/init/`](../db/init/) — applying [`01_schema.sql`](../db/init/01_schema.sql).

## Configuration

Database credentials and the exposed port are read from `docker/.env`. Defaults
are provided in [`docker/.env.example`](../docker/.env.example):

| Variable            | Default        | Purpose                          |
| ------------------- | -------------- | -------------------------------- |
| `POSTGRES_USER`     | `site_admin`   | Database superuser.              |
| `POSTGRES_PASSWORD` | `change_me`    | **Change before any real use.**  |
| `POSTGRES_DB`       | `site_management` | Application database name.     |
| `POSTGRES_PORT`     | `5432`         | Host port mapped to the container.|

## Common commands

```bash
# stop the database (data is preserved in the named volume)
docker compose -f docker/docker-compose.yml down

# stop and DELETE all data (forces schema re-init on next start)
docker compose -f docker/docker-compose.yml down -v

# open a psql shell
docker compose -f docker/docker-compose.yml exec db \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

> Because init scripts only run on an empty data volume, run `down -v` after
> changing [`db/init/`](../db/init/) during development.

## Related documents

- [Database schema](database-schema.md)
- [Frontend](frontend.md)
- [Project README](../README.md)
