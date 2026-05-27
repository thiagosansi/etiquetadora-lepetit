import { AnimatePresence, motion } from 'framer-motion';
import { useCalledEntry } from '@/shared/stores/queueStore';

export function CallingDisplay() {
  const calledEntry = useCalledEntry();

  return (
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
              style={{ fontSize: 'clamp(4rem, 15vw, 8rem)' }}
              aria-label={`Senha ${calledEntry.scheduled_time}`}
            >
              {calledEntry.scheduled_time.slice(0, 5)}
            </p>
            <p className="text-2xl font-semibold mt-3 text-green-100">
              {calledEntry.customer_name}
            </p>
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
  );
}
