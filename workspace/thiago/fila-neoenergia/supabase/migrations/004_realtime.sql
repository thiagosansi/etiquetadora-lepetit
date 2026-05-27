-- Migration 004: Realtime broadcast trigger
-- Emits broadcast events to all subscribed tablets when queue changes

CREATE OR REPLACE FUNCTION notify_queue_change()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM realtime.send(
    jsonb_build_object(
      'event_type', TG_OP,
      'entry', row_to_json(COALESCE(NEW, OLD))
    ),
    'queue_change',
    'queue:' || COALESCE(NEW.queue_id, OLD.queue_id)::text,
    true  -- public channel (no auth required)
  );
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_notify_queue_change
  AFTER INSERT OR UPDATE OR DELETE ON queue_entries
  FOR EACH ROW EXECUTE FUNCTION notify_queue_change();

-- Enable realtime on queue_entries table
ALTER PUBLICATION supabase_realtime ADD TABLE queue_entries;
