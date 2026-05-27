-- Migration 005: Seed operators with PIN
-- DEV ONLY — replace in production

-- Operator 1: PIN = 1234 (tablet 1)
INSERT INTO operators (name, pin_hash)
VALUES ('Tablet 1', crypt('1234', gen_salt('bf')));

-- Operator 2: PIN = 5678 (tablet 2)
INSERT INTO operators (name, pin_hash)
VALUES ('Tablet 2', crypt('5678', gen_salt('bf')));

-- Operator admin: PIN = 0000
INSERT INTO operators (name, pin_hash)
VALUES ('Supervisor', crypt('0000', gen_salt('bf')));
