import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Note: env vars are validated at runtime — build succeeds with placeholder values
export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
