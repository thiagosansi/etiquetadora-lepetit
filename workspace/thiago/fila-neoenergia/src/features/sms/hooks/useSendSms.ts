import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useQueueActions } from '@/shared/stores/queueStore';

interface SendSmsParams {
  entryId: string;
  queueId: string;
}

export function useSendSms() {
  const { setSmsStatus } = useQueueActions();

  return useMutation({
    mutationFn: async ({ entryId, queueId }: SendSmsParams) => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            entry_id: entryId,
            queue_id: queueId,
            trigger: 'manual',
            target_entry_id: entryId,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`SMS service error: ${response.status}`);
      }

      return response.json() as Promise<{ sent: boolean; entry_id: string }>;
    },
    onMutate: ({ entryId }) => {
      setSmsStatus(entryId, 'sending');
    },
    onSuccess: (data, { entryId }) => {
      setSmsStatus(entryId, data.sent ? 'sent' : 'failed');
      if (data.sent) {
        toast.success('SMS enviado com sucesso!');
      } else {
        toast.error('SMS não pôde ser enviado.');
      }
    },
    onError: (_, { entryId }) => {
      setSmsStatus(entryId, 'failed');
      toast.error('Falha ao enviar SMS. Verifique a conexão.');
    },
  });
}
