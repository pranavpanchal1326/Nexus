'use client'
import { type ReactNode, type ElementType } from 'react'
import { type HTMLMotionProps } from 'framer-motion'
import { ApexSpring, ApexButton, ApexCard } from './ApexSpring'
import { HavenSpring, HavenButton, HavenCard } from './HavenSpring'
import { useNexusStore } from '@/store/nexusStore'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ModeSpringProps extends HTMLMotionProps<'div'> {
  children:   ReactNode
  as?:        ElementType
  className?: string
  preset?:    'press' | 'hover' | 'reveal' | 'breathe' | 'none'
  disabled?:  boolean
}

// ─── Component — auto-selects physics based on mode ──────────────────────────

export function ModeSpring({ ...props }: ModeSpringProps): React.JSX.Element {
  const mode = useNexusStore(state => state.mode)
  const resolvedPreset = props.preset === 'breathe' ? 'none' : props.preset
  
  return mode === 'apex'
    ? <ApexSpring  {...props} preset={resolvedPreset as 'press' | 'hover' | 'reveal' | 'none'} />
    : <HavenSpring {...props} />
}

export function ModeButton(props: HTMLMotionProps<'button'> & { disabled?: boolean }): React.JSX.Element {
  const mode = useNexusStore(state => state.mode)
  return mode === 'apex'
    ? <ApexButton  {...props} />
    : <HavenButton {...props} />
}

export function ModeCard(props: HTMLMotionProps<'div'>): React.JSX.Element {
  const mode = useNexusStore(state => state.mode)
  return mode === 'apex'
    ? <ApexCard  {...props} />
    : <HavenCard {...props} />
}
