# Authentication & users

[← Feature catalog](README.md) · [← Database schema](../database-schema.md)

User accounts and role-based access underpin every other feature.

## Roles

| Role       | Typical capabilities                                                        |
| ---------- | -------------------------------------------------------------------------- |
| `admin`    | Manage properties, units, users, cleaning tasks; full visibility.           |
| `staff`    | Receive and complete cleaning assignments; participate in payments.         |
| `resident` | Linked to a unit; participates in payments and may take cleaning duties.     |

Roles are stored in `users.role`. See the
[`users` table](../database-schema.md#users).

## Authentication

- Users sign in with their **email** and password.
- Passwords are stored only as hashes in `users.password_hash` — never plaintext.
- The application tier (future) issues sessions/tokens and enforces role checks
  on each request. See [architecture.md](../architecture.md).

## How users connect to other features

- A user is linked to a [unit](properties.md) via `users.unit_id`.
- A user **creates transactions** and **owes transaction shares** — see
  [payments.md](payments.md).
- A user is **assigned cleaning duties** — see [cleaning.md](cleaning.md).

## Related documents

- [Database schema](../database-schema.md)
- [Properties & units](properties.md)
- [Architecture](../architecture.md)
