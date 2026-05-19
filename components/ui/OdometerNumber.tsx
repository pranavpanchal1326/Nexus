'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OdometerNumberProps {
  value: number
  className?: string
  prefix?: string
  suffix?: string
  /** Format with commas — 1234 → 1,234 */
  format?: boolean
  /** Animation duration in seconds */
  duration?: number
  /** Delay before rolling in seconds */
  delay?: number
  /** Style applied to the outer container */
  style?: CSSProperties
}

// ─── Digit roller — single digit position ─────────────────────────────────────

interface DigitRollerProps {
  digit: string
  prevDigit: string
  direction: 'up' | 'down' | 'none'
  duration: number
  delay: number
  index: number
}

function DigitRoller({
  digit,
  prevDigit,
  direction,
  duration,
  delay,
  index,
}: DigitRollerProps) {
  const isNumeric = /^\d$/.test(digit)

  // Non-numeric chars (commas, decimals) — static, no animation
  if (!isNumeric || digit === prevDigit || direction === 'none') {
    return (
      <span
        style={{
          display: 'inline-block',
          lineHeight: 'inherit',
        }}
      >
        {digit}
      </span>
    )
  }

  const exitY = direction === 'up' ? '-100%' : '100%'
  const enterY = direction === 'up' ? '100%' : '-100%'

  return (
    <span
      style={{
        display: 'inline-block',
        overflow: 'hidden',
        lineHeight: 'inherit',
        verticalAlign: 'bottom',
      }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${digit}-${index}`}
          style={{ display: 'inline-block' }}
          initial={{ y: enterY, opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: exitY, opacity: 0 }}
          transition={{
            duration,
            delay: delay + index * 0.015,
            ease: [0.4, 0, 0.2, 1],
          }}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </span>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function OdometerNumber({
  value,
  className,
  prefix,
  suffix,
  format = false,
  duration = 0.15,
  delay = 0,
  style,
}: OdometerNumberProps) {
  const [displayValue, setDisplayValue] = useState(value)
  const [prevValue, setPrevValue] = useState(value)
  const [direction, setDirection] = useState<'up' | 'down' | 'none'>('none')
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      setDisplayValue(value)
      setPrevValue(value)
      return
    }

    if (value === displayValue) return

    setDirection(value > displayValue ? 'up' : 'down')
    setPrevValue(displayValue)
    setDisplayValue(value)
  }, [value, displayValue])

  // Format value — with or without commas
  const formatValue = (n: number): string => {
    if (format) return n.toLocaleString('en-US')
    return String(Math.round(n))
  }

  const currentStr = formatValue(displayValue)
  const prevStr = formatValue(prevValue)

  // Pad shorter string with leading spaces so digit positions align
  const maxLen = Math.max(currentStr.length, prevStr.length)
  const currPad = currentStr.padStart(maxLen, ' ')
  const prevPad = prevStr.padStart(maxLen, ' ')

  const digits = useMemo(
    () =>
      currPad.split('').map((char, i) => ({
        current: char,
        previous: prevPad[i] ?? ' ',
      })),
    [currPad, prevPad]
  )

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'baseline',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        ...style,
      }}
      aria-label={`${prefix ?? ''}${value}${suffix ?? ''}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {prefix && (
        <span style={{ marginRight: 1 }}>{prefix}</span>
      )}

      {digits.map((d, i) => (
        <DigitRoller
          key={i}
          digit={d.current}
          prevDigit={d.previous}
          direction={direction}
          duration={duration}
          delay={delay}
          index={i}
        />
      ))}

      {suffix && (
        <span style={{ marginLeft: 2 }}>{suffix}</span>
      )}
    </span>
  )
}
