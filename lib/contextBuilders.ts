/**
 * NEXUS v2.0 — Ambient Context Builders
 * Construct context strings for ambient AI calls per surface.
 * Pure functions — no side effects — testable.
 */

// ─── Journal context ──────────────────────────────────────────────────────────

interface JournalContextParams {
  content:    string
  wordCount:  number
  mode:       'apex' | 'haven'
  entryCount: number
}

export function buildJournalContext({
  content,
  wordCount,
  mode,
  entryCount,
}: JournalContextParams): string {
  // Send last 400 chars — enough for context, not full entry
  const excerpt = content.length > 400
    ? '...' + content.slice(-400).trim()
    : content.trim()

  return [
    `Mode: ${mode.toUpperCase()}`,
    `Entry number: ${entryCount + 1}`,
    `Word count this session: ${wordCount}`,
    `Entry excerpt: "${excerpt}"`,
  ].join('\n')
}

// ─── Dashboard context ────────────────────────────────────────────────────────

interface DashboardContextParams {
  current_streak: number
  longest_streak: number
  cognitive_xp:   number
  journal_count:  number
  gym_count:      number
  duel_count:     number
  oracle_count:   number
  mode:           'apex' | 'haven'
}

export function buildDashboardContext(params: DashboardContextParams): string {
  const {
    current_streak,
    longest_streak,
    cognitive_xp,
    journal_count,
    gym_count,
    duel_count,
    oracle_count,
    mode,
  } = params

  const totalActivity = journal_count + gym_count + duel_count + oracle_count
  const streakDelta   = current_streak - Math.floor(longest_streak * 0.7)

  return [
    `Mode: ${mode.toUpperCase()}`,
    `Current streak: ${current_streak} days`,
    `Longest streak: ${longest_streak} days`,
    `Cognitive XP: ${cognitive_xp}`,
    `Total activities: ${totalActivity}`,
    `Journal entries: ${journal_count}`,
    `Gym sessions: ${gym_count}`,
    `Duels: ${duel_count}`,
    `Oracle sessions: ${oracle_count}`,
    streakDelta > 0
      ? `Streak is ${streakDelta} days above 70% of personal best`
      : `Streak is below personal best`,
  ].join('\n')
}

// ─── Gym context ──────────────────────────────────────────────────────────────

interface GymContextParams {
  exercise:      string
  sets:          number
  reps:          number
  weight?:       number
  unit:          'kg' | 'lbs'
  previousVolume?: number   // Total volume from last session for this exercise
  currentVolume:   number   // Total volume this session so far
  mode:          'apex' | 'haven'
}

export function buildGymContext({
  exercise,
  sets,
  reps,
  weight,
  unit,
  previousVolume,
  currentVolume,
  mode,
}: GymContextParams): string {
  const lines = [
    `Mode: ${mode.toUpperCase()}`,
    `Exercise: ${exercise}`,
    `This set: ${sets} sets × ${reps} reps${weight ? ` @ ${weight}${unit}` : ''}`,
    `Session volume so far: ${currentVolume.toFixed(0)}${unit}`,
  ]

  if (previousVolume !== undefined) {
    const delta   = currentVolume - previousVolume
    const pct     = previousVolume > 0
      ? ((delta / previousVolume) * 100).toFixed(1)
      : null
    const sign    = delta >= 0 ? '+' : ''
    lines.push(`vs last session: ${sign}${delta.toFixed(0)}${unit}${pct ? ` (${sign}${pct}%)` : ''}`)
  }

  return lines.join('\n')
}

// ─── Lexicon context ──────────────────────────────────────────────────────────

interface LexiconContextParams {
  word:       string
  definition: string
  sentence:   string
  verdict:    'correct' | 'incorrect' | 'partial'
  score:      number
  xpAwarded: number
  mode:      'apex' | 'haven'
}

export function buildLexiconContext({
  word,
  definition,
  sentence,
  verdict,
  score,
  xpAwarded,
  mode,
}: LexiconContextParams): string {
  return [
    `Mode: ${mode.toUpperCase()}`,
    `Word: "${word}"`,
    `Definition: ${definition}`,
    `User's sentence: "${sentence}"`,
    `Judge verdict: ${verdict.toUpperCase()}`,
    `Score: ${score}/100`,
    `XP awarded: ${xpAwarded}`,
  ].join('\n')
}
