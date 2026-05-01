'use client'

import { useEffect, useRef, useState } from 'react'
import { useMode } from '@/store/nexusStore'

export interface OdometerNumberProps {
  /** The number to display */
  value: number
  /** Optional suffix — "days", "xp", "words" */
  suffix?: string
  /** Font size in px — defaults to inherit */
  fontSize?: number
  /** Color — defaults to text-primary */
  color?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * OdometerNumber — rolling number display
 *
 * PRD Section 2.5:
 * "Number odometer: y: 0→-100% out, 100%→0 in, 150ms"
 *
 * When value changes:
 * 1. Old number rolls UP and out
 * 2. New number rolls UP from below
 * Mode-aware speed: APEX 150ms, HAVEN 240ms
 */
export function OdometerNumber({
  value,
  suffix,
  fontSize,
  color,
  className,
  style,
}: OdometerNumberProps): React.JSX.Element {
  const mode = useMode()
  const duration = mode === 'apex' ? 150 : 240

  const [displayValue, setDisplayValue] = useState(value)
  const [isRolling, setIsRolling] = useState(false)
  const [incomingValue, setIncomingValue] = useState(value)
  const prevValue = useRef(value)

  useEffect((): (() => void) | void => {
    if (value === prevValue.current) return

    // Start roll animation
    setIncomingValue(value)
    setIsRolling(true)

    const timer = setTimeout((): void => {
      setDisplayValue(value)
      setIsRolling(false)
      prevValue.current = value
    }, duration)

    return () => clearTimeout(timer)
  }, [value, duration])

  const sharedStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontVariantNumeric: 'tabular-nums',
    fontSize: fontSize !== undefined ? `${fontSize}px` : 'inherit',
    color: color ?? 'var(--color-text-primary)',
    letterSpacing: '-0.02em',
    lineHeight: 1,
    display: 'inline-block',
  }

  return (
    <span
      className={className}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {/* Outgoing number — rolls up and out */}
      {isRolling && (
        <span
          aria-hidden="true"
          style={{
            ...sharedStyle,
            position: 'absolute',
            animation: `odometer-out ${duration}ms cubic-bezier(0.4,0,0.2,1) forwards`,
          }}
        >
          {displayValue.toLocaleString()}
        </span>
      )}

      {/* Incoming number — rolls up from below */}
      <span
        style={{
          ...sharedStyle,
          animation: isRolling
            ? `odometer-in ${duration}ms cubic-bezier(0.16,1,0.3,1) forwards`
            : 'none',
          visibility: isRolling ? 'visible' : 'visible',
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {isRolling
          ? incomingValue.toLocaleString()
          : displayValue.toLocaleString()}
      </span>

      {/* Suffix */}
      {suffix !== undefined && (
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: fontSize !== undefined
              ? `${Math.round(fontSize * 0.6)}px`
              : '11px',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-secondary)',
          }}
        >
          {suffix}
        </span>
      )}
    </span>
  )
}

export default OdometerNumber
