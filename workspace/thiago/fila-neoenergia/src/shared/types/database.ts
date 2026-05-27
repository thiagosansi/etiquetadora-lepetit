export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      queues: {
        Row: {
          id: string;
          name: string;
          date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          date?: string;
          created_at?: string;
        };
      };
      queue_entries: {
        Row: {
          id: string;
          queue_id: string;
          customer_name: string;
          phone: string;
          scheduled_time: string;
          status: 'waiting' | 'in_service' | 'absent' | 'finished';
          called_at: string | null;
          served_at: string | null;
          finished_at: string | null;
          sms_sent: boolean;
          created_at: string;
          updated_at: string;
          version: number;
        };
        Insert: {
          id?: string;
          queue_id: string;
          customer_name: string;
          phone: string;
          scheduled_time: string;
          status?: 'waiting' | 'in_service' | 'absent' | 'finished';
          called_at?: string | null;
          served_at?: string | null;
          finished_at?: string | null;
          sms_sent?: boolean;
          created_at?: string;
          updated_at?: string;
          version?: number;
        };
        Update: {
          status?: 'waiting' | 'in_service' | 'absent' | 'finished';
          called_at?: string | null;
          served_at?: string | null;
          finished_at?: string | null;
          sms_sent?: boolean;
          updated_at?: string;
          version?: number;
        };
      };
      operators: {
        Row: {
          id: string;
          name: string;
          pin_hash: string;
        };
        Insert: {
          id?: string;
          name: string;
          pin_hash: string;
        };
        Update: {
          name?: string;
          pin_hash?: string;
        };
      };
    };
    Functions: {
      call_next_in_queue: {
        Args: { p_queue_id: string };
        Returns: {
          id: string;
          customer_name: string;
          phone: string;
          scheduled_time: string;
          status: string;
        }[];
      };
      authenticate_operator: {
        Args: { p_pin: string };
        Returns: { id: string; name: string } | null;
      };
      get_queue_position: {
        Args: { entry_id: string };
        Returns: number;
      };
    };
    Enums: {
      queue_status: 'waiting' | 'in_service' | 'absent' | 'finished';
    };
  };
}
