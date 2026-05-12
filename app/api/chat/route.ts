import { groq, GROQ_MODEL, MAX_TOKENS } from '@/lib/groq'
import {
  getPersonaSystem,
  getPersonaName,
  getPersonaTemperature,
} from '@/lib/personas'
import { withAuth, badRequest } from '@/lib/auth'
import { ChatRequestSchema, parseRequest } from '@/types/api'
import { createServiceRoleClient } from '@/lib/supabase/server'

// ─── POST /api/chat ───────────────────────────────────────────────────────────

export const POST = withAuth(async (req: Request, { userId }) => {
  // ─── 1. Parse + validate request body ─────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = parseRequest(ChatRequestSchema, body)
  if (!parsed.success) return badRequest(parsed.error)

  const { message, mode, history } = parsed.data

  // ─── 2. Resolve persona config ─────────────────────────────────────────────
  const systemPrompt = getPersonaSystem(mode)
  const personaName  = getPersonaName(mode)
  const temperature  = getPersonaTemperature(mode, 'oracle')
  const maxTokens    = mode === 'apex'
    ? MAX_TOKENS.ORACLE_APEX
    : MAX_TOKENS.ORACLE_HAVEN

  // ─── 3. Build messages array ───────────────────────────────────────────────
  // System prompt first, then validated history, then current message.
  // History is already validated: max 40 messages, each max 8000 chars.
  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(h => ({
      role:    h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user', content: message },
  ]

  // ─── 4. Persist user message to chat_history ──────────────────────────────
  // Write before the stream starts so we have a record even if Groq fails.
  // The trg_oracle_stat trigger auto-increments oracle_count on insert.
  const supabase = createServiceRoleClient()

  await supabase.from('chat_history').insert({
    user_id: userId,
    role:    'user',
    content: message,
    mode,
    persona: personaName,
    model:   GROQ_MODEL,
  } as any)

  // ─── 5. Create Groq stream ─────────────────────────────────────────────────
  let groqStream: AsyncIterable<{
    choices: { delta: { content?: string | null } }[]
  }>

  try {
    groqStream = await groq.chat.completions.create({
      model:       GROQ_MODEL,
      messages,
      stream:      true,
      max_tokens:  maxTokens,
      temperature,
    })
  } catch (groqErr) {
    const groqMsg = groqErr instanceof Error ? groqErr.message : 'Groq API error'
    return new Response(
      JSON.stringify({ error: groqMsg, code: 'GROQ_ERROR' }),
      {
        status:  503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // ─── 6. Build ReadableStream — true token-by-token streaming ──────────────
  let fullResponse = ''

  const readable = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      try {
        for await (const chunk of groqStream) {
          const delta = chunk.choices[0]?.delta?.content ?? ''

          if (delta) {
            fullResponse += delta
            // Enqueue immediately — no buffering
            controller.enqueue(encoder.encode(delta))
          }
        }
      } catch (streamErr) {
        // Mid-stream error — close gracefully, signal client
        if (process.env.NODE_ENV === 'development') {
          console.error('[NEXUS Stream Error]', streamErr)
        }
        controller.enqueue(encoder.encode('\n\n[STREAM_ERROR]'))
      } finally {
        controller.close()

        // ─── 7. Persist assistant response after stream completes ──────────
        // Fire and forget — never block the stream close.
        // Only persist if we got a meaningful response.
        if (fullResponse.trim().length > 0) {
          supabase.from('chat_history').insert({
            user_id: userId,
            role:    'assistant',
            content: fullResponse.trim(),
            mode,
            persona: personaName,
            model:   GROQ_MODEL,
          } as any).then(({ error }) => {
            if (error && process.env.NODE_ENV === 'development') {
              console.error('[NEXUS] Failed to persist assistant message:', error)
            }
          })

          // ─── 8. Recalculate streak after oracle interaction ────────────────
          supabase.rpc('recalculate_streak', { p_user_id: userId } as any)
            .then(() => {/* silent — streak update is best-effort */})
        }
      }
    },

    cancel() {
      // Client disconnected — Groq iterator exits on next iteration
      if (process.env.NODE_ENV === 'development') {
        console.info('[NEXUS] Stream cancelled by client')
      }
    },
  })

  // ─── 9. Return streaming response with correct headers ────────────────────
  return new Response(readable, {
    status:  200,
    headers: {
      'Content-Type':                'text/plain; charset=utf-8',
      'Cache-Control':               'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options':      'nosniff',
      'X-NEXUS-Persona':             personaName,
      'X-NEXUS-Mode':                mode,
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL ?? '*',
    },
  })
})

// ─── OPTIONS — CORS preflight ─────────────────────────────────────────────────

export async function OPTIONS() {
  return new Response(null, {
    status:  204,
    headers: {
      'Access-Control-Allow-Origin':  process.env.NEXT_PUBLIC_APP_URL ?? '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
