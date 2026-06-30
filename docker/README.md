# Docker

Infrastructure for running PostgreSQL locally in a container.

| File                                       | Purpose                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| [`docker-compose.yml`](docker-compose.yml) | PostgreSQL service definition.                           |
| [`.env.example`](.env.example)             | Template for credentials/port; copy to `.env`.           |
| [`scripts/install-docker.sh`](scripts/install-docker.sh) | Installs Docker + Compose if missing.      |
| [`scripts/setup.sh`](scripts/setup.sh)     | Creates `.env`, starts the DB, waits until healthy.      |

Full walkthrough: [`docs/setup.md`](../docs/setup.md).

```bash
./docker/scripts/install-docker.sh
./docker/scripts/setup.sh
```
