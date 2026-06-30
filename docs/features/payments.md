# Payments

[← Feature catalog](README.md) · [← Database schema](../database-schema.md)

The payments feature lets any user create and name financial transactions, lets
others settle payment-type transactions, and keeps everyone's outstanding debt
and transaction history clearly trackable.

## Concepts

- **Transaction** — a named financial record created by a user. Its `type` is one
  of `payment`, `expense`, or `income`.
- **Payment-type transaction** — a transaction that other users are expected to
  pay into. It appears in the **Payments tab** by its name.
- **Transaction share** — one user's portion of a payment transaction, with a
  `pending` or `paid` status. Stored in `transaction_shares`.
- **Outstanding debt** — the sum of a user's `pending` shares.

See the table definitions in [database-schema.md](../database-schema.md):
[`transactions`](../database-schema.md#transactions) and
[`transaction_shares`](../database-schema.md#transaction_shares).

## Core flow: creating and settling a payment

1. **Create & name.** A user opens the Payments tab and creates a transaction,
   giving it a name (e.g. "June elevator maintenance") and an amount. They select
   the type. For a *payment*, they choose which users owe a share.
2. **Shares generated.** The system writes one `transaction_shares` row per
   participating user with `status = 'pending'`.
3. **Visible to others.** Because the transaction is of the `payment` type, its
   **name is shown in every participant's Payments tab**, alongside the amount
   they owe.
4. **Mark as paid.** A user marks their share as paid. The system sets that
   share's `status = 'paid'` and `paid_at = now()`.
5. **Debt recomputed.** The user's outstanding debt drops by the settled amount.

```
User A creates "June elevator maintenance" (payment, ₺1200)
        │
        ▼
shares: B owes 400 (pending), C owes 400 (pending), D owes 400 (pending)
        │
        ▼  B opens Payments tab, sees "June elevator maintenance — ₺400 due"
        ▼  B marks as paid
shares: B 400 (paid), C 400 (pending), D 400 (pending)
        │
        ▼  B's outstanding debt: −400
```

## What must always be trackable

- **Every user's outstanding debt** — `SUM(amount_due) WHERE user_id = ? AND status = 'pending'`.
- **Transactions a user has made** — `transactions WHERE created_by = ?`.
- **Payment status per participant** — the `transaction_shares` for a transaction.

## Example queries

```sql
-- Outstanding debt for a single user
SELECT COALESCE(SUM(amount_due), 0) AS outstanding
FROM transaction_shares
WHERE user_id = :user_id AND status = 'pending';

-- Everyone's outstanding debt
SELECT u.id, u.full_name,
       COALESCE(SUM(s.amount_due) FILTER (WHERE s.status = 'pending'), 0) AS outstanding
FROM users u
LEFT JOIN transaction_shares s ON s.user_id = u.id
GROUP BY u.id, u.full_name
ORDER BY outstanding DESC;

-- Transactions a user created
SELECT id, name, type, amount, created_at
FROM transactions
WHERE created_by = :user_id
ORDER BY created_at DESC;

-- Payment-tab listing for a user (their pending shares)
SELECT t.id, t.name, t.due_date, s.amount_due
FROM transaction_shares s
JOIN transactions t ON t.id = s.transaction_id
WHERE s.user_id = :user_id AND s.status = 'pending'
ORDER BY t.due_date NULLS LAST, t.created_at;
```

## Related documents

- [Database schema](../database-schema.md)
- [Authentication & users](authentication.md)
- [Frontend — Payments view](../frontend.md)
