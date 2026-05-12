'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore }            from '@/store/nexusStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalDotProps {
  /** Dot diameter in px — default 6 */
  size?:       number
  /** Show request count badge — for debugging in dev */
  showCount?:  boolean
  /** Override active state — for testing */
  forceActive?: boolean
  className?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SignalDot({
  size        = 6,
  showCount   = false,
  forceActive,
  className,
}: SignalDotProps) {
  const signalActive  = useNexusStore(state => state.signalActive)
  const requestCount  = useNexusStore(state => state.requestCount)

  const isActive = forceActive ?? signalActive

  return (
    <div
      className={`signal-dot-wrapper ${className || ''}`}
      style={{ width: size, height: size }}
      aria-label={isActive ? 'AI processing' : 'AI ready'}
      role="status"
    >
      {/* Static base dot — always visible */}
      <motion.div
        className="signal-dot-base"
        style={{
          width:        size,
          height:       size,
          borderRadius: '50%',
          position:     'relative',
          zIndex:       2,
        }}
        animate={{
          background: isActive
            ? 'var(--color-signal)'
            : 'var(--color-text-disabled)',
        }}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
      />

      {/* Pulse ring — only during active AI processing */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="pulse-ring"
            style={{
              position:     'absolute',
              inset:        -(size * 0.8),
              borderRadius: '50%',
              border:       `1px solid var(--color-signal)`,
              zIndex:       1,
            }}
            initial={{ opacity: 0.8, scale: 1 }}
            animate={{ opacity: 0, scale: 2.6 }}
            exit={{    opacity: 0,   scale: 2.6 }}
            transition={{
              duration: 2.4,
              repeat:   Infinity,
              ease:     'easeOut',
            }}
          />
        )}
      </AnimatePresence>

      {/* Second pulse ring — offset for depth */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="pulse-ring-2"
            style={{
              position:     'absolute',
              inset:        -(size * 0.5),
              borderRadius: '50%',
              border:       `1px solid var(--color-signal)`,
              zIndex:       1,
            }}
            initial={{ opacity: 0.5, scale: 1 }}
            animate={{ opacity: 0, scale: 2 }}
            exit={{    opacity: 0,   scale: 2 }}
            transition={{
              duration:  2.4,
              repeat:    Infinity,
              ease:      'easeOut',
              delay:     0.8,    // Offset from first ring
            }}
          />
        )}
      </AnimatePresence>

      {/* Dev mode: request count badge */}
      {showCount && process.env.NODE_ENV === 'development' && requestCount > 0 && (
        <div
          style={{
            position:      'absolute',
            top:           -(size),
            right:         -(size),
            background:    'var(--color-signal)',
            color:         '#000',
            borderRadius:  '50%',
            width:         size * 1.8,
            height:        size * 1.8,
            display:       'flex',
            alignItems:    'center',
            justifyContent: 'center',
            fontSize:      8,
            fontFamily:    'var(--font-mono)',
            fontWeight:    700,
            zIndex:        3,
          }}
        >
          {requestCount}
        </div>
      )}
    </div>
  )
}

// ─── Larger signal dot — for IntelPanel header ────────────────────────────────

export function SignalDotLarge() {
  return <SignalDot size={8} />
}

// ─── Inline signal dot — for nav rail bottom ─────────────────────────────────

export function SignalDotNav() {
  return <SignalDot size={6} />
}
