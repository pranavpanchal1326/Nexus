// Removed NextRequest import
import { withAuth, ok, badRequest }      from '@/lib/auth'
import {
  JournalCreateSchema,
  JournalQuerySchema,
  parseRequest,
}                                        from '@/types/api'
import { createServerSupabaseClient }    from '@/lib/supabase/server'
import { groq, GROQ_MODEL_FAST, MAX_TOKENS } from '@/lib/groq'
import { JOURNAL_INSIGHT_SYSTEM }        from '@/lib/personas'

// ─── GET /api/journal ─────────────────────────────────────────────────────────

export const GET = withAuth(async (req: Request, { userId }) => {
  const { searchParams } = new URL(req.url)

  const parsed = parseRequest(JournalQuerySchema, {
    limit:  searchParams.get('limit'),
    offset: searchParams.get('offset'),
    mode:   searchParams.get('mode') ?? undefined,
  })
  if (!parsed.success) return badRequest(parsed.error)

  const { limit, offset, mode } = parsed.data
  const supabase = (await createServerSupabaseClient()) as any

  let query = supabase
    .from('journals')
    .select('id, content, mode, word_count, ai_insight, created_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (mode) query = query.eq('mode', mode)

  const { data, error, count } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return ok({
    entries: data ?? [],
    total:   count ?? 0,
    offset,
    limit,
  })
})

// ─── POST /api/journal ────────────────────────────────────────────────────────

export const POST = withAuth(async (req: Request, { userId }) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = parseRequest(JournalCreateSchema, body)
  if (!parsed.success) return badRequest(parsed.error)

  const { content, mode } = parsed.data
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length

  const supabase = (await createServerSupabaseClient()) as any

  // ─── Generate AI insight asynchronously ───────────────────────────────────
  // Generate insight in parallel with DB write — don't block the response
  let aiInsight: string | null = null

  try {
    const completion = await groq.chat.completions.create({
      model:       GROQ_MODEL_FAST,
      stream:      false,
      max_tokens:  MAX_TOKENS.JOURNAL_INSIGHT,
      temperature: 0.65,
      messages: [
        { role: 'system', content: JOURNAL_INSIGHT_SYSTEM },
        {
          role:    'user',
          content: [
            `Mode: ${mode.toUpperCase()}`,
            `Word count: ${wordCount}`,
            `Entry:\n${content.slice(0, 1000)}`,
          ].join('\n'),
        },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    // Strip trailing punctuation — ambient trails into awareness
    aiInsight = raw.replace(/[.!?,;:]+$/, '').trim() || null
  } catch {
    // AI insight failure never blocks journal save
    aiInsight = null
  }

  // ─── Insert journal entry ─────────────────────────────────────────────────

  const { data: entry, error } = await supabase
    .from('journals')
    .insert({
      user_id:    userId,
      content,
      mode,
      word_count: wordCount,
      ai_insight: aiInsight,
    })
    .select('id, content, mode, word_count, ai_insight, created_at')
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ─── Update daily stats ───────────────────────────────────────────────────
  // Fire and forget — does not block response
  supabase.rpc('increment_journal_stat_rpc', { p_user_id: userId })
    .then(() => {/* silent */})

  // ─── Recalculate streak ───────────────────────────────────────────────────
  supabase.rpc('recalculate_streak', { p_user_id: userId })
    .then(() => {/* silent */})

  // ─── Update cognitive XP ──────────────────────────────────────────────────
  const xpGained = Math.min(Math.floor(wordCount / 10), 50)   // 1 XP per 10 words, max 50

  // Simpler XP increment
  supabase.rpc('increment_cognitive_xp', { p_user_id: userId, p_xp: xpGained })
    .then(() => {/* silent */})
    .catch(() => {/* silent */})

  return ok({ entry }, 201)
})
