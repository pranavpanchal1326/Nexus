'use client'
import { useRef, useEffect, useState, type ReactNode } from 'react'

interface ScrollAreaProps {
  children:    ReactNode
  className?:  string
  height?:     string | number
  /** Show fade gradient at top/bottom edges when content overflows */
  showFade?:   boolean
  /** Fade color — defaults to match surface background */
  fadeColor?:  string
}

export function ScrollArea({
  children,
  className,
  height,
  showFade  = true,
  fadeColor = 'var(--color-surface)',
}: ScrollAreaProps) {
  const scrollRef              = useRef<HTMLDivElement>(null)
  const [atTop,    setAtTop]   = useState(true)
  const [atBottom, setAtBottom]= useState(false)

  useEffect(() => {
    if (!showFade) return
    const el = scrollRef.current
    if (!el) return

    const check = () => {
      setAtTop(el.scrollTop <= 4)
      setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= 4)
    }

    // Initialize
    check()

    // Also check after content loads — images, dynamic height
    const ro = new ResizeObserver(check)
    ro.observe(el)

    el.addEventListener('scroll', check, { passive: true })
    return () => {
      el.removeEventListener('scroll', check)
      ro.disconnect()
    }
  }, [showFade])

  const resolvedHeight = typeof height === 'number' ? `${height}px` : height

  return (
    <div
      className={`scroll-area ${className ?? ''}`}
      style={{ height: resolvedHeight }}
    >
      {/* Top fade — appears after scrolling down */}
      {showFade && !atTop && (
        <div
          className="scroll-area__fade scroll-area__fade--top"
          style={{ background: `linear-gradient(to bottom, ${fadeColor} 0%, transparent 100%)` }}
          aria-hidden="true"
        />
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="scroll-area__content"
      >
        {children}
      </div>

      {/* Bottom fade — appears when content overflows */}
      {showFade && !atBottom && (
        <div
          className="scroll-area__fade scroll-area__fade--bottom"
          style={{ background: `linear-gradient(to top, ${fadeColor} 0%, transparent 100%)` }}
          aria-hidden="true"
        />
      )}
    </div>
  )
}
