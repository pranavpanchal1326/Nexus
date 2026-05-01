import type { ReactNode } from 'react'

export type BadgeVariant = 'default' | 'signal' | 'apex' | 'haven' | 'error'

export interface BadgeProps {
  children: ReactNode
  variant?: BadgeVariant
  className?: string
}

const BADGE_COLORS: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    color: 'var(--color-text-secondary)',
    borderColor: 'var(--color-border)',
    background: 'transparent',
  },
  signal: {
    color: 'var(--color-signal)',
    borderColor: 'rgba(232,255,71,0.3)',
    background: 'rgba(232,255,71,0.06)',
  },
  apex: {
    color: 'var(--color-apex)',
    borderColor: 'rgba(34,211,238,0.3)',
    background: 'rgba(34,211,238,0.06)',
  },
  haven: {
    color: 'var(--color-haven)',
    borderColor: 'rgba(196,168,130,0.3)',
    background: 'rgba(196,168,130,0.06)',
  },
  error: {
    color: 'var(--color-error)',
    borderColor: 'rgba(255,68,68,0.3)',
    background: 'rgba(255,68,68,0.06)',
  },
}

export function Badge({
  children,
  variant = 'default',
}: BadgeProps): React.JSX.Element {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '10px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: 'var(--radius-badge)',
        border: '1px solid',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
        ...BADGE_COLORS[variant],
      }}
    >
      {children}
    </span>
  )
}

export default Badge
