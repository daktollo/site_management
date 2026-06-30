# Backend

REST API for Site Management — Node.js + Express + PostgreSQL (`pg`), with JWT
authentication and bcrypt password hashing.

## Run

```bash
cp .env.example .env       # adjust if your DB port/credentials differ
npm install
npm run dev                # or: npm start
```

The server reads its config from `.env` (see [`src/config.js`](src/config.js))
and waits for the database to become reachable before listening. Requires the
PostgreSQL container from [`../docker`](../docker) to be running — see
[`../docs/setup.md`](../docs/setup.md).

## Layout

```
src/
├── index.js            app entry; mounts routes, error handling
├── config.js           env-driven configuration
├── db.js               pg pool + waitForDb()
├── middleware/auth.js  JWT authenticate() + requireRole()
└── routes/
    ├── auth.js         POST /login, GET /me
    ├── users.js        GET/POST /users
    ├── properties.js   properties + units
    ├── payments.js     transactions, shares, debts, mark-as-paid
    └── cleaning.js     tasks + assignments
```

## API reference

All routes are under `/api`. All except `/auth/login` and `/health` require an
`Authorization: Bearer <token>` header.

| Method | Path                                  | Notes                                   |
| ------ | ------------------------------------- | --------------------------------------- |
| GET    | `/health`                             | Liveness check.                         |
| POST   | `/auth/login`                         | `{ email, password }` → `{ token, user }`. |
| GET    | `/auth/me`                            | Current user.                           |
| GET    | `/users`                              | List users.                             |
| POST   | `/users`                              | Admin: create user.                     |
| GET    | `/properties`                         | Properties with units & residents.      |
| POST   | `/properties`                         | Admin: add property.                    |
| POST   | `/properties/:id/units`               | Admin: add unit.                        |
| GET    | `/payments/transactions`              | All transactions with shares.           |
| GET    | `/payments/my`                        | Current user's shares (Payments tab).   |
| GET    | `/payments/debts`                     | Everyone's outstanding debt.            |
| POST   | `/payments/transactions`              | Create a named transaction (+shares).   |
| POST   | `/payments/shares/:id/pay`            | Mark a share paid (owner or admin).     |
| GET    | `/cleaning/tasks`                     | Task definitions.                       |
| POST   | `/cleaning/tasks`                     | Admin: create task.                     |
| GET    | `/cleaning/assignments[?mine=1]`      | Assignments (optionally just mine).     |
| POST   | `/cleaning/assignments`               | Admin: assign task.                     |
| POST   | `/cleaning/assignments/:id/done`      | Mark done (assignee or admin).          |

## Demo accounts

All seeded users share the password `password123`:
`admin@site.test`, `joe@site.test` (staff), `alice@site.test`, `bob@site.test`,
`carol@site.test` (residents).
