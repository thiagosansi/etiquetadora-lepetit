phase: planning_complete
plan_md: generated
user_approval: auto-approved (autonomous mode)
next: phase_3_implementation

skill: build
mode: autonomous
project: fila-neoenergia
stack: React + TypeScript + Vite + Tailwind + Supabase + Zenvia
architecture: feature-based

waves:
  - Wave 1: Foundation (scaffold, deps, schema, layout)
  - Wave 2: Auth (PIN login)
  - Wave 3: Registration (customer form)
  - Wave 4: Queue + Realtime (panel, SKIP LOCKED, sync)
  - Wave 5: SMS (Edge Function, Zenvia, manual SMS)

key_decisions:
  - SMS: Zenvia (não Twilio)
  - Auth: PIN via RPC SECURITY DEFINER
  - Realtime: Broadcast via trigger notify_queue_change
  - Concurrency: SELECT FOR UPDATE SKIP LOCKED
  - State: Zustand + TanStack Query + Supabase Realtime
