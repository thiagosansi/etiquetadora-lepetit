import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabase';
import { useQueueStore, useQueueActions } from '@/shared/stores/queueStore';
import type { QueueEntry, QueueStatus } from '@/shared/types';

export function useMoveEntry(queueId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId, direction }: { entryId: string; direction: 'up' | 'down' }) => {
      const { error } = await supabase.rpc('move_queue_entry', {
        p_entry_id: entryId,
        p_direction: direction,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
    },
    onError: () => {
      toast.error('Erro ao mover cliente. Tente novamente.');
    },
  });
}

async function sendSmsForEntry(entryId: string, queueId: string): Promise<boolean> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({
      entry_id: entryId,
      queue_id: queueId,
      trigger: 'manual',
      target_entry_id: entryId,
    }),
  });
  if (!response.ok) return false;
  const data = await response.json() as { sent: boolean };
  return data.sent;
}

export function useCallNext(queueId: string | null) {
  const { setCalledEntry, setSmsStatus } = useQueueActions();

  return useMutation({
    mutationFn: async () => {
      if (!queueId) throw new Error('No active queue');

      const { data, error } = await supabase.rpc('call_next_in_queue', {
        p_queue_id: queueId,
      });

      if (error) throw error;
      const result = data as { called: boolean; entry?: QueueEntry; reason?: string };
      if (!result?.called || !result.entry) return null;
      return result.entry;
    },
    onSuccess: async (entry) => {
      if (!entry) {
        toast.info('Fila vazia — nenhum cliente aguardando.');
        return;
      }
      setCalledEntry(entry);
      toast.success(`Chamando: ${entry.customer_name}`);

      // Auto-send SMS
      setSmsStatus(entry.id, 'sending');
      try {
        const sent = await sendSmsForEntry(entry.id, queueId!);
        setSmsStatus(entry.id, sent ? 'sent' : 'failed');
        if (!sent) toast.error('SMS não pôde ser enviado automaticamente.');
      } catch {
        setSmsStatus(entry.id, 'failed');
      }
    },
    onError: () => {
      toast.error('Erro ao chamar próximo. Tente novamente.');
    },
  });
}

export function useUpdateStatus(queueId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entryId,
      status,
    }: {
      entryId: string;
      status: QueueStatus;
    }) => {
      const { data, error } = await supabase.rpc('update_entry_status', {
        p_entry_id: entryId,
        p_status: status,
      });

      if (error) throw error;
      return data as QueueEntry;
    },
    onSuccess: (_, variables) => {
      // Clear calledEntry if the finished/updated entry was the one being served
      const state = useQueueStore.getState();
      if (
        variables.status === 'finished' &&
        state.calledEntry?.id === variables.entryId
      ) {
        state.actions.setCalledEntry(null);
      }
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
      const labels: Record<QueueStatus, string> = {
        in_service: 'Em atendimento',
        absent: 'Marcado como ausente',
        finished: 'Atendimento finalizado',
        waiting: 'Retornado à fila',
      };
      toast.success(labels[variables.status]);
    },
    onError: () => {
      toast.error('Erro ao atualizar status. Tente novamente.');
    },
  });
}

export function useMarkAbsent(queueId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ entryId }: { entryId: string }) => {
      const { error } = await supabase.rpc('mark_absent', {
        p_entry_id: entryId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { entryId }) => {
      // If this was the currently called entry, clear it and save as lastCalled
      const state = useQueueStore.getState();
      if (state.calledEntry?.id === entryId) {
        state.actions.setCalledEntry(null);
      }
      queryClient.invalidateQueries({ queryKey: ['queue', queueId] });
      toast.info('Cliente enviado para o final da fila.');
    },
    onError: () => {
      toast.error('Erro ao marcar ausência. Tente novamente.');
    },
  });
}
