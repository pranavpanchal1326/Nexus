'use client'
import { useCallback, useRef } from 'react'
import { useNexusStore } from '@/store/nexusStore'
import { playSound } from '@/lib/audio'
import { consumeStream } from '@/lib/stream'
import type { ChatRequest, AmbientRequest } from '@/types/api'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UseGroqOptions {
  /** Called with each streamed text chunk */
  onChunk?:    (chunk: string) => void
  /** Called when stream completes */
  onComplete?: (fullText: string) => void
  /** Called on error */
  onError?:    (error: string) => void
}

interface GroqStreamResult {
  /** Start a streaming chat request */
  streamChat: (params: ChatRequest) => Promise<void>
  /** Get ambient insight — non-streaming, short */
  getAmbient: (params: AmbientRequest) => Promise<string | null>
  /** Whether a request is in flight */
  isLoading:  boolean
  /** Abort current stream */
  abort:      () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useGroq(options: UseGroqOptions = {}): GroqStreamResult {
  const signalStart  = useNexusStore(state => state.signalStart)
  const signalStop   = useNexusStore(state => state.signalStop)
  const isLoadingRef = useRef(false)
  const abortRef     = useRef<AbortController | null>(null)

  // ─── Stream chat ───────────────────────────────────────────────────────────

  const streamChat = useCallback(async (params: ChatRequest) => {
    if (isLoadingRef.current) return

    isLoadingRef.current = true
    abortRef.current     = new AbortController()
    
    let signalWasStarted = false
    signalStart()
    signalWasStarted = true

    try {
      const res = await fetch('/api/chat', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(params),
        signal:      abortRef.current.signal,
        credentials: 'include',
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed' }))
        options.onError?.(errorData.error ?? `HTTP ${res.status}`)
        return
      }

      let wordCount = 0

      await consumeStream(
        res,
        {
          onChunk: (chunk) => {
            // Play word-appear sound every ~3 words — textural accumulation
            const newWords = chunk.split(/\s+/).filter(Boolean).length
            wordCount += newWords
            if (wordCount >= 3) {
              playSound('word-appear')
              wordCount = 0
            }
            options.onChunk?.(chunk)
          },
          onComplete: (fullText) => {
            options.onComplete?.(fullText)
          },
          onError: (error) => {
            options.onError?.(error)
          },
          onAbort: () => {
            // Silent — user intentionally cancelled
          },
        },
        abortRef.current.signal
      )

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      const message = err instanceof Error ? err.message : 'Unknown error'
      options.onError?.(message)
    } finally {
      isLoadingRef.current = false
      if (signalWasStarted) {
        signalStop()
      }
    }
  }, [signalStart, signalStop, options])

  // ─── Ambient insight — non-streaming ──────────────────────────────────────

  const getAmbient = useCallback(async (
    params: AmbientRequest
  ): Promise<string | null> => {
    signalStart()

    try {
      const res = await fetch('/api/chat/ambient', {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        JSON.stringify(params),
        credentials: 'include',
      })

      if (!res.ok) return null

      const data = await res.json()
      return (data.insight as string) ?? null

    } catch {
      return null
    } finally {
      signalStop()
    }
  }, [signalStart, signalStop])

  // ─── Abort ────────────────────────────────────────────────────────────────

  const abort = useCallback(() => {
    abortRef.current?.abort()
    isLoadingRef.current = false
    signalStop()
  }, [signalStop])

  return {
    streamChat,
    getAmbient,
    isLoading: isLoadingRef.current,
    abort,
  }
}
