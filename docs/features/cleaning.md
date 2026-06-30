# Cleaning schedules

[← Feature catalog](README.md) · [← Database schema](../database-schema.md)

The cleaning feature manages recurring cleaning responsibilities and assigns them
to staff or residents on a daily or weekly cadence.

## Concepts

- **Cleaning task** — a reusable definition of a responsibility (e.g. "Lobby
  mopping") with a `frequency` of `daily` or `weekly`. Stored in `cleaning_tasks`.
- **Cleaning assignment** — a specific occurrence of a task assigned to a user
  for a given date, with a `pending` or `done` status. Stored in
  `cleaning_assignments`.

See the table definitions in
[database-schema.md](../database-schema.md#cleaning_tasks).

## Core flow

1. **Define a task.** An admin creates a cleaning task and sets its frequency.
2. **Assign.** The task is assigned to a staff member or resident for specific
   dates, producing `cleaning_assignments` rows.
3. **Track.** Assignees see their upcoming responsibilities; they mark each as
   `done` when complete (`completed_at` is recorded).

```
task "Lobby mopping" (daily)
        │ assigned
        ▼
assignment: Ayşe, 2026-07-01, pending
assignment: Mehmet, 2026-07-02, pending
        ▼ Ayşe marks done
assignment: Ayşe, 2026-07-01, done (completed_at set)
```

## Example queries

```sql
-- A user's upcoming cleaning duties
SELECT a.id, t.name, a.scheduled_date, a.status
FROM cleaning_assignments a
JOIN cleaning_tasks t ON t.id = a.task_id
WHERE a.assignee_id = :user_id AND a.status = 'pending'
ORDER BY a.scheduled_date;

-- Today's schedule across everyone
SELECT t.name, u.full_name AS assignee, a.status
FROM cleaning_assignments a
JOIN cleaning_tasks t ON t.id = a.task_id
JOIN users u ON u.id = a.assignee_id
WHERE a.scheduled_date = CURRENT_DATE
ORDER BY t.name;
```

## Related documents

- [Database schema](../database-schema.md)
- [Properties & units](properties.md)
- [Authentication & users](authentication.md)
