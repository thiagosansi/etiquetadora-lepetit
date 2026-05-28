import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Public Supabase client (no cookies) — safe for use in generateStaticParams
 * and other build-time contexts. Uses anon key, respects RLS.
 */
export function createPublicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
