-- Site Management — seed data for local development.
-- Runs after 01_schema.sql on first container start (empty volume).
-- All seeded users share the password: "password123"
-- (bcrypt hash below, cost 10).

BEGIN;

-- bcrypt hash of 'password123'
\set pw '''$2a$10$DZaZORJCewdQ8yrgmwOTq.f7w/jokGy.Imze1s6rQTxsW9hA1/LbK'''

-- Properties
INSERT INTO properties (name, address) VALUES
    ('Green Valley Residences', '123 Park Avenue, Springfield'),
    ('Riverside Towers', '45 River Road, Springfield');

-- Units (property_id 1 = Green Valley, 2 = Riverside)
INSERT INTO units (property_id, label) VALUES
    (1, 'Block A — Flat 1'),
    (1, 'Block A — Flat 2'),
    (1, 'Block A — Flat 3'),
    (2, 'Tower 1 — Apt 101'),
    (2, 'Tower 1 — Apt 102');

-- Users (password for all = 'password123')
INSERT INTO users (full_name, email, password_hash, role, unit_id) VALUES
    ('Site Admin',    'admin@site.test',   :pw, 'admin',    NULL),
    ('Cleaner Joe',   'joe@site.test',     :pw, 'staff',    NULL),
    ('Alice Resident','alice@site.test',   :pw, 'resident', 1),
    ('Bob Resident',  'bob@site.test',     :pw, 'resident', 2),
    ('Carol Resident','carol@site.test',   :pw, 'resident', 3);

-- A sample payment-type transaction created by Alice (user id 3),
-- split across the three Green Valley residents (ids 3, 4, 5).
INSERT INTO transactions (name, description, type, amount, created_by, due_date)
VALUES ('June elevator maintenance', 'Shared maintenance cost for the elevator',
        'payment', 1200.00, 3, CURRENT_DATE + INTERVAL '7 days');

INSERT INTO transaction_shares (transaction_id, user_id, amount_due, status) VALUES
    (1, 3, 400.00, 'paid'),     -- Alice already paid her share
    (1, 4, 400.00, 'pending'),
    (1, 5, 400.00, 'pending');
UPDATE transaction_shares SET paid_at = now() WHERE transaction_id = 1 AND user_id = 3;

-- A second payment transaction created by Bob (id 4).
INSERT INTO transactions (name, description, type, amount, created_by, due_date)
VALUES ('Garden landscaping', 'Quarterly garden upkeep', 'payment', 600.00, 4,
        CURRENT_DATE + INTERVAL '14 days');

INSERT INTO transaction_shares (transaction_id, user_id, amount_due, status) VALUES
    (2, 3, 200.00, 'pending'),
    (2, 4, 200.00, 'pending'),
    (2, 5, 200.00, 'pending');

-- Cleaning tasks (only two for now)
-- task id 1 = Merdiven temizliği, 2 = Asansör temizliği
INSERT INTO cleaning_tasks (name, description, frequency) VALUES
    ('Merdiven temizliği', 'Merdivenlerin süpürülmesi ve küpeştelerin silinmesi', 'weekly'),
    ('Asansör temizliği',  'Asansör kabininin ve aynalarının temizlenmesi', 'daily');

-- Cleaning assignments spread around today so the calendar is populated.
-- assignee ids: 2 = Cleaner Joe (staff), 3 = Alice, 4 = Bob, 5 = Carol
INSERT INTO cleaning_assignments (task_id, assignee_id, scheduled_date, status) VALUES
    -- Asansör temizliği (daily) — mostly Joe
    (2, 2, CURRENT_DATE - INTERVAL '2 day', 'done'),
    (2, 2, CURRENT_DATE - INTERVAL '1 day', 'done'),
    (2, 2, CURRENT_DATE,                    'pending'),
    (2, 2, CURRENT_DATE + INTERVAL '1 day', 'pending'),
    (2, 4, CURRENT_DATE + INTERVAL '2 day', 'pending'),
    (2, 2, CURRENT_DATE + INTERVAL '3 day', 'pending'),
    -- Merdiven temizliği (weekly) — rotating residents
    (1, 3, CURRENT_DATE - INTERVAL '1 day', 'done'),
    (1, 4, CURRENT_DATE + INTERVAL '6 day', 'pending'),
    (1, 5, CURRENT_DATE + INTERVAL '13 day', 'pending');
UPDATE cleaning_assignments SET completed_at = now() WHERE status = 'done';

COMMIT;
