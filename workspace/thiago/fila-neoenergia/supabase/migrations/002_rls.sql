-- Migration 002: Row Level Security
-- Tablets read via anon key; mutations go through RPC (SECURITY DEFINER)

ALTER TABLE queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;

-- Queues: anon can read
CREATE POLICY "Anon can read queues"
  ON queues FOR SELECT TO anon USING (true);

-- Queue entries: anon can read
CREATE POLICY "Anon can read queue entries"
  ON queue_entries FOR SELECT TO anon USING (true);

-- No direct writes from anon — all mutations go through RPCs
CREATE POLICY "No direct insert from anon on queue_entries"
  ON queue_entries FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "No direct update from anon on queue_entries"
  ON queue_entries FOR UPDATE TO anon USING (false);

-- Operators: nobody reads directly (PIN validated via RPC)
CREATE POLICY "No read on operators"
  ON operators FOR SELECT TO anon USING (false);
