
import { withAuth, ok, badRequest }   from '@/lib/auth'
import {
  GymLogCreateSchema,
  GymQuerySchema,
  parseRequest,
}                                     from '@/types/api'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { groq, GROQ_MODEL_FAST, MAX_TOKENS } from '@/lib/groq'
import { GYM_DELTA_SYSTEM }           from '@/lib/personas'

// ─── GET /api/gym ─────────────────────────────────────────────────────────────

export const GET = withAuth(async (req: Request, { userId }) => {
  const { searchParams } = new URL(req.url)

  const parsed = parseRequest(GymQuerySchema, {
    limit:    searchParams.get('limit'),
    exercise: searchParams.get('exercise') ?? undefined,
  })
  if (!parsed.success) return badRequest(parsed.error)

  const { limit, exercise } = parsed.data
  const supabase = await createServerSupabaseClient()

  let query = supabase
    .from('gym_logs')
    .select('id, exercise, sets, reps, weight, unit, notes, volume_delta, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (exercise) {
    query = query.ilike('exercise', `%${exercise}%`)
  }

  const { data, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return ok({ logs: data ?? [], count: data?.length ?? 0 })
})

// ─── POST /api/gym ────────────────────────────────────────────────────────────

export const POST = withAuth(async (req: Request, { userId }) => {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequest('Invalid JSON body')
  }

  const parsed = parseRequest(GymLogCreateSchema, body)
  if (!parsed.success) return badRequest(parsed.error)

  const { exercise, sets, reps, weight, unit, notes } = parsed.data
  const supabase = await createServerSupabaseClient()

  // ─── Calculate volume for this entry ──────────────────────────────────────
  const currentVolume = sets * reps * (weight ?? 1)

  // ─── Fetch previous session for this exercise ─────────────────────────────
  const { data: previousLogsRaw } = await supabase
    .from('gym_logs')
    .select('sets, reps, weight, unit, created_at')
    .eq('user_id', userId)
    .ilike('exercise', exercise)
    .order('created_at', { ascending: false })
    .limit(10)

  const previousLogs = previousLogsRaw as any[]

  // Calculate previous session volume
  // Group by day — find last distinct session date
  let previousVolume: number | null = null

  if (previousLogs && previousLogs.length > 0) {
    const lastDate = previousLogs[0]?.created_at
      ? new Date(previousLogs[0].created_at).toDateString()
      : null

    if (lastDate) {
      const lastSessionLogs = previousLogs.filter(
        log => new Date(log.created_at).toDateString() === lastDate
      )
      previousVolume = lastSessionLogs.reduce(
        (sum, log) => sum + (log.sets * log.reps * (log.weight ?? 1)),
        0
      )
    }
  }

  // ─── Volume delta ─────────────────────────────────────────────────────────
  const volumeDelta = previousVolume !== null
    ? currentVolume - previousVolume
    : null

  // ─── Generate AI volume delta insight ─────────────────────────────────────
  let aiDeltaInsight: string | null = null

  try {
    const contextLines = [
      `Exercise: ${exercise}`,
      `This set: ${sets} sets × ${reps} reps${weight ? ` @ ${weight}${unit}` : ''}`,
      `Current session volume: ${currentVolume}${unit}`,
    ]

    if (previousVolume !== null) {
      const delta = volumeDelta!
      const sign  = delta >= 0 ? '+' : ''
      const pct   = previousVolume > 0
        ? ` (${sign}${((delta / previousVolume) * 100).toFixed(1)}%)`
        : ''
      contextLines.push(
        `Previous session volume: ${previousVolume}${unit}`,
        `Volume delta: ${sign}${delta}${unit}${pct}`
      )
    } else {
      contextLines.push('First time logging this exercise — baseline being set')
    }

    const completion = await groq.chat.completions.create({
      model:       GROQ_MODEL_FAST,
      stream:      false,
      max_tokens:  MAX_TOKENS.GYM_DELTA,
      temperature: 0.4,
      messages: [
        { role: 'system', content: GYM_DELTA_SYSTEM },
        { role: 'user',   content: contextLines.join('\n') },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim() ?? ''
    aiDeltaInsight = raw.replace(/[.!?,;:]+$/, '').trim() || null
  } catch {
    aiDeltaInsight = null
  }

  // ─── Insert gym log ───────────────────────────────────────────────────────

  const payload: any = {
      user_id:      userId,
      exercise,
      sets,
      reps,
      weight:       weight ?? null,
      unit,
      notes:        notes ?? null,
      volume_delta: volumeDelta,
    }

  const { data: log, error } = await supabase
    .from('gym_logs')
    .insert(payload)
    .select('id, exercise, sets, reps, weight, unit, notes, volume_delta, created_at')
    .single()

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message, code: 'DB_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // ─── Fire and forget side effects ─────────────────────────────────────────

  supabase.rpc('increment_gym_stat', { p_user_id: userId } as any)
    .then(() => {/* silent */})

  supabase.rpc('recalculate_streak', { p_user_id: userId } as any)
    .then(() => {/* silent */})

  supabase.rpc('increment_cognitive_xp', { p_user_id: userId, p_xp: 15 } as any)
    .then(() => {/* silent */})

  return ok({
    log,
    ai_insight:      aiDeltaInsight,
    volume_delta:    volumeDelta,
    current_volume:  currentVolume,
    previous_volume: previousVolume,
  }, 201)
})
