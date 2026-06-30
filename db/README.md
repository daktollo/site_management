# Database

PostgreSQL schema and seed scripts for Site Management.

- [`init/01_schema.sql`](init/01_schema.sql) — the schema. Every `.sql` file in
  `init/` is executed **in filename order** by PostgreSQL on the container's
  first start (empty data volume).
- Model documentation: [`docs/database-schema.md`](../docs/database-schema.md).
- Setup instructions: [`docs/setup.md`](../docs/setup.md).

> Init scripts run only against an empty volume. After editing files here during
> development, recreate the volume:
> `docker compose -f docker/docker-compose.yml down -v && ./docker/scripts/setup.sh`.
