-- Migration 003: RPC functions

-- Authenticate operator via PIN
CREATE OR REPLACE FUNCTION authenticate_operator(p_pin text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_operator operators%ROWTYPE;
BEGIN
  SELECT * INTO v_operator
  FROM operators
  WHERE pin_hash = crypt(p_pin, pin_hash)
  LIMIT 1;

  IF v_operator.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object('id', v_operator.id, 'name', v_operator.name);
END;
$$;

-- Get or create today's queue
CREATE OR REPLACE FUNCTION get_or_create_today_queue(p_name text DEFAULT 'NEOENERGIA')
RETURNS queues LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_queue queues%ROWTYPE;
BEGIN
  INSERT INTO queues (name, date)
  VALUES (p_name, CURRENT_DATE)
  ON CONFLICT (name, date) DO NOTHING;

  SELECT * INTO v_queue
  FROM queues
  WHERE name = p_name AND date = CURRENT_DATE;

  RETURN v_queue;
END;
$$;

-- Register customer in queue (validates phone format)
CREATE OR REPLACE FUNCTION register_customer(
  p_queue_id     uuid,
  p_name         text,
  p_phone        text,  -- E.164: +5571999999999
  p_scheduled_time time
)
RETURNS queue_entries LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  -- Basic phone validation (E.164 Brazil)
  IF p_phone !~ '^\+55\d{10,11}$' THEN
    RAISE EXCEPTION 'Invalid phone format. Use E.164: +55DDNNNNNNNNN' USING ERRCODE = 'P0003';
  END IF;

  INSERT INTO queue_entries (queue_id, customer_name, phone, scheduled_time)
  VALUES (p_queue_id, p_name, p_phone, p_scheduled_time)
  RETURNING * INTO v_entry;

  RETURN v_entry;
END;
$$;

-- Call next customer (SKIP LOCKED prevents race condition between tablets)
CREATE OR REPLACE FUNCTION call_next_in_queue(p_queue_id uuid)
RETURNS SETOF queue_entries LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
BEGIN
  SELECT * INTO v_entry
  FROM queue_entries
  WHERE queue_id = p_queue_id AND status = 'waiting'
  ORDER BY scheduled_time ASC, created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF v_entry.id IS NULL THEN
    RETURN;  -- empty queue
  END IF;

  UPDATE queue_entries
  SET
    status    = 'in_service',
    called_at = COALESCE(v_entry.called_at, now()),
    served_at = now(),
    version   = version + 1
  WHERE id = v_entry.id
  RETURNING * INTO v_entry;

  RETURN NEXT v_entry;
END;
$$;

-- Update entry status
CREATE OR REPLACE FUNCTION update_entry_status(
  p_entry_id uuid,
  p_status   queue_status
)
RETURNS queue_entries LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_entry queue_entries%ROWTYPE;
  v_finished_at timestamptz;
BEGIN
  IF p_status = 'finished' THEN
    v_finished_at = now();
  END IF;

  UPDATE queue_entries
  SET
    status      = p_status,
    finished_at = COALESCE(v_finished_at, finished_at),
    version     = version + 1
  WHERE id = p_entry_id
  RETURNING * INTO v_entry;

  IF v_entry.id IS NULL THEN
    RAISE EXCEPTION 'Entry not found' USING ERRCODE = 'P0004';
  END IF;

  RETURN v_entry;
END;
$$;

-- Calculate queue position (dynamic, not stored)
CREATE OR REPLACE FUNCTION get_queue_position(entry_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*)::integer + 1
  FROM queue_entries e2
  JOIN queue_entries e1 ON e1.id = entry_id
  WHERE e2.queue_id = e1.queue_id
    AND e2.status = 'waiting'
    AND e2.id != entry_id
    AND (
      e2.scheduled_time < e1.scheduled_time
      OR (e2.scheduled_time = e1.scheduled_time AND e2.created_at < e1.created_at)
    );
$$;

-- Mark SMS as sent
CREATE OR REPLACE FUNCTION mark_sms_sent(p_entry_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE queue_entries SET sms_sent = true WHERE id = p_entry_id;
$$;
