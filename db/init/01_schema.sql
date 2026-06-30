-- Site Management — initial schema
-- Applied automatically by PostgreSQL on first container start (see docs/setup.md).
-- Documentation: docs/database-schema.md

BEGIN;

-- ---------------------------------------------------------------------------
-- Properties & units
-- ---------------------------------------------------------------------------
CREATE TABLE properties (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    address     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE units (
    id          SERIAL PRIMARY KEY,
    property_id INTEGER NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    label       TEXT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Users & authentication
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'resident'
                  CHECK (role IN ('admin', 'staff', 'resident')),
    unit_id       INTEGER REFERENCES units(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Payments: named transactions and per-user shares
-- ---------------------------------------------------------------------------
CREATE TABLE transactions (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,                 -- shown in the Payments tab
    description TEXT,
    type        TEXT NOT NULL
                CHECK (type IN ('payment', 'expense', 'income')),
    amount      NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_by  INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    due_date    DATE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transaction_shares (
    id             SERIAL PRIMARY KEY,
    transaction_id INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount_due     NUMERIC(12, 2) NOT NULL CHECK (amount_due >= 0),
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'paid')),
    paid_at        TIMESTAMPTZ,
    UNIQUE (transaction_id, user_id)
);

-- Outstanding debt is derived: SUM(amount_due) WHERE status = 'pending'.
CREATE INDEX idx_transaction_shares_user_status
    ON transaction_shares (user_id, status);

-- ---------------------------------------------------------------------------
-- Cleaning schedules
-- ---------------------------------------------------------------------------
CREATE TABLE cleaning_tasks (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT,
    frequency   TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cleaning_assignments (
    id             SERIAL PRIMARY KEY,
    task_id        INTEGER NOT NULL REFERENCES cleaning_tasks(id) ON DELETE CASCADE,
    assignee_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scheduled_date DATE NOT NULL,
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'done')),
    completed_at   TIMESTAMPTZ
);

CREATE INDEX idx_cleaning_assignments_assignee
    ON cleaning_assignments (assignee_id, scheduled_date);

COMMIT;
