'use client'
import {
  forwardRef,
  useState,
  useCallback,
  type KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SPRING }                   from '@/lib/motion'
import type { Mode }                from '@/types/mode'

interface OracleInputProps {
  onSubmit:   (value: string) => void
  isStreaming: boolean
  onAbort:    () => void
  mode:       Mode
}

export const OracleInput = forwardRef<HTMLTextAreaElement, OracleInputProps>(
  function OracleInput({ onSubmit, isStreaming, onAbort, mode }, ref) {
    const [value,    setValue]    = useState('')
    const [isFocused, setIsFocused] = useState(false)

    const isApex = mode === 'apex'

    const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        if (value.trim() && !isStreaming) {
          onSubmit(value)
          setValue('')
        }
      }
    }, [value, isStreaming, onSubmit])

    const handleSubmitClick = useCallback(() => {
      if (value.trim() && !isStreaming) {
        onSubmit(value)
        setValue('')
      }
    }, [value, isStreaming, onSubmit])

    const placeholder = isApex
      ? 'Ask precisely.'
      : 'What is on your mind.'

    return (
      <div className={`oracle-input-zone ${isFocused ? 'oracle-input-zone--focused' : ''}`}>
        <div className="oracle-input-inner">

          {/* Caret indicator */}
          <span className="oracle-input-caret" aria-hidden="true">▸</span>

          {/* Textarea — grows with content */}
          <textarea
            ref={ref}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={isStreaming}
            className="oracle-input-field"
            rows={1}
            aria-label="Message Oracle"
            style={{
              // Auto-height via CSS — grows up to 6 lines
              height: 'auto',
              minHeight: '24px',
            }}
          />

          {/* Action button — Send or Abort */}
          <AnimatePresence mode="wait">
            {isStreaming ? (
              <motion.button
                key="abort"
                className="oracle-action-btn oracle-action-btn--abort"
                onClick={onAbort}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{    opacity: 0, scale: 0.9 }}
                transition={SPRING.SNAP}
                aria-label="Stop generating"
              >
                STOP
              </motion.button>
            ) : (
              <motion.button
                key="send"
                className={`oracle-action-btn oracle-action-btn--send ${!value.trim() ? 'oracle-action-btn--disabled' : ''}`}
                onClick={handleSubmitClick}
                disabled={!value.trim()}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{    opacity: 0, scale: 0.9 }}
                transition={SPRING.SNAP}
                aria-label="Send message"
              >
                SEND
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Keyboard hint */}
        <div className="oracle-input-hint">
          <span>↵ to send</span>
          <span>⇧↵ for newline</span>
          {isStreaming && <span>ESC to stop</span>}
        </div>
      </div>
    )
  }
)

OracleInput.displayName = 'OracleInput'
