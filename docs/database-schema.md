# Database schema

[← Documentation index](README.md) · [← Architecture](architecture.md)

PostgreSQL is the single source of truth for all application data. This document
describes the relational model shared by every feature. The executable
definition lives in [`db/init/01_schema.sql`](../db/init/01_schema.sql) and is
applied automatically on first container start (see [setup.md](setup.md)).

## Entity-relationship overview

```
properties 1───* units 1───? users *───* (via transaction_shares)
                                  │
                                  │ creates
                                  ▼
                            transactions 1───* transaction_shares
                                  (type = payment | expense | income)

cleaning_tasks 1───* cleaning_assignments *───1 users
```

## Tables

### `users`
Accounts for everyone who interacts with the site.

| Column        | Type          | Notes                                            |
| ------------- | ------------- | ------------------------------------------------ |
| id            | serial PK     |                                                  |
| full_name     | text          |                                                  |
| email         | text unique   | Login identifier.                                |
| password_hash | text          | Never store plaintext.                           |
| role          | text          | `admin` \| `staff` \| `resident`.                |
| unit_id       | int FK → units| Nullable (e.g. staff without a unit).            |
| created_at    | timestamptz   | Defaults to now.                                 |

See [features/authentication.md](features/authentication.md).

### `properties`
A building or site managed by the application.

| Column     | Type      | Notes |
| ---------- | --------- | ----- |
| id         | serial PK |       |
| name       | text      |       |
| address    | text      |       |
| created_at | timestamptz |     |

### `units`
A dwelling/unit within a property.

| Column      | Type             | Notes                          |
| ----------- | ---------------- | ------------------------------ |
| id          | serial PK        |                                |
| property_id | int FK → properties |                             |
| label       | text             | e.g. "Block A — Flat 3".       |
| created_at  | timestamptz      |                                |

See [features/properties.md](features/properties.md).

### `transactions`
A named financial record created by a user. The `type` drives behavior:
`payment` transactions appear in the Payments tab for others to settle.

| Column      | Type          | Notes                                          |
| ----------- | ------------- | ---------------------------------------------- |
| id          | serial PK     |                                                |
| name        | text          | User-supplied; shown in the Payments tab.      |
| description | text          | Optional detail.                               |
| type        | text          | `payment` \| `expense` \| `income`.            |
| amount      | numeric(12,2) | Total amount of the transaction.               |
| created_by  | int FK → users| The user who created and named it.             |
| due_date    | date          | Nullable.                                      |
| created_at  | timestamptz   |                                                |

### `transaction_shares`
The per-user obligation derived from a `payment` transaction. This is what makes
each person's **outstanding debt** trackable.

| Column         | Type          | Notes                                       |
| -------------- | ------------- | ------------------------------------------- |
| id             | serial PK     |                                             |
| transaction_id | int FK → transactions |                                     |
| user_id        | int FK → users| The user who owes this share.               |
| amount_due     | numeric(12,2) | This user's portion.                         |
| status         | text          | `pending` \| `paid`.                         |
| paid_at        | timestamptz   | Set when marked paid; null while pending.   |

> **Outstanding debt** for a user = sum of `amount_due` where `status = 'pending'`.
> Full flow in [features/payments.md](features/payments.md).

### `cleaning_tasks`
A reusable definition of a cleaning responsibility.

| Column      | Type      | Notes                         |
| ----------- | --------- | ----------------------------- |
| id          | serial PK |                               |
| name        | text      |                               |
| description | text      | Optional.                     |
| frequency   | text      | `daily` \| `weekly`.          |
| created_at  | timestamptz |                             |

### `cleaning_assignments`
A specific occurrence of a task assigned to a person.

| Column         | Type        | Notes                                 |
| -------------- | ----------- | ------------------------------------- |
| id             | serial PK   |                                       |
| task_id        | int FK → cleaning_tasks |                           |
| assignee_id    | int FK → users |                                    |
| scheduled_date | date        | When it is due.                       |
| status         | text        | `pending` \| `done`.                  |
| completed_at   | timestamptz | Set when marked done.                 |

See [features/cleaning.md](features/cleaning.md).

## Related documents

- [Features overview](features/README.md)
- [Setup & Docker](setup.md)
