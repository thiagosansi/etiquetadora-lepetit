import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { QueueEntry } from '@/shared/types';

interface HistoryModalProps {
  queueId: string;
  onClose: () => void;
}

function formatHour(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function HistoryModal({ queueId, onClose }: HistoryModalProps) {
  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['queue-history', queueId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('queue_entries')
        .select('*')
        .eq('queue_id', queueId)
        .eq('status', 'finished')
        .order('finished_at', { ascending: false });

      if (error) throw error;
      return (data ?? []) as QueueEntry[];
    },
  });

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between shadow-sm">
        <h2 className="text-xl font-bold text-gray-900">Histórico de Chamados</h2>
        <button
          type="button"
          onClick={onClose}
          className="h-10 w-10 flex items-center justify-center rounded-xl text-gray-500
                     active:bg-gray-100 touch-manipulation transition-colors text-xl"
          aria-label="Fechar histórico"
        >
          ✕
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <p className="text-center text-gray-400 py-12">Carregando...</p>
        ) : entries.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-400 text-lg">Nenhum atendimento finalizado</p>
            <p className="text-gray-300 text-sm mt-1">Os clientes finalizados aparecerão aqui</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-400 font-medium mb-3">
              {entries.length} atendimento{entries.length !== 1 ? 's' : ''} realizado{entries.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-col gap-2">
              {entries.map((entry, i) => (
                <div
                  key={entry.id}
                  className="bg-gray-50 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <span className="text-sm font-bold text-gray-300 w-6 text-right flex-shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{entry.customer_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Finalizado às {formatHour(entry.finished_at)}
                    </p>
                  </div>
                  {entry.was_absent && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0">
                      ⚠ Ausente
                    </span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
