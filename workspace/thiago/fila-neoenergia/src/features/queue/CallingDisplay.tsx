import { AnimatePresence, motion } from 'framer-motion';
import { useCalledEntry, useLastCalledEntry } from '@/shared/stores/queueStore';

export function CallingDisplay() {
  const calledEntry = useCalledEntry();
  const lastCalledEntry = useLastCalledEntry();

  return (
    <div>
      <section
        className="bg-green-700 text-white px-6 py-8 text-center"
        aria-live="polite"
        aria-label="Cliente sendo atendido"
      >
        <AnimatePresence mode="wait">
          {calledEntry ? (
            <motion.div
              key={calledEntry.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-green-200 text-sm uppercase tracking-widest font-medium">
                Atendendo agora
              </p>
              <p
                className="font-black text-white mt-1 leading-none"
                style={{ fontSize: 'clamp(2.5rem, 10vw, 5rem)' }}
              >
                {calledEntry.customer_name}
              </p>
              {calledEntry.was_absent && (
                <span className="inline-block mt-2 text-xs bg-amber-400 text-amber-900 px-2 py-0.5 rounded-full font-semibold">
                  ⚠ Retorno — estava ausente
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-4"
            >
              <p className="text-green-300 text-lg">Nenhum cliente em atendimento</p>
              <p className="text-green-400 text-sm mt-1">Clique em "Chamar Próximo" para iniciar</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* Previously called */}
      {lastCalledEntry && (
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2.5 flex items-center gap-3">
          <span className="text-xs text-gray-400 uppercase tracking-wider whitespace-nowrap">
            Anterior
          </span>
          <span className="text-sm font-semibold text-gray-600 truncate">
            {lastCalledEntry.customer_name}
          </span>
          {lastCalledEntry.was_absent && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full whitespace-nowrap">
              Ausente
            </span>
          )}
        </div>
      )}
    </div>
  );
}
