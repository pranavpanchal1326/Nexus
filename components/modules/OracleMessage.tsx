'use client'
import { motion } from 'framer-motion'
import { ModeIndicator } from '@/components/ui'
import { WordByWordText } from './WordByWordText'
import type { ConversationMessage } from './OracleChat'

interface OracleMessageProps {
  message: ConversationMessage
  animate: boolean
}

export function OracleMessage({ message, animate }: OracleMessageProps) {
  if (message.role === 'user') {
    return <OracleUserMessage message={message} animate={animate} />
  }
  return <OracleAssistantMessage message={message} animate={animate} />
}

// ─── User message ─────────────────────────────────────────────────────────────

function OracleUserMessage({
  message,
  animate,
}: {
  message: ConversationMessage
  animate: boolean
}) {
  return (
    <motion.div
      className="oracle-user-message"
      initial={animate ? { opacity: 0, y: 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Mode indicator — small, unobtrusive */}
      <ModeIndicator mode={message.mode} size="sm" />

      {/* Message text */}
      <p className="oracle-user-message__text">
        {message.content}
      </p>
    </motion.div>
  )
}

// ─── Assistant message ────────────────────────────────────────────────────────

function OracleAssistantMessage({
  message,
  animate,
}: {
  message: ConversationMessage
  animate: boolean
}) {
  return (
    <motion.div
      className={`oracle-response oracle-response--${message.persona}`}
      initial={animate ? { opacity: 0 } : false}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <WordByWordText
        text={message.content}
        mode={message.mode}
        isStreaming={false}
        animate={animate}
      />
    </motion.div>
  )
}
