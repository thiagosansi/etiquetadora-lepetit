export type QueueStatus = 'waiting' | 'in_service' | 'absent' | 'finished';

export type SmsStatus = 'sending' | 'sent' | 'delivered' | 'failed';

export interface Queue {
  id: string;
  name: string;
  date: string;
  created_at: string;
}

export interface QueueEntry {
  id: string;
  queue_id: string;
  customer_name: string;
  phone: string;
  scheduled_time: string;
  status: QueueStatus;
  called_at: string | null;
  served_at: string | null;
  finished_at: string | null;
  sms_sent: boolean;
  was_absent: boolean;
  position: number | null;
  created_at: string;
  updated_at: string;
  version: number;
}

export interface Operator {
  id: string;
  name: string;
}

export interface RealtimeQueuePayload {
  event_type: 'INSERT' | 'UPDATE' | 'DELETE';
  entry: Partial<QueueEntry>;
}

export interface RegistrationFormData {
  customer_name: string;
  phone: string;
}
