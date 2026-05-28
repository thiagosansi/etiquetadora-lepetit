import { SmsStatusBadge } from '@/features/sms/SmsStatusBadge';
import { useSendSms } from '@/features/sms/hooks/useSendSms';
import { useUpdateStatus, useMoveEntry } from './hooks/useQueueOperations';
import { maskPhone, formatTime } from '@/shared/lib/utils';
import type { QueueEntry } from '@/shared/types';

const STATUS_LABELS: Record<string, string> = {
  waiting: 'Aguardando',
  in_service: 'Em atendimento',
  absent: 'Ausente',
  finished: 'Finalizado',
};

const STATUS_COLORS: Record<string, string> = {
  waiting: 'border-gray-300',
  in_service: 'border-green-500',
  absent: 'border-amber-400',
  finished: 'border-gray-200',
};

interface QueueCardProps {
  entry: QueueEntry;
  position?: number;
  queueId: string;
  isFirst?: boolean;
  isLast?: boolean;
}

export function QueueCard({ entry, position, queueId, isFirst, isLast }: QueueCardProps) {
  const updateStatus = useUpdateStatus(queueId);
  const sendSms = useSendSms();
  const moveEntry = useMoveEntry(queueId);
  const isBusy = updateStatus.isPending || sendSms.isPending || moveEntry.isPending;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-l-4 p-4 flex items-start gap-3 transition-all
                  ${STATUS_COLORS[entry.status]}`}
    >
      {/* Position badge + move buttons (waiting only) */}
      {position != null && entry.status === 'waiting' && (
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => moveEntry.mutate({ entryId: entry.id, direction: 'up' })}
            disabled={isBusy || isFirst}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                       active:bg-gray-100 disabled:opacity-20 touch-manipulation transition-colors"
            aria-label="Mover para cima"
          >
            ▲
          </button>
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
            <span className="text-blue-700 font-bold text-sm">{position}º</span>
          </div>
          <button
            type="button"
            onClick={() => moveEntry.mutate({ entryId: entry.id, direction: 'down' })}
            disabled={isBusy || isLast}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400
                       active:bg-gray-100 disabled:opacity-20 touch-manipulation transition-colors"
            aria-label="Mover para baixo"
          >
            ▼
          </button>
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-lg font-semibold text-gray-900 truncate">{entry.customer_name}</p>
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
            {formatTime(entry.scheduled_time)}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">{maskPhone(entry.phone)}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-gray-400">{STATUS_LABELS[entry.status]}</span>
          <SmsStatusBadge entryId={entry.id} />
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex flex-col gap-2">
        {entry.status === 'waiting' && (
          <button
            type="button"
            onClick={() => sendSms.mutate({ entryId: entry.id, queueId })}
            disabled={isBusy}
            className="h-10 px-3 text-sm font-medium bg-green-50 text-green-700 rounded-xl
                       active:bg-green-100 disabled:opacity-40 touch-manipulation transition-colors"
            aria-label={`Enviar SMS para ${entry.customer_name}`}
          >
            {entry.sms_sent ? 'Reenviar' : 'SMS'}
          </button>
        )}
        {entry.status === 'in_service' && (
          <>
            <button
              type="button"
              onClick={() => updateStatus.mutate({ entryId: entry.id, status: 'finished' })}
              disabled={isBusy}
              className="h-10 px-3 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl
                         active:bg-gray-200 disabled:opacity-40 touch-manipulation transition-colors"
            >
              Finalizar
            </button>
            <button
              type="button"
              onClick={() => updateStatus.mutate({ entryId: entry.id, status: 'absent' })}
              disabled={isBusy}
              className="h-10 px-3 text-sm font-medium bg-amber-50 text-amber-700 rounded-xl
                         active:bg-amber-100 disabled:opacity-40 touch-manipulation transition-colors"
            >
              Ausente
            </button>
          </>
        )}
        {entry.status === 'absent' && (
          <button
            type="button"
            onClick={() => updateStatus.mutate({ entryId: entry.id, status: 'waiting' })}
            disabled={isBusy}
            className="h-10 px-3 text-sm font-medium bg-blue-50 text-blue-700 rounded-xl
                       active:bg-blue-100 disabled:opacity-40 touch-manipulation transition-colors"
          >
            Retornar
          </button>
        )}
      </div>
    </div>
  );
}
