'use client'

interface DividerProps {
  orientation?: 'horizontal' | 'vertical'
  className?:   string
  subtle?:      boolean
}

export function Divider({
  orientation = 'horizontal',
  className,
  subtle = false,
}: DividerProps) {
  return (
    <div
      className={[
        'divider',
        `divider--${orientation}`,
        subtle ? 'divider--subtle' : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}

export default Divider
