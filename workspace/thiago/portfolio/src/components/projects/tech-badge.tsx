import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TechBadgeProps {
  tech: string
  className?: string
}

export function TechBadge({ tech, className }: TechBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('text-xs font-mono', className)}>
      {tech}
    </Badge>
  )
}
