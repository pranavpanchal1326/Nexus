'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore } from '@/store/nexusStore'
import { playProtocolZero } from '@/lib/audio'
import type { Mode } from '@/types/mode'

type ProtocolPhase =
  | 'idle'
  | 'blackout'
  | 'voice'
  | 'returning'
  | 'complete'

const PROTOCOL_ZERO_PHRASES: Record<Mode, string[]> = {
  apex: [
    "Breathe. You are in control. Return when ready.",
    "One task. One moment. Begin again.",
    "The system waits. You do not have to.",
    "Clear. Focused. Present. Begin.",
  ],
  haven: [
    "You are here. That is enough.",
    "Breathe slowly. Nothing is urgent.",
    "Rest in this moment. The work will wait.",
    "Stillness first. Then everything else.",
  ],
}

export function ProtocolZero(): React.JSX.Element {
  const { mode } = useNexusStore()
  const [phase, setPhase] = useState<ProtocolPhase>('idle')
  const [showLine1, setShowLine1] = useState(false)
  const [showLine2, setShowLine2] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStartRef = useRef<number>(0)
  const sequenceRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const HOLD_DURATION = 2000 // 2s hold to trigger

  const getPhrase = useCallback((m: Mode): string => {
    const phrases = PROTOCOL_ZERO_PHRASES[m]
    // Use Date.now() modulo to cycle through phrases deterministically —
    // no Math.random(), result is stable within the same second
    const index = Math.floor(Date.now() / 1000) % phrases.length
    return phrases[index] ?? phrases[0] ?? ''
  }, [])

  const speakPhrase = useCallback((phrase: string, m: Mode) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(phrase)
    utterance.rate = m === 'apex' ? 0.85 : 0.75
    utterance.pitch = m === 'apex' ? 1.0 : 0.85
    utterance.volume = 0.9

    // Prefer a calm voice — filter available voices
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Karen')
    )
    if (preferred) utterance.voice = preferred

    window.speechSynthesis.speak(utterance)
  }, [])

  const triggerProtocolZero = useCallback(() => {
    if (phase !== 'idle') return

    const phrase = getPhrase(mode)

    setPhase('blackout')
    setShowLine1(false)
    setShowLine2(false)

    // Haptic
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
    
    // Play synthesis sound
    playProtocolZero()

    const t1 = setTimeout((): void => {
      setPhase('voice')
      speakPhrase(phrase, mode)
    }, 200)

    const t2 = setTimeout((): void => setShowLine1(true), 3500)
    const t3 = setTimeout((): void => setShowLine2(true), 4000)
    const t4 = setTimeout((): void => setPhase('returning'), 4800)
    const t5 = setTimeout((): void => {
      setPhase('idle')
      setShowLine1(false)
      setShowLine2(false)
    }, 5400)

    sequenceRef.current = [t1, t2, t3, t4, t5]
  }, [phase, mode, getPhrase, speakPhrase])

  // Keyboard — hold Escape 2s
  useEffect((): (() => void) => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape' || isHolding) return
      setIsHolding(true)
      holdStartRef.current = Date.now()

      holdTimerRef.current = setInterval((): void => {
        const elapsed = Date.now() - holdStartRef.current
        const progress = Math.min(elapsed / HOLD_DURATION, 1)
        setHoldProgress(progress)

        if (progress >= 1) {
          clearInterval(holdTimerRef.current!)
          setIsHolding(false)
          setHoldProgress(0)
          triggerProtocolZero()
        }
      }, 16)
    }

    const handleKeyUp = (e: KeyboardEvent): void => {
      if (e.key !== 'Escape') return
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
      setIsHolding(false)
      setHoldProgress(0)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
  }, [isHolding, triggerProtocolZero])

  // Custom event trigger — for mobile gesture or manual dispatch
  useEffect((): (() => void) => {
    const handler = (): void => triggerProtocolZero()
    window.addEventListener('nexus:protocol-zero', handler)
    return () => window.removeEventListener('nexus:protocol-zero', handler)
  }, [triggerProtocolZero])

  // Cleanup
  useEffect((): (() => void) => {
    return () => sequenceRef.current.forEach(clearTimeout)
  }, [])

  const line1 = mode === 'apex'
    ? 'PROTOCOL ZERO — SYSTEM RESET'
    : 'PROTOCOL ZERO — REST COMPLETE'

  const line2 = mode === 'apex'
    ? 'Commander standing by.'
    : 'You are held.'

  return (
    <>
      {/* Hold progress ring — shows during Escape hold, not during sequence */}
      <AnimatePresence>
        {isHolding && holdProgress > 0 && (
          <motion.div
            className="protocol-hold-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
          >
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="1"
              />
              <motion.circle
                cx="24" cy="24" r="20"
                fill="none"
                stroke="var(--color-signal)"
                strokeWidth="1"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={2 * Math.PI * 20 * (1 - holdProgress)}
                transform="rotate(-90 24 24)"
                transition={{ duration: 0 }}
              />
            </svg>
            <span className="protocol-hold-label">HOLD</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The blackout sequence */}
      <AnimatePresence>
        {phase !== 'idle' && (
          <motion.div
            className="protocol-zero-overlay"
            initial={{ opacity: 0 }}
            animate={{
              opacity: phase === 'returning' ? 0 : 1
            }}
            transition={{
              duration: phase === 'returning' ? 0.6 : 0.1,
              ease: 'linear'
            }}
          >
            {/* Signal dot — appears at 3000ms */}
            <AnimatePresence>
              {(phase === 'voice' || phase === 'returning') && showLine1 && (
                <motion.div
                  className="protocol-zero-dot"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 1, 0.4, 1], scale: 1 }}
                  transition={{
                    opacity: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' },
                    scale: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
                  }}
                />
              )}
            </AnimatePresence>

            {/* Return text */}
            <div className="protocol-zero-text">
              <AnimatePresence>
                {showLine1 && (
                  <motion.span
                    className="protocol-zero-line1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    {line1}
                  </motion.span>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showLine2 && (
                  <motion.span
                    className="protocol-zero-line2"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {line2}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
