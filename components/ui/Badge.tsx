// Badge.tsx
'use client'

type BadgeVariant = 'default' | 'signal' | 'apex' | 'haven' | 'error' | 'success'

interface BadgeProps {
  children:  React.ReactNode
  variant?:  BadgeVariant
  className?: string
}

const BADGE_VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { color: 'var(--color-text-secondary)', borderColor: 'var(--color-border)' },
  signal:  { color: 'var(--color-signal)',         borderColor: 'rgba(232,255,71,0.3)' },
  apex:    { color: 'var(--color-apex)',            borderColor: 'rgba(34,211,238,0.3)' },
  haven:   { color: 'var(--color-haven)',           borderColor: 'rgba(196,168,130,0.3)' },
  error:   { color: 'var(--color-error)',           borderColor: 'rgba(255,68,68,0.3)' },
  success: { color: 'var(--color-success)',         borderColor: 'rgba(74,222,128,0.3)' },
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={`badge ${className ?? ''}`}
      style={BADGE_VARIANT_STYLES[variant]}
    >
      {children}
    </span>
  )
}
