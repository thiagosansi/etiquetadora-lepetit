-- Migration 001: Core schema
-- Sistema de Fila de Atendimento — NEOENERGIA BAHIA FARM 2026

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Status enum
CREATE TYPE queue_status AS ENUM (
  'waiting',    -- aguardando chamada
  'in_service', -- sendo atendido
  'absent',     -- chamado, não compareceu
  'finished'    -- atendimento concluído
);

-- Operators (tablet login via PIN)
CREATE TABLE operators (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      text NOT NULL,
  pin_hash  text NOT NULL  -- bcrypt via pgcrypto.crypt
);

-- Queues (one per day)
CREATE TABLE queues (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  date       date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, date)
);

-- Queue entries (customers)
CREATE TABLE queue_entries (
  id             uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id       uuid         NOT NULL REFERENCES queues(id) ON DELETE CASCADE,
  customer_name  text         NOT NULL,
  phone          text         NOT NULL,       -- E.164: +5571999999999
  scheduled_time time         NOT NULL,
  status         queue_status NOT NULL DEFAULT 'waiting',
  called_at      timestamptz,
  served_at      timestamptz,
  finished_at    timestamptz,
  sms_sent       boolean      NOT NULL DEFAULT false,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  updated_at     timestamptz  NOT NULL DEFAULT now(),
  version        integer      NOT NULL DEFAULT 0
);

-- Indexes for hot paths
CREATE INDEX idx_qe_next
  ON queue_entries (queue_id, scheduled_time ASC, created_at ASC)
  WHERE status = 'waiting';

CREATE INDEX idx_qe_sms
  ON queue_entries (queue_id)
  WHERE status = 'waiting' AND sms_sent = false;

CREATE INDEX idx_qe_queue_status
  ON queue_entries (queue_id, status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_qe_updated_at
  BEFORE UPDATE ON queue_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
