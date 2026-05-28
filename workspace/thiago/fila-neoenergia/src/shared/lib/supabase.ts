import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Note: env vars are validated at runtime — build succeeds with placeholder values
// REST calls use public schema wrappers (fila_008_public_wrappers migration).
// Realtime subscribes to fila schema directly via WAL — no PostgREST involved.
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
