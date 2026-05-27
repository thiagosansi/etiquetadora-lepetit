import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/shared/lib/supabase';
import { useQueueActions } from '@/shared/stores/queueStore';
import type { QueueEntry, QueueStatus } from '@/shared/types';

export function useCallNext(queueId: string | null) {
  const { setCalledEntry } = useQueueActions();

  return useMutation({
    mutationFn: async () => {
      if (!queueId) throw new Error('No active queue');

      const { data, error } = await supabase.rpc('call_next_in_queue', {
        p_queue_id: queueId,
      });

      if (error) throw error;
      const entries = data as QueueEntry[];
      if (!entries || entries.length === 0) return null;
      return entries[0];
    },
    onSuccess: (entry) => {
      if (!entry) {
        toast.info('Fila vazia — nenhum cliente aguardando.');
        return;
      }
      setCalledEntry(entry);
      toast.success(`Chamando: ${entry.customer_name}`);
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
