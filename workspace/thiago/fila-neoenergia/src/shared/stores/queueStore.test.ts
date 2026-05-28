import { describe, it, expect, beforeEach } from 'vitest';
import { useQueueStore } from './queueStore';
import type { QueueEntry } from '@/shared/types';

const makeEntry = (overrides: Partial<QueueEntry> = {}): QueueEntry => ({
  id: 'entry-1',
  queue_id: 'queue-1',
  customer_name: 'João Silva',
  phone: '+5571999887766',
  scheduled_time: '14:30:00',
  status: 'waiting',
  called_at: null,
  served_at: null,
  finished_at: null,
  sms_sent: false,
  position: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  version: 0,
  ...overrides,
});

describe('queueStore', () => {
  beforeEach(() => {
    useQueueStore.setState({ entries: [], calledEntry: null, smsStatusMap: {} });
  });

  describe('setEntries', () => {
    it('replaces all entries', () => {
      const entry = makeEntry();
      useQueueStore.getState().actions.setEntries([entry]);
      expect(useQueueStore.getState().entries).toHaveLength(1);
      expect(useQueueStore.getState().entries[0].id).toBe('entry-1');
    });
  });

  describe('applyRealtimeEvent', () => {
    it('handles INSERT event', () => {
      const entry = makeEntry({ id: 'entry-new' });
      useQueueStore.getState().actions.applyRealtimeEvent({
        event_type: 'INSERT',
        entry,
      });
      expect(useQueueStore.getState().entries).toHaveLength(1);
      expect(useQueueStore.getState().entries[0].id).toBe('entry-new');
    });

    it('handles UPDATE event — updates existing entry', () => {
      const entry = makeEntry({ id: 'entry-1', status: 'waiting' });
      useQueueStore.setState({ entries: [entry] });

      useQueueStore.getState().actions.applyRealtimeEvent({
        event_type: 'UPDATE',
        entry: { ...entry, status: 'in_service' },
      });

      const updated = useQueueStore.getState().entries[0];
      expect(updated.status).toBe('in_service');
    });

    it('handles UPDATE — does not modify other entries', () => {
      const entry1 = makeEntry({ id: 'entry-1' });
      const entry2 = makeEntry({ id: 'entry-2', customer_name: 'Maria' });
      useQueueStore.setState({ entries: [entry1, entry2] });

      useQueueStore.getState().actions.applyRealtimeEvent({
        event_type: 'UPDATE',
        entry: { ...entry1, status: 'in_service' },
      });

      const e2 = useQueueStore.getState().entries.find((e) => e.id === 'entry-2');
      expect(e2?.customer_name).toBe('Maria');
    });

    it('handles DELETE event', () => {
      const entry = makeEntry({ id: 'entry-1' });
      useQueueStore.setState({ entries: [entry] });

      useQueueStore.getState().actions.applyRealtimeEvent({
        event_type: 'DELETE',
        entry: { id: 'entry-1' },
      });

      expect(useQueueStore.getState().entries).toHaveLength(0);
    });
  });

  describe('setSmsStatus', () => {
    it('sets SMS status for an entry', () => {
      useQueueStore.getState().actions.setSmsStatus('entry-1', 'sending');
      expect(useQueueStore.getState().smsStatusMap['entry-1']).toBe('sending');
    });

    it('updates to delivered', () => {
      useQueueStore.getState().actions.setSmsStatus('entry-1', 'sent');
      useQueueStore.getState().actions.setSmsStatus('entry-1', 'delivered');
      expect(useQueueStore.getState().smsStatusMap['entry-1']).toBe('delivered');
    });
  });

  describe('useWaitingEntries selector', () => {
    it('filters only waiting entries', () => {
      const entries = [
        makeEntry({ id: '1', status: 'waiting' }),
        makeEntry({ id: '2', status: 'in_service' }),
        makeEntry({ id: '3', status: 'absent' }),
        makeEntry({ id: '4', status: 'finished' }),
      ];
      useQueueStore.setState({ entries });

      const waiting = useQueueStore
        .getState()
        .entries.filter((e) => e.status === 'waiting');
      expect(waiting).toHaveLength(1);
      expect(waiting[0].id).toBe('1');
    });
  });
});
