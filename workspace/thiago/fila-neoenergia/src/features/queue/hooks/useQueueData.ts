import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useQueueActions } from '@/shared/stores/queueStore';
import type { QueueEntry } from '@/shared/types';

export function useQueueData(queueId: string | null) {
  const { setEntries } = useQueueActions();

  const query = useQuery({
    queryKey: ['queue', queueId],
    queryFn: async () => {
      if (!queueId) return [];

      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', queueId)
        .in('status', ['waiting', 'in_service', 'absent'])
        .order('scheduled_time', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data ?? []) as QueueEntry[];
    },
    enabled: !!queueId,
    staleTime: 30_000,
  });

  // Sync initial data to Zustand store
  useEffect(() => {
    if (query.data) {
      setEntries(query.data);
    }
  }, [query.data, setEntries]);

  return query;
}

export function useGetOrCreateQueue() {
  return useQuery({
    queryKey: ['today-queue'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_or_create_today_queue', {
        p_name: 'NEOENERGIA',
      });
      if (error) throw error;
      return data as { id: string; name: string; date: string } | null;
    },
    staleTime: 60_000 * 60, // 1 hour — queue ID doesn't change in a day
  });
}
