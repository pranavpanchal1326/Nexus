import { withAuth } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import JSZip from 'jszip'

// ─── GET /api/export ──────────────────────────────────────────────────────────

export const GET = withAuth(async (_req, { userId }) => {
  const supabase = await createServerSupabaseClient()

  // ─── Fetch all user data in parallel ─────────────────────────────────────

  const [
    profileResult,
    journalResult,
    gymResult,
    lexiconResult,
    chatResult,
    statsResult,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, cognitive_xp, current_streak, longest_streak, preferred_mode, created_at')
      .eq('id', userId)
      .single(),

    supabase
      .from('journals')
      .select('content, mode, word_count, ai_insight, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    supabase
      .from('gym_logs')
      .select('exercise, sets, reps, weight, unit, notes, volume_delta, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    supabase
      .from('word_lexicon')
      .select('word, definition, usage_example, cognitive_xp, usage_count, last_used_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    supabase
      .from('chat_history')
      .select('role, content, mode, persona, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }),

    supabase
      .from('daily_stats')
      .select('date, journal_count, gym_count, duel_count, oracle_count, xp_earned')
      .eq('user_id', userId)
      .order('date', { ascending: true }),
  ])

  // ─── Build ZIP ────────────────────────────────────────────────────────────

  const zip = new JSZip()
  const now = new Date().toISOString().split('T')[0]
  const folder = zip.folder(`nexus-export-${now}`)!

  // Manifest
  folder.file('manifest.json', JSON.stringify({
    exported_at: new Date().toISOString(),
    user_id: userId,
    version: '2.0',
    contents: [
      'profile.json',
      'journal.json',
      'gym.json',
      'lexicon.json',
      'oracle.json',
      'activity.json',
      'README.txt',
    ],
  }, null, 2))

  // Profile
  folder.file('profile.json', JSON.stringify(
    profileResult.data ?? {},
    null, 2
  ))

  // Journal entries
  folder.file('journal.json', JSON.stringify({
    count: journalResult.data?.length ?? 0,
    entries: journalResult.data ?? [],
  }, null, 2))

  // Gym logs
  folder.file('gym.json', JSON.stringify({
    count: gymResult.data?.length ?? 0,
    logs: gymResult.data ?? [],
  }, null, 2))

  // Lexicon
  folder.file('lexicon.json', JSON.stringify({
    count: lexiconResult.data?.length ?? 0,
    words: lexiconResult.data ?? [],
  }, null, 2))

  // Oracle / Chat history
  folder.file('oracle.json', JSON.stringify({
    count: chatResult.data?.length ?? 0,
    messages: chatResult.data ?? [],
  }, null, 2))

  // Daily activity stats
  folder.file('activity.json', JSON.stringify({
    count: statsResult.data?.length ?? 0,
    days: statsResult.data ?? [],
  }, null, 2))

  // Human-readable README
  folder.file('README.txt', [
    'NEXUS v2.0 — Data Export',
    `Exported: ${new Date().toISOString()}`,
    '',
    'Files:',
    '  profile.json  — Your profile, XP, and streak data',
    '  journal.json  — All journal entries with AI insights',
    '  gym.json      — All gym logs with volume deltas',
    '  lexicon.json  — Your full word lexicon with XP',
    '  oracle.json   — Oracle / chat session history',
    '  activity.json — Daily activity statistics',
    '',
    'This data is yours. NEXUS stores it. You own it.',
    'Format: JSON. All timestamps are ISO 8601 UTC.',
  ].join('\n'))

  // ─── Generate ZIP buffer ──────────────────────────────────────────────────

  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  })

  // ─── Return ZIP as download ───────────────────────────────────────────────

  return new Response(zipBuffer as any, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="nexus-export-${now}.zip"`,
      'Content-Length': String(zipBuffer.length),
      'Cache-Control': 'no-store',
    },
  })
})
