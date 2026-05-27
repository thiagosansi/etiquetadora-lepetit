import { SmsStatusBadge } from '@/features/sms/SmsStatusBadge';
import { useSendSms } from '@/features/sms/hooks/useSendSms';
import { useUpdateStatus } from './hooks/useQueueOperations';
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
}

export function QueueCard({ entry, position, queueId }: QueueCardProps) {
  const updateStatus = useUpdateStatus(queueId);
  const sendSms = useSendSms();
  const isBusy = updateStatus.isPending || sendSms.isPending;

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border-l-4 p-4 flex items-start gap-4 transition-all
                  ${STATUS_COLORS[entry.status]}`}
    >
      {/* Position badge */}
      {position != null && entry.status === 'waiting' && (
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
          <span className="text-blue-700 font-bold text-sm">{position}º</span>
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
            onClick={() =>
              sendSms.mutate({ entryId: entry.id, queueId })
            }
            disabled={isBusy}
            className="h-10 px-3 text-sm font-medium bg-green-50 text-green-700 rounded-xl
                       active:bg-green-100 disabled:opacity-40 touch-manipulation transition-colors"
            aria-label={`Enviar SMS para ${entry.customer_name}`}
          >
            SMS
          </button>
        )}
        {entry.status === 'in_service' && (
          <>
            <button
              type="button"
              onClick={() =>
                updateStatus.mutate({ entryId: entry.id, status: 'finished' })
              }
              disabled={isBusy}
              className="h-10 px-3 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl
                         active:bg-gray-200 disabled:opacity-40 touch-manipulation transition-colors"
            >
              Finalizar
            </button>
            <button
              type="button"
              onClick={() =>
                updateStatus.mutate({ entryId: entry.id, status: 'absent' })
              }
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
            onClick={() =>
              updateStatus.mutate({ entryId: entry.id, status: 'waiting' })
            }
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
