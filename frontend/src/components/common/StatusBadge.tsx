import { type WebhookEventStatus } from '@/types/event.types'
import { cn } from '@/lib/utils'

const statusConfig: Record<WebhookEventStatus, { label: string; className: string; dot: string }> = {
  Pending:          { label: 'Pending',          className: 'bg-hf-info-dim text-hf-info border border-hf-info/20',              dot: 'bg-hf-info animate-pulse' },
  Processing:       { label: 'Processing',       className: 'bg-hf-accent-dim text-hf-accent-lt border border-hf-accent/20',     dot: 'bg-hf-accent-lt animate-pulse' },
  Processed:        { label: 'Processed',        className: 'bg-hf-success-dim text-hf-success border border-hf-success/20',     dot: 'bg-hf-success' },
  Failed:           { label: 'Failed',           className: 'bg-hf-danger-dim text-hf-danger border border-hf-danger/20',        dot: 'bg-hf-danger' },
  Retrying:         { label: 'Retrying',         className: 'bg-hf-warning-dim text-hf-warning border border-hf-warning/20',     dot: 'bg-hf-warning animate-pulse' },
  Dead:             { label: 'Dead',             className: 'bg-hf-muted/10 text-hf-muted border border-hf-muted/20',            dot: 'bg-hf-muted' },
  Ignored:          { label: 'Ignored',          className: 'bg-hf-muted/10 text-hf-muted border border-hf-muted/20',            dot: 'bg-hf-muted' },
  InvalidSignature: { label: 'Invalid Sig',      className: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',      dot: 'bg-orange-400' },
  Duplicate:        { label: 'Duplicate',        className: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',      dot: 'bg-purple-400' },
}

interface StatusBadgeProps {
  status: WebhookEventStatus
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, showDot = true, className }: StatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig.Pending

  return (
    <span className={cn('badge', config.className, className)}>
      {showDot && (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dot)} />
      )}
      {config.label}
    </span>
  )
}
