# Site Management

A comprehensive **Property & Site Management** web application that streamlines
financial transactions and maintenance operations for residential sites. It
automates payment tracking, manages cleaning schedules, and clearly assigns
daily or weekly cleaning responsibilities to designated staff or residents.

> **Status:** Working application. A Vue 3 SPA, an Express + PostgreSQL REST API,
> and a Dockerized database are implemented and runnable locally — see
> [Getting started](#getting-started).

---

## Highlights

- **Payment tracking** — Any user can create and name a transaction. When a
  transaction is of the *payment* type, it appears in the Payments tab where
  other users can see it and mark it as paid. Everyone's outstanding debt and
  the transactions they have made are clearly trackable. See
  [docs/features/payments.md](docs/features/payments.md).
- **Cleaning schedules** — Define cleaning tasks and assign them to staff or
  residents on a daily or weekly cadence. See
  [docs/features/cleaning.md](docs/features/cleaning.md).
- **Properties & units** — Model buildings, units, and the residents who occupy
  them. See [docs/features/properties.md](docs/features/properties.md).
- **Users & authentication** — Role-based accounts (admin, staff, resident).
  See [docs/features/authentication.md](docs/features/authentication.md).

## Architecture overview

| Layer          | Technology   | Notes                                                       |
| -------------- | ------------ | ----------------------------------------------------------- |
| Frontend       | Vue.js       | Modern, reactive single-page application.                   |
| Database       | PostgreSQL   | Robust relational storage.                                  |
| Infrastructure | Docker       | PostgreSQL runs in a container with automated setup scripts.|

```
┌────────────┐      HTTP/REST       ┌────────────┐      SQL       ┌────────────┐
│  Vue.js    │  ◀───────────────▶  │  API layer │  ◀──────────▶ │ PostgreSQL │
│  frontend  │                      │ (future)   │                │  (Docker)  │
└────────────┘                      └────────────┘                └────────────┘
```

Read the full breakdown in [docs/architecture.md](docs/architecture.md).

## Repository layout

```
site_management/
├── README.md              ← you are here
├── docs/                  ← modular, interconnected documentation
│   ├── README.md          ← documentation index
│   ├── architecture.md
│   ├── setup.md
│   ├── database-schema.md
│   ├── frontend.md
│   └── features/
│       ├── README.md
│       ├── authentication.md
│       ├── properties.md
│       ├── payments.md
│       └── cleaning.md
├── frontend/              ← Vue.js single-page application
├── backend/               ← Express + PostgreSQL REST API
├── db/                    ← database schema & seed scripts
│   └── init/              ← SQL run on first container start
└── docker/               ← Docker Compose & automated setup scripts
    └── scripts/
```

## Getting started

The local environment runs PostgreSQL inside Docker, with a Node API and a Vue
dev server on the host. Full step-by-step instructions — including automated
Docker installation — live in [docs/setup.md](docs/setup.md).

```bash
# 1. database (from the repository root)
./docker/scripts/install-docker.sh   # installs Docker if missing
./docker/scripts/setup.sh            # starts PostgreSQL, applies schema + seed

# 2. API
cd backend && cp .env.example .env && npm install && npm run dev   # :3000

# 3. frontend (new terminal)
cd frontend && npm install && npm run dev                          # :5173
```

Then open <http://localhost:5173> and sign in with a demo account (all use the
password `password123`): `admin@site.test`, `alice@site.test`, `bob@site.test`,
`joe@site.test`.

## Documentation map

- [Documentation index](docs/README.md)
- [Architecture](docs/architecture.md)
- [Local setup & Docker](docs/setup.md)
- [Database schema](docs/database-schema.md)
- [Frontend](docs/frontend.md)
- [Features](docs/features/README.md)
