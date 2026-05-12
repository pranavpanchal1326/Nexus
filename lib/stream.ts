'use client'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StreamCallbacks {
  onChunk:    (chunk: string, accumulated: string) => void
  onComplete: (fullText: string) => void
  onError:    (error: string, partial: string) => void
  onAbort?:   () => void
}

// ─── Stream consumer ──────────────────────────────────────────────────────────

/**
 * Consume a streaming text/plain response.
 *
 * Calls onChunk for each received chunk (with running accumulated text).
 * Calls onComplete when the stream finishes cleanly.
 * Calls onError when the stream contains a [STREAM_ERROR] marker or network fails.
 * Calls onAbort when the AbortSignal fires.
 *
 * Always releases the reader lock in the finally block.
 */
export async function consumeStream(
  response:  Response,
  callbacks: StreamCallbacks,
  signal?:   AbortSignal
): Promise<void> {
  if (!response.body) {
    callbacks.onError('No response body', '')
    return
  }

  const reader      = response.body.getReader()
  const decoder     = new TextDecoder()
  let   accumulated = ''

  try {
    while (true) {
      // Check abort signal before each read
      if (signal?.aborted) {
        callbacks.onAbort?.()
        await reader.cancel()
        return
      }

      const { done, value } = await reader.read()

      if (done) {
        callbacks.onComplete(accumulated)
        return
      }

      const chunk = decoder.decode(value, { stream: true })

      // Check for server-side stream error marker
      if (chunk.includes('[STREAM_ERROR]')) {
        const cleanChunk = chunk.replace('\n\n[STREAM_ERROR]', '')
        if (cleanChunk) {
          accumulated += cleanChunk
          callbacks.onChunk(cleanChunk, accumulated)
        }
        callbacks.onError('Stream error — partial response received', accumulated)
        return
      }

      accumulated += chunk
      callbacks.onChunk(chunk, accumulated)
    }
  } catch (readErr) {
    if (readErr instanceof Error && readErr.name === 'AbortError') {
      callbacks.onAbort?.()
      return
    }
    const message = readErr instanceof Error ? readErr.message : 'Stream read error'
    callbacks.onError(message, accumulated)
  } finally {
    // Always release reader lock — even on error or abort
    try { reader.releaseLock() } catch { /* already released */ }
  }
}

// ─── Word-by-word text tokenizer ─────────────────────────────────────────────

/**
 * Split streamed text into word tokens for word-by-word animation.
 * Preserves whitespace attached to words for natural rendering.
 * Round-trips: tokens.join('') === original input.
 */
export function tokenizeStreamedText(text: string): string[] {
  if (!text) return []

  // Split on whitespace boundaries, keeping the delimiters
  const parts = text.split(/(\s+)/)

  const result: string[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    if (/^\s+$/.test(part)) {
      // Prepend whitespace to the next word token for natural grouping
      const next = parts[i + 1]
      if (next) {
        result.push(part + next)
        i++ // skip the next part — already consumed
      }
      // Trailing whitespace with no following word — discard
    } else {
      result.push(part)
    }
  }

  return result
}

// ─── Stream state machine ─────────────────────────────────────────────────────

export type StreamState =
  | 'idle'
  | 'streaming'
  | 'complete'
  | 'error'
  | 'aborted'

export interface StreamStatus {
  state:       StreamState
  accumulated: string
  error?:      string
  wordCount:   number
  charCount:   number
}

export function createStreamStatus(): StreamStatus {
  return {
    state:       'idle',
    accumulated: '',
    wordCount:   0,
    charCount:   0,
  }
}

export function updateStreamStatus(
  prev:  StreamStatus,
  chunk: string
): StreamStatus {
  const accumulated = prev.accumulated + chunk
  return {
    state:       'streaming',
    accumulated,
    wordCount:   accumulated.split(/\s+/).filter(Boolean).length,
    charCount:   accumulated.length,
  }
}
