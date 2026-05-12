'use client'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { AI_WORD_VARIANTS } from '@/lib/motion'
import type { Mode } from '@/types/mode'

interface WordByWordTextProps {
  text:        string
  mode:        Mode
  isStreaming: boolean
  /** Animate words in — false for history messages */
  animate?:    boolean
}

export function WordByWordText({
  text,
  mode,
  isStreaming,
  animate = true,
}: WordByWordTextProps) {
  const isCommander = mode === 'apex'

  // Split text into word tokens — preserve whitespace
  const tokens = useMemo(() => {
    if (!text) return []
    // Split preserving spaces — each word gets its own span
    return text.split(/(\s+)/).filter(t => t.length > 0)
  }, [text])

  if (!animate || isStreaming) {
    // No word animation — render plain
    // History messages: no animation (expensive for long history)
    // Streaming: animation handled by chunk accumulation, not token split
    return (
      <span className={isCommander ? 'text-commander' : 'text-oracle'}>
        {text}
      </span>
    )
  }

  // Animate — word by word blur materialize
  return (
    <span
      className={isCommander ? 'text-commander' : 'text-oracle'}
      aria-label={text}   // Screen readers get full text at once
    >
      {tokens.map((token, i) => {
        // Whitespace tokens — render without animation
        if (/^\s+$/.test(token)) {
          return <span key={i} aria-hidden="true">{token}</span>
        }

        return (
          <motion.span
            key={`${i}-${token}`}
            aria-hidden="true"   // Aria label on parent covers full text
            variants={AI_WORD_VARIANTS}
            initial="hidden"
            animate="visible"
            transition={{
              duration: 0.12,
              ease:     'easeOut',
              delay:    i * 0.04,   // 40ms stagger — not 120ms — 120ms is per word too slow at scale
            }}
            style={{ display: 'inline' }}
          >
            {token}
          </motion.span>
        )
      })}
    </span>
  )
}
