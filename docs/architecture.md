# Architecture

[← Documentation index](README.md) · [← Project README](../README.md)

## Overview

Site Management is a three-tier web application:

1. **Presentation tier** — a Vue.js single-page application (SPA) that renders
   the reactive UI for payments, cleaning schedules, properties, and account
   management.
2. **Application tier** — a REST API that enforces business rules (authentication,
   debt calculation, assignment scheduling). *Not yet implemented; documented
   here so the contract is clear.*
3. **Data tier** — a PostgreSQL database running inside Docker.

```
┌──────────────────────┐       ┌──────────────────────┐       ┌──────────────────┐
│  Vue.js SPA          │       │  REST API (future)   │       │  PostgreSQL       │
│  - Payments tab      │  REST │  - Auth & sessions   │  SQL  │  (Docker)         │
│  - Cleaning tab      │ ────▶ │  - Debt calculation  │ ────▶ │  - users          │
│  - Properties tab    │ ◀──── │  - Scheduling        │ ◀──── │  - transactions   │
│  - Admin             │       │  - Validation        │       │  - cleaning_*     │
└──────────────────────┘       └──────────────────────┘       └──────────────────┘
```

## Technology decisions

| Concern        | Choice      | Rationale                                                          |
| -------------- | ----------- | ----------------------------------------------------------------- |
| UI framework   | Vue.js      | Reactive components and a gentle learning curve for the team.      |
| Database       | PostgreSQL  | Strong relational guarantees for financial data and assignments.   |
| Infrastructure | Docker      | Reproducible local DB; no host-level PostgreSQL install required.  |

## Data flow: marking a payment as paid

This is the core financial flow (full detail in
[features/payments.md](features/payments.md)):

1. A user **creates and names a transaction** through the SPA.
2. If the transaction's type is `payment`, the API records it and generates the
   per-user amounts owed.
3. The transaction surfaces in every relevant user's **Payments tab**, showing
   its name and the amount due.
4. A user **marks their portion as paid**; the API updates the payment record
   and recomputes outstanding debt.
5. Balances and transaction history stay queryable for everyone.

## Cross-cutting concerns

- **Authentication & roles** — see [features/authentication.md](features/authentication.md).
- **Persistence model** — see [database-schema.md](database-schema.md).
- **Environment & deployment** — see [setup.md](setup.md).

## Related documents

- [Database schema](database-schema.md)
- [Frontend](frontend.md)
- [Feature catalog](features/README.md)
