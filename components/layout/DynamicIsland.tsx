'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTimeMode } from '@/hooks/useTimeMode'
import { OdometerNumber } from '@/components/ui/OdometerNumber'
import { useStats } from '@/hooks/useStats'
import type { IslandEvent } from '@/lib/islandEvents'
import type { Mode } from '@/types/mode'

type IslandState = 'collapsed' | 'default' | 'expanded'

interface DynamicIslandProps {
  userId: string
  preferredMode?: 'auto' | 'apex' | 'haven'
  streak?: number
}

export function DynamicIsland({ 
  preferredMode = 'auto',
  streak: initialStreak = 0 
}: DynamicIslandProps): React.JSX.Element {
  const [islandState, setIslandState] = useState<IslandState>('collapsed')
  const [currentEvent, setCurrentEvent] = useState<IslandEvent | null>(null)
  
  const { data: stats } = useStats()
  const { mode, timeRemaining } = useTimeMode(preferredMode)
  
  const currentStreak = stats?.current_streak ?? initialStreak

  // Island initialization sequence
  useEffect((): (() => void) => {
    const timer = setTimeout(() => setIslandState('default'), 2000)
    return (): void => clearTimeout(timer)
  }, [])

  // System event listener
  useEffect((): (() => void) => {
    const handleIslandEvent = (e: Event): void => {
      const customEvent = e as CustomEvent<IslandEvent>
      setCurrentEvent(customEvent.detail)
      setIslandState('expanded')
      
      setTimeout(() => {
        setIslandState('default')
        setCurrentEvent(null)
      }, 4000)
      
      // Cleanup for this specific event trigger is not possible via return in event listener
      // but we add : void to satisfy lint
    }
    
    window.addEventListener('nexus:island-event', handleIslandEvent)
    return (): void => window.removeEventListener('nexus:island-event', handleIslandEvent)
  }, [])

  const handleIslandClick = useCallback((): void => {
    window.dispatchEvent(new CustomEvent('nexus:mode-transition'))
  }, [])

  const layoutTransition = {
    type: 'spring' as const,
    stiffness: islandState === 'expanded' ? 600 : islandState === 'default' ? 500 : 400,
    damping: islandState === 'expanded' ? 38 : islandState === 'default' ? 42 : 40,
    mass: islandState === 'expanded' ? 0.8 : 0.9,
  }

  return (
    <div className="dynamic-island-anchor">
      <motion.div
        layout="size"
        className={`dynamic-island dynamic-island--${islandState}`}
        transition={layoutTransition}
        onClick={handleIslandClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{ cursor: 'pointer' }}
      >
        <AnimatePresence mode="wait">
          {islandState === 'collapsed' && (
            <motion.div
              key="collapsed"
              className="island-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <ModeDot mode={mode} />
              <span className="island-mode-label">{mode.toUpperCase()}</span>
            </motion.div>
          )}

          {(islandState === 'default' || islandState === 'expanded') && (
            <motion.div
              key="default-row"
              className="island-default-row"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <ModeCluster mode={mode} />
              <IslandDivider />
              <StreakCluster streak={currentStreak} />
              <IslandDivider />
              <TimeCluster timeRemaining={timeRemaining} />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {islandState === 'expanded' && currentEvent && (
            <motion.div
              key="event-row"
              className="island-event-row"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <EventIcon type={currentEvent.icon} />
              <span className="island-event-text">{currentEvent.text}</span>
              <EventCountdown duration={4000} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ─── Internal Sub-components ─────────────────────────── */

function ModeDot({ mode }: { mode: Mode }): React.JSX.Element {
  const color = mode === 'apex' ? 'var(--color-apex)' : 'var(--color-haven)'
  return (
    <div
      style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}`,
      }}
    />
  )
}

function ModeCluster({ mode }: { mode: Mode }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <ModeDot mode={mode} />
      <span className="island-mode-label" style={{ 
        color: mode === 'apex' ? 'var(--color-apex)' : 'var(--color-haven)' 
      }}>
        {mode.toUpperCase()}
      </span>
    </div>
  )
}

function IslandDivider(): React.JSX.Element {
  return <div className="island-divider" />
}

function StreakCluster({ streak }: { streak: number }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-signal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>
      <OdometerNumber value={streak} className="text-[13px] font-mono text-signal" />
      <span className="island-streak-label">DAY STREAK</span>
    </div>
  )
}

function TimeCluster({ timeRemaining }: { timeRemaining: string }): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-disabled)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <span className="island-time">{timeRemaining}</span>
    </div>
  )
}

function EventIcon({ type }: { type: IslandEvent['icon'] }): React.JSX.Element {
  return (
    <div className="text-signal">
      {type === 'journal' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
      )}
      {type === 'gym' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6.5 6.5 11 11"/><path d="m11.8 11.8 5.7-5.7"/><path d="m6.5 17.5 5.7-5.7"/><path d="m7.3 13 4.5-4.5"/><path d="m12.2 17.9 4.5-4.5"/><path d="M11 2h2"/><path d="M11 22h2"/><path d="M2 11v2"/><path d="M22 11v2"/></svg>
      )}
      {type === 'duel' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 17.5 3 5V3h2l12.5 11.5"/><path d="M13 19l6-6"/><path d="M16 22l5-5"/><path d="m3 21 18-18"/><path d="m21 21-18-18"/></svg>
      )}
      {type === 'oracle' && (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
      )}
    </div>
  )
}

function EventCountdown({ duration }: { duration: number }): React.JSX.Element {
  return (
    <div className="island-countdown">
      <motion.div
        className="island-countdown__fill"
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
      />
    </div>
  )
}
