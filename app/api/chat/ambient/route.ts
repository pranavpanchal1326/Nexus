import { groq, GROQ_MODEL_FAST, MAX_TOKENS, TEMPERATURE } from '@/lib/groq'
import {
  AMBIENT_SYSTEM,
  JOURNAL_INSIGHT_SYSTEM,
  GYM_DELTA_SYSTEM,
} from '@/lib/personas'
import { withAuth, ok, badRequest } from '@/lib/auth'
import { AmbientRequestSchema, parseRequest } from '@/types/api'

// ─── Surface-specific system prompt ──────────────────────────────────────────

function getAmbientSystem(surface: string): string {
  switch (surface) {
    case 'journal': return JOURNAL_INSIGHT_SYSTEM
    case 'gym':     return GYM_DELTA_SYSTEM
    default:        return AMBIENT_SYSTEM
  }
}

// ─── POST /api/chat/ambient ───────────────────────────────────────────────────

export const POST = withAuth(async (req: Request) => {
  // ─── 1. Validate request ───────────────────────────────────────────────────
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = parseRequest(AmbientRequestSchema, body)
  if (!parsed.success) return badRequest(parsed.error)

  const { surface, context, mode } = parsed.data

  // ─── 2. Select system prompt ───────────────────────────────────────────────
  const systemPrompt = getAmbientSystem(surface)

  // ─── 3. Call Groq — non-streaming, fast model ─────────────────────────────
  // Uses llama-3.1-8b-instant — TTFB target < 300ms.
  // Single sentence response — low token count — fast completion.
  let insight: string

  try {
    const completion = await groq.chat.completions.create({
      model:       GROQ_MODEL_FAST,
      stream:      false,
      max_tokens:  MAX_TOKENS.AMBIENT,
      temperature: TEMPERATURE.AMBIENT,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role:    'user',
          content: `Context:\n${context}\n\nMode: ${mode.toUpperCase()}`,
        },
      ],
    })

    insight = completion.choices[0]?.message?.content?.trim() ?? ''

    // ─── 4. Sanitize output ────────────────────────────────────────────────
    // If model returned multiple sentences, use only the first.
    if (insight.length > 0) {
      const firstSentenceMatch = insight.split(/(?<=[.?!])\s+/)[0]
      if (firstSentenceMatch && firstSentenceMatch.length < insight.length * 0.8) {
        insight = firstSentenceMatch
      }
    }

    // Strip trailing punctuation — ambient sentences trail into awareness.
    insight = insight.replace(/[.!?,;:]+$/, '').trim()

    // Word count guard — truncate to 12 words max if model exceeded limit.
    const words = insight.split(/\s+/).filter(Boolean)
    if (words.length > 12) {
      insight = words.slice(0, 12).join(' ')
    }

  } catch (ambientErr) {
    if (process.env.NODE_ENV === 'development') {
      const msg = ambientErr instanceof Error ? ambientErr.message : 'unknown'
      console.error('[NEXUS Ambient Error]', msg)
    }
    // Ambient failure is always silent — surfaces handle empty by showing nothing.
    return ok({ insight: '' })
  }

  // ─── 5. Return insight ─────────────────────────────────────────────────────
  return ok({ insight, surface, mode })
})
