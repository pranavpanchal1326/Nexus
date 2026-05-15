import { withAuth, ok, badRequest }   from '@/lib/auth'
import {
  LexiconEvaluateSchema,
  LexiconJudgeResponseSchema,
  parseRequest,
}                                     from '@/types/api'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { groq, GROQ_MODEL, MAX_TOKENS } from '@/lib/groq'
import { LEXICON_JUDGE_SYSTEM, getPersonaTemperature } from '@/lib/personas'

// ─── POST /api/lexicon/evaluate ───────────────────────────────────────────────

export const POST = withAuth(async (req: Request, { userId }) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = parseRequest(LexiconEvaluateSchema, body)
  if (!parsed.success) return badRequest(parsed.error)

  const { word, sentence, mode } = parsed.data
  const supabase = await createServerSupabaseClient()

  // ─── Verify word exists in user's lexicon ─────────────────────────────────
  const { data: wordEntryRaw, error: wordError } = await supabase
    .from('word_lexicon')
    .select('id, word, definition, cognitive_xp, usage_count')
    .eq('user_id', userId)
    .ilike('word', word)
    .single()

  const wordEntry = wordEntryRaw as any

  if (wordError || !wordEntry) {
    return new Response(
      JSON.stringify({ error: 'Word not found in lexicon', code: 'WORD_NOT_FOUND' }),
      { status: 404, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ─── Call Groq — Judge evaluation ─────────────────────────────────────────
  // Temperature 0.2 — Judge must be consistent, not creative
  let judgement: {
    verdict:    'correct' | 'incorrect' | 'partial'
    score:      number
    reasoning:  string
    xp_awarded: 0 | 50 | 100 | 150
  }

  try {
    const completion = await groq.chat.completions.create({
      model:       GROQ_MODEL,
      stream:      false,
      max_tokens:  MAX_TOKENS.LEXICON_EVAL,
      temperature: getPersonaTemperature(mode, 'lexicon'),
      messages: [
        { role: 'system', content: LEXICON_JUDGE_SYSTEM },
        {
          role:    'user',
          content: [
            `Word: "${word}"`,
            `Definition: ${wordEntry.definition}`,
            `User's sentence: "${sentence}"`,
          ].join('\n'),
        },
      ],
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? '{}'

    // Parse and validate judge response
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      throw new Error('Judge returned invalid JSON')
    }

    const validated = LexiconJudgeResponseSchema.safeParse(parsed)
    if (!validated.success) {
      throw new Error('Judge response failed schema validation')
    }

    judgement = validated.data

  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[NEXUS Lexicon Judge Error]', err)
    }
    // Fallback judgement — never leave user hanging
    judgement = {
      verdict:    'partial',
      score:      50,
      reasoning:  'Judge unavailable — awarded partial credit',
      xp_awarded: 50,
    }
  }

  // ─── Update word stats ────────────────────────────────────────────────────
  const updatePayload: any = {
    usage_count:  wordEntry.usage_count + 1,
    cognitive_xp: wordEntry.cognitive_xp + judgement.xp_awarded,
    last_used_at: new Date().toISOString(),
  }

  await supabase
    .from('word_lexicon')
    .update(updatePayload as never)
    .eq('id', wordEntry.id)

  // ─── Update profile XP and duel stats ────────────────────────────────────

  supabase.rpc('increment_duel_stat', {
    p_user_id: userId,
    p_xp:      judgement.xp_awarded,
  } as any).then(() => {/* silent */})

  supabase.rpc('increment_cognitive_xp', {
    p_user_id: userId,
    p_xp:      judgement.xp_awarded,
  } as any).then(() => {/* silent */})

  supabase.rpc('recalculate_streak', { p_user_id: userId } as any)
    .then(() => {/* silent */})

  // ─── Return evaluation ────────────────────────────────────────────────────

  return ok({
    ...judgement,
    word,
    sentence,
    mode,
    word_id:          wordEntry.id,
    total_word_xp:    wordEntry.cognitive_xp + judgement.xp_awarded,
    total_usage_count: wordEntry.usage_count + 1,
  })
})
