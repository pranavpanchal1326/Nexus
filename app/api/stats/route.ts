import { type NextRequest } from 'next/server'
import { withAuth, ok } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  activityToIntensity,
  generateDateRange,
  truncatePreview,
} from '@/lib/statsHelpers'

export const GET = withAuth(async (_req: NextRequest, { userId }) => {
  const supabase = await createServerSupabaseClient()
  const cutoffDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
  const cutoffIso = cutoffDate.toISOString().split('T')[0] ?? ''

  const [
    profileResult,
    dailyStatsResult,
    recentJournalResult,
    recentGymResult,
    recentDuelResult,
    recentOracleResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('current_streak, longest_streak, cognitive_xp, preferred_mode')
      .eq('id', userId)
      .single(),
    supabase
      .from('daily_stats')
      .select('date, journal_count, gym_count, duel_count, oracle_count, xp_earned')
      .eq('user_id', userId)
      .gte('date', cutoffIso)
      .order('date', { ascending: true }),
    supabase
      .from('journals')
      .select('content, mode, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('gym_logs')
      .select('exercise, sets, reps, weight, unit, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('word_lexicon')
      .select('word, cognitive_xp, last_used_at')
      .eq('user_id', userId)
      .not('last_used_at', 'is', null)
      .order('last_used_at', { ascending: false })
      .limit(5),
    supabase
      .from('chat_history')
      .select('content, role, mode, created_at')
      .eq('user_id', userId)
      .eq('role', 'user')
      .order('created_at', { ascending: false })
      .limit(3),
  ])

  const errors = [
    profileResult.error,
    dailyStatsResult.error,
    recentJournalResult.error,
    recentGymResult.error,
    recentDuelResult.error,
    recentOracleResult.error,
  ].filter(Boolean)

  if (errors.length > 0) {
    throw new Error('Stats query failed')
  }

  const profile = profileResult.data
  const dailyStats = dailyStatsResult.data ?? []

  const journalCount = dailyStats.reduce((s, d) => s + (d.journal_count ?? 0), 0)
  const gymCount = dailyStats.reduce((s, d) => s + (d.gym_count ?? 0), 0)
  const duelCount = dailyStats.reduce((s, d) => s + (d.duel_count ?? 0), 0)
  const oracleCount = dailyStats.reduce((s, d) => s + (d.oracle_count ?? 0), 0)

  const heatmapMap = new Map<string, number>()
  dailyStats.forEach(day => {
    const intensity = activityToIntensity(
      day.journal_count ?? 0,
      day.gym_count ?? 0,
      day.duel_count ?? 0,
      day.oracle_count ?? 0
    )
    heatmapMap.set(day.date, intensity)
  })

  const heatmap = generateDateRange(365).map(date => ({
    date,
    count: heatmapMap.get(date) ?? 0,
  }))

  type ActivityItem = {
    type: 'journal' | 'gym' | 'duel' | 'oracle'
    preview: string
    created_at: string
  }

  const recentActivity: ActivityItem[] = []

  ;(recentJournalResult.data ?? []).forEach(j => {
    recentActivity.push({
      type: 'journal',
      preview: truncatePreview(j.content ?? ''),
      created_at: j.created_at,
    })
  })

  ;(recentGymResult.data ?? []).forEach(g => {
    const weightPart = g.weight !== null ? ` @ ${g.weight}${g.unit}` : ''
    recentActivity.push({
      type: 'gym',
      preview: `${g.exercise} - ${g.sets}x${g.reps}${weightPart}`,
      created_at: g.created_at,
    })
  })

  ;(recentDuelResult.data ?? []).forEach(d => {
    if (!d.last_used_at) return
    recentActivity.push({
      type: 'duel',
      preview: `${d.word} - ${d.cognitive_xp} XP`,
      created_at: d.last_used_at,
    })
  })

  ;(recentOracleResult.data ?? []).forEach(o => {
    recentActivity.push({
      type: 'oracle',
      preview: truncatePreview(o.content ?? ''),
      created_at: o.created_at,
    })
  })

  recentActivity.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return ok({
    current_streak: profile?.current_streak ?? 0,
    longest_streak: profile?.longest_streak ?? 0,
    cognitive_xp: profile?.cognitive_xp ?? 0,
    journal_count: journalCount,
    gym_count: gymCount,
    duel_count: duelCount,
    oracle_count: oracleCount,
    heatmap,
    recent_activity: recentActivity.slice(0, 20),
  })
})
