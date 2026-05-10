'use client'
import type { Mode } from '@/types/mode'

interface ModeIndicatorProps {
  mode:       Mode
  /** Show persona label — COMMANDER/POET instead of APEX/HAVEN */
  persona?:   boolean
  size?:      'sm' | 'md'
  className?: string
}

export function ModeIndicator({
  mode,
  persona   = false,
  size      = 'sm',
  className,
}: ModeIndicatorProps) {
  const label = persona
    ? mode === 'apex' ? 'COMMANDER' : 'POET'
    : mode === 'apex' ? 'APEX'      : 'HAVEN'

  return (
    <span
      className={[
        'mode-indicator',
        `mode-indicator--${mode}`,
        `mode-indicator--${size}`,
        className ?? '',
      ].filter(Boolean).join(' ')}
      aria-label={`${label} mode`}
    >
      <span className="mode-indicator__dot" aria-hidden="true" />
      {label}
    </span>
  )
}
