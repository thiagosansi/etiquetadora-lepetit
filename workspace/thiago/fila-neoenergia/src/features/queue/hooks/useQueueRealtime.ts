import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useQueueActions } from '@/shared/stores/queueStore';
import type { QueueEntry, RealtimeQueuePayload } from '@/shared/types';

export function useQueueRealtime(queueId: string | null) {
  const { applyRealtimeEvent } = useQueueActions();

  useEffect(() => {
    if (!queueId) return;

    const channel = supabase
      .channel(`queue:${queueId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'fila',
          table: 'queue_entries',
          filter: `queue_id=eq.${queueId}`,
        },
        (payload) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
          const entry =
            eventType === 'DELETE'
              ? (payload.old as Partial<QueueEntry>)
              : (payload.new as QueueEntry);

          const normalized: RealtimeQueuePayload = { event_type: eventType, entry };
          applyRealtimeEvent(normalized);
        },
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[realtime] Connected to queue:${queueId}`);
        }
        if (status === 'CHANNEL_ERROR') {
          console.error(`[realtime] Error on queue:${queueId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queueId, applyRealtimeEvent]);
}
