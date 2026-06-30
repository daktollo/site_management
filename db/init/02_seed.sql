-- Minimal seed: a single bootstrap admin so you can log in and define
-- everything else (real users, properties/units, cleaning tasks) yourself.
--
--   Login name: admin
--   Password:   admin123      <-- change it right after the first login
--
-- This runs only on a fresh (empty) database volume.

BEGIN;

-- bcrypt hash of 'admin123'
\set pw '''$2a$10$QiXxutPz0TKvIWmc9n2/pu7ydm//WLFSkD9IfmGkcnzAlx92v9gIK'''

INSERT INTO users (full_name, password_hash, role)
VALUES ('admin', :pw, 'admin');

COMMIT;
