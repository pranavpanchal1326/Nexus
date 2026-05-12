import { withAuth, ok } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ─── GET /api/chat/history ────────────────────────────────────────────────────

export const GET = withAuth(async (req: Request, { userId }) => {
  const { searchParams } = new URL(req.url)
  const limit = Math.min(Number(searchParams.get('limit') ?? 40), 40)
  const mode  = searchParams.get('mode') as 'apex' | 'haven' | null

  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('chat_history')
    .select('id, role, content, mode, persona, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (mode) query = query.eq('mode', mode)

  const { data, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Return in chronological order — reversed from DB query (DESC → ASC)
  return ok({
    history: (data ?? []).reverse(),
    count:   data?.length ?? 0,
  })
})
