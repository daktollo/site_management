# Properties & units

[← Feature catalog](README.md) · [← Database schema](../database-schema.md)

This feature models the physical site: the properties (buildings) managed by the
application, the units within them, and the residents who occupy those units.

## Concepts

- **Property** — a building or site. Stored in `properties`.
- **Unit** — a dwelling within a property (e.g. "Block A — Flat 3"). Stored in
  `units`.
- **Resident** — a [user](authentication.md) linked to a unit via `users.unit_id`.

See the table definitions in
[database-schema.md](../database-schema.md#properties).

## Relationships

```
property (1) ───< units (many) ───? users (residents)
```

- One property has many units.
- A unit may be occupied by users (residents); staff/admins may have no unit.

## Example queries

```sql
-- Units in a property with their residents
SELECT un.label, u.full_name
FROM units un
LEFT JOIN users u ON u.unit_id = un.id
WHERE un.property_id = :property_id
ORDER BY un.label;

-- Residents of a property (useful when generating payment shares)
SELECT u.id, u.full_name, un.label
FROM users u
JOIN units un ON un.id = u.unit_id
WHERE un.property_id = :property_id AND u.role = 'resident';
```

## Related documents

- [Database schema](../database-schema.md)
- [Authentication & users](authentication.md)
- [Payments](payments.md)
