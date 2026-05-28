import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { QueueEntry, SmsStatus, RealtimeQueuePayload } from '@/shared/types';

interface QueueState {
  entries: QueueEntry[];
  calledEntry: QueueEntry | null;
  smsStatusMap: Record<string, SmsStatus>;
  actions: {
    setEntries: (entries: QueueEntry[]) => void;
    applyRealtimeEvent: (payload: RealtimeQueuePayload) => void;
    setCalledEntry: (entry: QueueEntry | null) => void;
    setSmsStatus: (entryId: string, status: SmsStatus) => void;
    clearSmsStatus: (entryId: string) => void;
  };
}

export const useQueueStore = create<QueueState>()((set) => ({
  entries: [],
  calledEntry: null,
  smsStatusMap: {},

  actions: {
    setEntries: (entries) => set({ entries }),

    applyRealtimeEvent: (payload) =>
      set((state) => {
        const { event_type, entry } = payload;

        if (event_type === 'INSERT') {
          const newEntry = entry as QueueEntry;
          // Idempotent: skip if already in store (race between realtime + query refetch)
          if (state.entries.some((e) => e.id === newEntry.id)) return state;
          return { entries: [...state.entries, newEntry] };
        }

        if (event_type === 'UPDATE') {
          const updatedEntry = entry as QueueEntry;
          const newEntries = state.entries.map((e) =>
            e.id === updatedEntry.id ? { ...e, ...updatedEntry } : e,
          );
          const calledEntry =
            state.calledEntry?.id === updatedEntry.id
              ? { ...state.calledEntry, ...updatedEntry }
              : state.calledEntry;
          return { entries: newEntries, calledEntry };
        }

        if (event_type === 'DELETE') {
          const deletedId = entry.id;
          return {
            entries: state.entries.filter((e) => e.id !== deletedId),
            calledEntry: state.calledEntry?.id === deletedId ? null : state.calledEntry,
          };
        }

        return state;
      }),

    setCalledEntry: (entry) => set({ calledEntry: entry }),

    setSmsStatus: (entryId, status) =>
      set((state) => ({
        smsStatusMap: { ...state.smsStatusMap, [entryId]: status },
      })),

    clearSmsStatus: (entryId) =>
      set((state) => {
        const { [entryId]: _, ...rest } = state.smsStatusMap;
        return { smsStatusMap: rest };
      }),
  },
}));

// Selector hooks (tkdodo pattern — avoid re-renders)
export const useEntries = () => useQueueStore((s) => s.entries);
export const useWaitingEntries = () =>
  useQueueStore(useShallow((s) => s.entries.filter((e) => e.status === 'waiting')));
export const useCalledEntry = () => useQueueStore((s) => s.calledEntry);
export const useSmsStatus = (entryId: string) =>
  useQueueStore((s) => s.smsStatusMap[entryId]);
export const useQueueActions = () => useQueueStore((s) => s.actions);
