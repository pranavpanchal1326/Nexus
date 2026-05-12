'use client'
import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNexusStore }            from '@/store/nexusStore'
import { useGroq }                  from '@/hooks/useGroq'
import { useAudioEvents }           from '@/hooks/useAudio'
import { ModeIndicator }            from '@/components/ui'
import { OracleMessage }            from './OracleMessage'
import { OracleInput }              from './OracleInput'
import { OracleThinking }           from './OracleThinking'
import { dispatchIslandEvent }      from '@/lib/islandEvents'
import type { Mode }                from '@/types/mode'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ConversationMessage {
  id:       string
  role:     'user' | 'assistant'
  content:  string
  mode:     Mode
  persona:  'commander' | 'poet'
  isNew?:   boolean   // Animate in if true — history messages do not animate
}

interface OracleChatProps {
  initialHistory: {
    id:         string
    role:       'user' | 'assistant'
    content:    string
    mode:       Mode
    persona:    'commander' | 'poet'
    created_at: string
  }[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OracleChat({ initialHistory }: OracleChatProps) {
  const mode    = useNexusStore(state => state.mode)
  const persona = mode === 'apex' ? 'commander' : 'poet'

  // ─── Conversation state ───────────────────────────────────────────────────
  const [messages, setMessages] = useState<ConversationMessage[]>(
    initialHistory.map(h => ({
      id:      h.id,
      role:    h.role as 'user' | 'assistant',
      content: h.content,
      mode:    h.mode,
      persona: h.persona,
      isNew:   false,   // History — no entrance animation
    }))
  )

  const [streamingContent, setStreamingContent] = useState('')
  const [isStreaming,      setIsStreaming]       = useState(false)
  const [streamError,      setStreamError]       = useState<string | null>(null)

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const scrollRef      = useRef<HTMLDivElement>(null)
  const bottomRef      = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

  // ─── Audio ────────────────────────────────────────────────────────────────
  const { playOracleStart } = useAudioEvents()

  // ─── Groq streaming ───────────────────────────────────────────────────────
  const { streamChat, abort } = useGroq({
    onChunk: (chunk) => {
      setStreamingContent(prev => prev + chunk)
    },
    onComplete: (fullText) => {
      // Streaming complete — move from streaming buffer to messages array
      setIsStreaming(false)
      setStreamingContent('')

      const newMessage: ConversationMessage = {
        id:      crypto.randomUUID(),
        role:    'assistant',
        content: fullText.replace('\n\n[STREAM_ERROR]', '').trim(),
        mode,
        persona,
        isNew:   false,   // Already rendered during stream — no re-animation
      }

      setMessages(prev => [...prev, newMessage])

      // Notify island
      dispatchIslandEvent('oracle', `ORACLE — ${persona.toUpperCase()}`)
    },
    onError: (error) => {
      setIsStreaming(false)
      setStreamingContent('')
      setStreamError(error)

      // Clear error after 4s
      setTimeout(() => setStreamError(null), 4000)
    },
  })

  // ─── Submit handler ───────────────────────────────────────────────────────

  const handleSubmit = useCallback(async (input: string) => {
    const trimmed = input.trim()
    if (!trimmed || isStreaming) return

    // Play oracle start sound on first message of session
    if (messages.length === 0) playOracleStart()

    // Add user message immediately
    const userMessage: ConversationMessage = {
      id:      crypto.randomUUID(),
      role:    'user',
      content: trimmed,
      mode,
      persona,
      isNew:   true,
    }

    setMessages(prev => [...prev, userMessage])
    setIsStreaming(true)
    setStreamError(null)

    // Build history for API — exclude the message we just added
    const history = messages.map(m => ({
      role:    m.role,
      content: m.content,
    }))

    // Start streaming
    await streamChat({
      message: trimmed,
      mode,
      history,
    })
  }, [isStreaming, messages, mode, persona, streamChat, playOracleStart])

  // ─── Keyboard: Escape aborts stream ───────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: globalThis.KeyboardEvent) => {
      // Single tap Escape while streaming — abort
      // 2s hold Escape — Protocol ZERO (handled separately)
      if (e.key === 'Escape' && isStreaming) {
        abort()
        setIsStreaming(false)
        setStreamingContent('')
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isStreaming, abort])

  // ─── Auto-scroll to bottom on new content ────────────────────────────────

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, streamingContent])

  // ─── Focus input on mount ─────────────────────────────────────────────────

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // ─── Clear conversation ───────────────────────────────────────────────────

  const handleClear = useCallback(async () => {
    if (isStreaming) return
    await fetch('/api/chat/clear', { method: 'DELETE', credentials: 'include' })
    setMessages([])
    inputRef.current?.focus()
  }, [isStreaming])

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="oracle-chat">

      {/* ─── Header ─────────────────────────────────────────────────────── */}
      <OracleHeader
        mode={mode}
        messageCount={messages.length}
        onClear={handleClear}
        isStreaming={isStreaming}
      />

      {/* ─── Conversation document ───────────────────────────────────────── */}
      <div className="oracle-scroll" ref={scrollRef}>
        <div className="oracle-document">

          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            <OracleEmptyState mode={mode} />
          )}

          {/* Message pairs */}
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <OracleMessage
                key={message.id}
                message={message}
                animate={message.isNew ?? false}
              />
            ))}
          </AnimatePresence>

          {/* Active stream — renders below last message */}
          <AnimatePresence>
            {isStreaming && (
              <motion.div
                key="stream"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{    opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {streamingContent ? (
                  <OracleStreamingResponse
                    content={streamingContent}
                    mode={mode}
                  />
                ) : (
                  <OracleThinking mode={mode} />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state — static, no animation */}
          {streamError && (
            <div className="oracle-error">
              {streamError}
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={bottomRef} style={{ height: 1 }} />
        </div>
      </div>

      {/* ─── Input — fixed bottom ────────────────────────────────────────── */}
      <OracleInput
        ref={inputRef}
        onSubmit={handleSubmit}
        isStreaming={isStreaming}
        onAbort={abort}
        mode={mode}
      />
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OracleHeader({
  mode,
  messageCount,
  onClear,
  isStreaming,
}: {
  mode:         Mode
  messageCount: number
  onClear:      () => void
  isStreaming:  boolean
}) {
  return (
    <header className="oracle-header">
      <div className="oracle-header__left">
        <span className="oracle-header__title">Oracle</span>
        <ModeIndicator mode={mode} persona />
      </div>
      <div className="oracle-header__right">
        {messageCount > 0 && !isStreaming && (
          <button
            className="oracle-clear-btn"
            onClick={onClear}
            aria-label="Clear conversation"
          >
            CLEAR
          </button>
        )}
        {isStreaming && (
          <span className="oracle-streaming-indicator">
            <span className="oracle-streaming-dot" />
            RESPONDING
          </span>
        )}
      </div>
    </header>
  )
}

function OracleEmptyState({ mode }: { mode: Mode }) {
  const prompts = {
    apex: [
      'What is the most important thing I should focus on today?',
      'Analyze my last week. Where did I lose the most time?',
      'What is the obstacle I keep avoiding?',
    ],
    haven: [
      'What have I been carrying that I haven\'t named yet?',
      'What does the pattern in my journal entries tell you?',
      'What question should I be asking that I\'m not?',
    ],
  }

  return (
    <motion.div
      className="oracle-empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <span className="oracle-empty__label">
        {mode === 'apex' ? 'COMMANDER STANDING BY' : 'POET PRESENT'}
      </span>
      <span className="oracle-empty__subline">
        {mode === 'apex'
          ? 'Ask precisely. Receive precisely.'
          : 'There is no wrong question here.'}
      </span>
      <div className="oracle-empty__prompts">
        <span className="oracle-empty__prompts-label">START WITH</span>
        {prompts[mode].map((prompt, i) => (
          <span key={i} className="oracle-empty__prompt">
            {prompt}
          </span>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Streaming response — renders chunks as they arrive ───────────────────────

function OracleStreamingResponse({
  content,
  mode,
}: {
  content: string
  mode:    Mode
}) {
  return (
    <div className="oracle-response oracle-response--streaming">
      {/* Dynamic import word-by-word or use direct component */}
      <span className={mode === 'apex' ? 'text-commander' : 'text-oracle'}>
        {content}
      </span>
      {/* Cursor blink — shows AI is still generating */}
      <span className="oracle-cursor" aria-hidden="true" />
    </div>
  )
}
