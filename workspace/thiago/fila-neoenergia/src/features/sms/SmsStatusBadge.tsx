import { useSmsStatus } from '@/shared/stores/queueStore';
import type { SmsStatus } from '@/shared/types';

const STATUS_CONFIG: Record<
  SmsStatus,
  { label: string; className: string }
> = {
  sending: {
    label: 'Enviando…',
    className: 'bg-yellow-100 text-yellow-800',
  },
  sent: {
    label: 'Enviado',
    className: 'bg-blue-100 text-blue-800',
  },
  delivered: {
    label: 'Entregue',
    className: 'bg-green-100 text-green-800',
  },
  failed: {
    label: 'Falhou',
    className: 'bg-red-100 text-red-800',
  },
};

interface SmsStatusBadgeProps {
  entryId: string;
}

export function SmsStatusBadge({ entryId }: SmsStatusBadgeProps) {
  const status = useSmsStatus(entryId);

  if (!status) return null;

  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
