import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCallNext, useUpdateStatus, useMarkAbsent } from './hooks/useQueueOperations';
import { useQueueData, useGetOrCreateQueue } from './hooks/useQueueData';
import { useQueueRealtime } from './hooks/useQueueRealtime';
import { useWaitingEntries, useCalledEntry, useInServiceEntries } from '@/shared/stores/queueStore';
import { useOperator, useAuthActions } from '@/shared/stores/authStore';
import { CallingDisplay } from './CallingDisplay';
import { QueueCard } from './QueueCard';
import { HistoryModal } from './HistoryModal';
import { TabletLayout } from '@/shared/components/TabletLayout';
import { LOGO_SRC } from '@/assets/logo';

export function OperatorPanel() {
  const navigate = useNavigate();
  const operator = useOperator();
  const { logout } = useAuthActions();
  const [showHistory, setShowHistory] = useState(false);

  // Get today's queue
  const { data: queue, isLoading: queueLoading } = useGetOrCreateQueue();
  const queueId = queue?.id ?? null;

  // Load queue data + realtime sync
  const { isLoading: entriesLoading } = useQueueData(queueId);
  useQueueRealtime(queueId);

  const waitingEntries = useWaitingEntries();
  const inServiceEntries = useInServiceEntries();
  const calledEntry = useCalledEntry();

  const callNext = useCallNext(queueId);
  const updateStatus = useUpdateStatus(queueId);
  const markAbsent = useMarkAbsent(queueId);

  const isLoading = queueLoading || entriesLoading;
  const actionBusy = callNext.isPending || updateStatus.isPending || markAbsent.isPending;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <TabletLayout>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <img src={LOGO_SRC} alt="NEOENERGIA" className="h-8 object-contain" />
          <p className="text-xs text-gray-500">BAHIA FARM 2026 · {operator?.name ?? ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="h-10 px-4 text-sm text-gray-600 font-medium rounded-xl
                       active:bg-gray-100 transition-colors touch-manipulation flex items-center gap-1.5"
            aria-label="Ver histórico de chamados"
          >
            <span>📋</span>
            <span>Histórico</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="h-10 px-4 text-sm text-gray-600 font-medium rounded-xl
                       active:bg-gray-100 transition-colors touch-manipulation"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Calling display */}
      <CallingDisplay />

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3 p-4">
        {/* Call next — primary action */}
        <button
          type="button"
          onClick={() => callNext.mutate()}
          disabled={actionBusy || isLoading || waitingEntries.length === 0}
          className="col-span-2 h-16 bg-blue-600 text-white text-xl font-bold rounded-2xl
                     active:bg-blue-700 disabled:opacity-40 transition-colors
                     touch-manipulation flex items-center justify-center gap-2"
          aria-label="Chamar próximo cliente da fila"
        >
          {callNext.isPending ? 'Chamando...' : `Chamar Próximo (${waitingEntries.length})`}
        </button>

        {/* Finish current */}
        <button
          type="button"
          onClick={() => {
            if (calledEntry) {
              updateStatus.mutate({ entryId: calledEntry.id, status: 'finished' });
            }
          }}
          disabled={!calledEntry || actionBusy}
          className="h-16 bg-emerald-600 text-white text-base font-bold rounded-2xl
                     active:bg-emerald-700 disabled:opacity-30 transition-colors touch-manipulation
                     flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-xl">✓</span>
          <span>Finalizar</span>
        </button>

        {/* Mark absent */}
        <button
          type="button"
          onClick={() => {
            if (calledEntry) {
              markAbsent.mutate({ entryId: calledEntry.id });
            }
          }}
          disabled={!calledEntry || actionBusy}
          className="h-16 bg-amber-500 text-white text-base font-bold rounded-2xl
                     active:bg-amber-600 disabled:opacity-30 transition-colors touch-manipulation
                     flex flex-col items-center justify-center gap-0.5"
        >
          <span className="text-xl">⚠</span>
          <span>Ausente</span>
        </button>

        {/* Register new customer */}
        <button
          type="button"
          onClick={() => navigate('/register')}
          className="col-span-2 h-14 bg-indigo-600 text-white text-base font-bold rounded-xl
                     active:bg-indigo-700 transition-colors touch-manipulation"
        >
          + Registrar Cliente
        </button>
      </div>

      {/* Queue list */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading ? (
          <div className="py-8 text-center text-gray-400">Carregando fila...</div>
        ) : (
          <div className="flex flex-col gap-2">

            {/* In-service section */}
            {inServiceEntries.length > 0 && (
              <>
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wider pt-3 pb-1">
                  Em atendimento
                </p>
                {inServiceEntries.map((entry) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    queueId={queueId!}
                  />
                ))}
              </>
            )}

            {/* Waiting section */}
            {waitingEntries.length === 0 && inServiceEntries.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-400 text-lg">Fila vazia</p>
                <p className="text-gray-300 text-sm mt-1">Registre um cliente para começar</p>
              </div>
            ) : waitingEntries.length > 0 ? (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-3 pb-1">
                  Aguardando · {waitingEntries.length}
                </p>
                {waitingEntries.map((entry, index) => (
                  <QueueCard
                    key={entry.id}
                    entry={entry}
                    position={index + 1}
                    queueId={queueId!}
                    isFirst={index === 0}
                    isLast={index === waitingEntries.length - 1}
                  />
                ))}
              </>
            ) : null}

          </div>
        )}
      </div>

      {/* History modal */}
      {showHistory && queueId && (
        <HistoryModal queueId={queueId} onClose={() => setShowHistory(false)} />
      )}
    </TabletLayout>
  );
}
