'use server'

import { createClient } from '@/lib/supabase/server'

export async function listStorageFiles(bucket: string, prefix = '') {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 100,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw error
  return (data ?? []).filter((f) => f.id !== null) // exclude folders
}

