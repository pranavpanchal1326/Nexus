'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore } from '@/store/nexusStore'
import { playModeTransition } from '@/lib/audio'
import type { Mode } from '@/types/mode'

interface Particle {
  id: number
  x: number         // vw units, randomized 10-90
  y: number         // vh units, randomized 10-90
  variant: 'line' | 'dot'
  delay: number     // staggered — 0 to 200ms
}

function generateParticles(mode: Mode): Particle[] {
  return Array.from({ length: 12 }, (_, i) => ({
    id: i,
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80,
    variant: mode === 'apex' ? 'line' : 'dot',
    delay: i * 16,
  }))
}

type TransitionPhase =
  | 'idle'
  | 'entering'
  | 'identity'
  | 'holding'
  | 'exiting'
  | 'complete'

interface ModeTransitionProps {
  onComplete?: (newMode: Mode) => void
}

export function ModeTransition({ onComplete }: ModeTransitionProps) {
  const { mode, setMode } = useNexusStore()
  const [isPlaying, setIsPlaying] = useState(false)
  const [phase, setPhase] = useState<TransitionPhase>('idle')
  const [targetMode, setTargetMode] = useState<Mode>(mode === 'apex' ? 'haven' : 'apex')
  const [particles, setParticles] = useState<Particle[]>([])
  const sequenceRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // Exposed trigger — called by DynamicIsland click
  const trigger = useCallback(() => {
    if (isPlaying) return  // non-interruptible

    const next: Mode = mode === 'apex' ? 'haven' : 'apex'
    setTargetMode(next)
    setParticles(generateParticles(next))
    setIsPlaying(true)
    setPhase('entering')
    playModeTransition(next)

    // The 600ms sequence
    const t1 = setTimeout(() => setPhase('identity'), 80)
    const t2 = setTimeout(() => setPhase('holding'), 200)
    const t3 = setTimeout(() => setPhase('exiting'), 500)
    const t4 = setTimeout(() => {
      setMode(next)              // Zustand updated AFTER visual completes
      setIsPlaying(false)
      setPhase('idle')
      onComplete?.(next)
    }, 600)

    sequenceRef.current = [t1, t2, t3, t4]
  }, [isPlaying, mode, setMode, onComplete])

  // Cleanup on unmount
  useEffect(() => {
    return () => sequenceRef.current.forEach(clearTimeout)
  }, [])

  // Expose trigger via custom event — DynamicIsland dispatches this
  useEffect(() => {
    const handler = () => trigger()
    window.addEventListener('nexus:mode-transition', handler)
    return () => window.removeEventListener('nexus:mode-transition', handler)
  }, [trigger])

  const isApexTarget = targetMode === 'apex'
  const floodColor = isApexTarget
    ? 'rgba(34,211,238,0.06)'
    : 'rgba(196,168,130,0.08)'
  const modeColor = isApexTarget
    ? 'var(--color-apex)'
    : 'var(--color-haven)'
  const modeName = isApexTarget ? 'Apex' : 'Haven'
  const subline = isApexTarget
    ? 'FOCUS MODE — COMMANDER ACTIVE'
    : 'REFLECTION MODE — POET ACTIVE'

  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          className="mode-transition-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: phase === 'exiting' ? 0 : 1 }}
          transition={{
            duration: phase === 'exiting' ? 0.08 : 0.08,
            ease: 'linear'
          }}
          aria-hidden="true"
        >
          {/* Radial flood */}
          <motion.div
            className="mode-transition-flood"
            style={{ background: floodColor }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 4, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Central identity moment */}
          <AnimatePresence>
            {(phase === 'identity' || phase === 'holding') && (
              <motion.div
                className="mode-transition-identity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.span
                  className="mode-transition-name"
                  style={{ color: modeColor }}
                >
                  {modeName}
                </motion.span>
                <motion.span
                  className="mode-transition-subline"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.15 }}
                >
                  {subline}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Particles */}
          {particles.map(particle => (
            <ModeParticle
              key={particle.id}
              particle={particle}
              targetMode={targetMode}
              modeColor={modeColor}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ModeParticle({
  particle,
  targetMode,
  modeColor,
}: {
  particle: Particle
  targetMode: Mode
  modeColor: string
}) {
  const isApex = targetMode === 'apex'

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: `${particle.x}vw`,
        top: `${particle.y}vh`,
        width: isApex ? '1px' : '2px',
        height: isApex ? '32px' : '2px',
        background: modeColor,
        borderRadius: isApex ? '0' : '50%',
        opacity: 0,
      }}
      animate={{
        opacity: [0, 0.35, 0],
        y: isApex ? [-20, -60] : [0, 40],
      }}
      transition={{
        duration: isApex ? 0.4 : 0.6,
        delay: particle.delay / 1000,
        ease: isApex ? [0.4, 0, 0.2, 1] : [0.16, 1, 0.3, 1],
      }}
    />
  )
}
