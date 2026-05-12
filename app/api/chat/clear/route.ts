import { withAuth, ok } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ─── DELETE /api/chat/clear ───────────────────────────────────────────────────

export const DELETE = withAuth(async (_: Request, { userId }) => {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('user_id', userId)

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return ok({ cleared: true })
})
