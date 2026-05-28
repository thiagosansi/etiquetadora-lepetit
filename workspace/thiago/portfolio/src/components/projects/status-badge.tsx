import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type DisplayStatus = 'live' | 'beta' | 'building' | 'discontinued'

const STATUS_CONFIG: Record<DisplayStatus, { label: string; className: string }> = {
  live: { label: 'Live', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  beta: { label: 'Beta', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  building: { label: 'Em desenvolvimento', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  discontinued: { label: 'Descontinuado', className: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
}

interface StatusBadgeProps {
  status: DisplayStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  return (
    <Badge
      variant="outline"
      className={cn('text-xs font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
