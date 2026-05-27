import { useEffect } from 'react';
import { supabase } from '@/shared/lib/supabase';
import { useQueueActions } from '@/shared/stores/queueStore';
import type { RealtimeQueuePayload } from '@/shared/types';

export function useQueueRealtime(queueId: string | null) {
  const { applyRealtimeEvent } = useQueueActions();

  useEffect(() => {
    if (!queueId) return;

    const channel = supabase
      .channel(`queue:${queueId}`)
      .on(
        'broadcast',
        { event: 'queue_change' },
        ({ payload }: { payload: RealtimeQueuePayload }) => {
          applyRealtimeEvent(payload);
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
