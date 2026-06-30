# Features

[← Documentation index](../README.md) · [← Architecture](../architecture.md)

Site Management is organized around four feature areas. They share a single
[database schema](../database-schema.md).

| Feature                                   | Summary                                                              |
| ----------------------------------------- | ------------------------------------------------------------------- |
| [Authentication & users](authentication.md) | Role-based accounts (admin, staff, resident) and sign-in.         |
| [Properties & units](properties.md)       | Buildings, units, and the residents who occupy them.                |
| [Payments](payments.md)                   | Named transactions, the Payments tab, and outstanding-debt tracking.|
| [Cleaning schedules](cleaning.md)         | Cleaning tasks assigned daily/weekly to staff or residents.         |

## How they relate

- **Users** belong to **units**, which belong to **properties**.
- A **user** creates **transactions**; `payment`-type transactions generate
  per-user shares that drive **outstanding debt**.
- **Cleaning tasks** are assigned to **users** on a daily or weekly cadence.

## Related documents

- [Database schema](../database-schema.md)
- [Frontend](../frontend.md)
