'use client'
import { motion } from 'framer-motion'
import type { Mode } from '@/types/mode'

interface OracleThinkingProps {
  mode: Mode
}

export function OracleThinking({ mode }: OracleThinkingProps) {
  const isApex = mode === 'apex'

  return (
    <div className="oracle-thinking">
      {isApex ? (
        // Commander: three dots, precise, monospace cadence
        <div className="oracle-thinking__apex">
          {[0, 1, 2].map(i => (
            <motion.span
              key={i}
              className="oracle-thinking__dot"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{
                duration: 1.2,
                repeat:   Infinity,
                delay:    i * 0.2,
                ease:     'easeInOut',
              }}
            />
          ))}
        </div>
      ) : (
        // Poet: single breathing line — unhurried
        <motion.div
          className="oracle-thinking__haven"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{
            duration: 2.4,
            repeat:   Infinity,
            ease:     'easeInOut',
          }}
        >
          <span className="oracle-thinking__line" />
        </motion.div>
      )}
    </div>
  )
}
