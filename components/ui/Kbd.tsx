'use client'

interface KbdProps {
  children:   React.ReactNode
  className?: string
}

/** Single keyboard key — renders with physical depth via border-bottom */
export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd className={`kbd ${className ?? ''}`}>
      {children}
    </kbd>
  )
}

// ─── Shortcut — renders a chord of multiple keys ─────────────────────────────

interface ShortcutProps {
  keys:       string[]
  className?: string
}

export function Shortcut({ keys, className }: ShortcutProps) {
  return (
    <span className={`shortcut ${className ?? ''}`}>
      {keys.map((key, i) => (
        <span key={`${key}-${i}`} className="shortcut__key-wrapper">
          <Kbd>{key}</Kbd>
          {i < keys.length - 1 && (
            <span className="shortcut__separator" aria-hidden="true">+</span>
          )}
        </span>
      ))}
    </span>
  )
}
