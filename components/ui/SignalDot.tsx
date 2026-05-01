'use client'

import { useNexusStore } from '@/store/nexusStore'

/**
 * SignalDot — AI activity indicator
 *
 * PRD Section 2.7 — AI Presence State 1 (Ambient):
 * "Single 6×6px signal-yellow dot in nav rail bottom"
 * "Pulses only during Groq API calls"
 * "Static otherwise — no animation, no label"
 *
 * This component has ONE job.
 * Do not add tooltips, labels, or click handlers.
 * Do not change the size.
 * Do not change the color.
 * The signal color budget is 8 uses total in the UI.
 * This dot is one of them.
 */
export interface SignalDotProps {
  className?: string
  style?: React.CSSProperties
}

export function SignalDot({
  className,
  style,
}: SignalDotProps): React.JSX.Element {
  const isAiProcessing = useNexusStore(s => s.isAiProcessing)

  return (
    <div
      aria-label={isAiProcessing ? 'AI processing' : 'AI ready'}
      aria-live="polite"
      className={className}
      style={{
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        backgroundColor: 'var(--color-signal)',
        flexShrink: 0,
        // Pulse ONLY during active Groq calls
        animation: isAiProcessing
          ? 'signal-pulse 2.4s ease-in-out infinite'
          : 'none',
        // Static when idle — no idle animation
        opacity: isAiProcessing ? 1 : 0.4,
        transition: 'opacity 400ms',
        ...style,
      }}
    />
  )
}

export default SignalDot
