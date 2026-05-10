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

export function ModeSpring({ ...props }: ModeSpringProps) {
  const mode = useNexusStore(state => state.mode)
  const { preset = 'none', ...rest } = props
  return mode === 'apex'
    ? <ApexSpring  {...rest} preset={preset === 'breathe' ? 'none' : preset} />
    : <HavenSpring {...rest} preset={preset} />
}

export function ModeButton(props: HTMLMotionProps<'button'> & { disabled?: boolean }) {
  const mode = useNexusStore(state => state.mode)
  return mode === 'apex'
    ? <ApexButton  {...props} />
    : <HavenButton {...props} />
}

export function ModeCard(props: HTMLMotionProps<'div'>) {
  const mode = useNexusStore(state => state.mode)
  return mode === 'apex'
    ? <ApexCard  {...props} />
    : <HavenCard {...props} />
}
