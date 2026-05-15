import { withAuth, ok, badRequest } from '@/lib/auth'
import {
  LexiconWordCreateSchema,
  LexiconQuerySchema,
  parseRequest,
}                                     from '@/types/api'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ─── GET /api/lexicon/words ───────────────────────────────────────────────────

export const GET = withAuth(async (req: Request, { userId }) => {
  const { searchParams } = new URL(req.url)

  const parsed = parseRequest(LexiconQuerySchema, {
    limit:  searchParams.get('limit'),
    offset: searchParams.get('offset'),
  })
  if (!parsed.success) return badRequest(parsed.error)

  const { limit, offset } = parsed.data
  const supabase = await createServerSupabaseClient()

  const { data, error, count } = await supabase
    .from('word_lexicon')
    .select('id, word, definition, usage_example, cognitive_xp, usage_count, last_used_at, created_at', {
      count: 'exact',
    })
    .eq('user_id', userId)
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return ok({
    words:  data ?? [],
    total:  count ?? 0,
    offset,
    limit,
  })
})

// ─── POST /api/lexicon/words ──────────────────────────────────────────────────

export const POST = withAuth(async (req: Request, { userId }) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = parseRequest(LexiconWordCreateSchema, body)
  if (!parsed.success) return badRequest(parsed.error)

  const { word, definition, usage_example } = parsed.data
  const supabase = await createServerSupabaseClient()

  // ─── Check for duplicate ──────────────────────────────────────────────────
  const { data: existing } = await supabase
    .from('word_lexicon')
    .select('id')
    .eq('user_id', userId)
    .ilike('word', word)
    .single()

  if (existing) {
    return new Response(
      JSON.stringify({ error: 'Word already in lexicon', code: 'DUPLICATE_WORD' }),
      { status: 409, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ─── Insert word ──────────────────────────────────────────────────────────

  const insertPayload: any = {
    user_id:       userId,
    word:          word.toLowerCase().trim(),
    definition:    definition.trim(),
    usage_example: usage_example?.trim() ?? null,
  }

  const { data: newWord, error } = await supabase
    .from('word_lexicon')
    .insert(insertPayload)
    .select('id, word, definition, usage_example, cognitive_xp, usage_count, last_used_at, created_at')
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return ok({ word: newWord }, 201)
})
