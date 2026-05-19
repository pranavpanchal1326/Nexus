import { describe, it, expect } from 'vitest'
import {
  buildJournalContext,
  buildDashboardContext,
  buildGymContext,
  buildLexiconContext,
} from '../lib/contextBuilders'

describe('buildJournalContext', () => {
  it('includes mode, word count, entry number', () => {
    const ctx = buildJournalContext({
      content: 'This is a test entry.',
      wordCount: 5, mode: 'apex', entryCount: 2,
    })
    expect(ctx).toContain('APEX')
    expect(ctx).toContain('5')
    expect(ctx).toContain('Entry number: 3')
  })

  it('truncates long content to last 400 chars', () => {
    const ctx = buildJournalContext({
      content: 'a'.repeat(500),
      wordCount: 500, mode: 'haven', entryCount: 0,
    })
    expect(ctx).toContain('...')
  })

  it('does not truncate short content', () => {
    const ctx = buildJournalContext({
      content: 'Short.', wordCount: 1, mode: 'apex', entryCount: 0,
    })
    expect(ctx).not.toContain('...')
    expect(ctx).toContain('Short.')
  })
})

describe('buildDashboardContext', () => {
  const base = {
    current_streak: 10, longest_streak: 14,
    cognitive_xp: 1200, journal_count: 12,
    gym_count: 8, duel_count: 24, oracle_count: 5,
    mode: 'apex' as const,
  }

  it('includes all activity counts', () => {
    const ctx = buildDashboardContext(base)
    expect(ctx).toContain('10 days')
    expect(ctx).toContain('1200')
    expect(ctx).toContain('12')
    expect(ctx).toContain('24')
  })

  it('above 70% of personal best — "above"', () => {
    // 10 > 14×0.7=9.8 → above
    expect(buildDashboardContext(base)).toContain('above')
  })

  it('below 70% of personal best — "below"', () => {
    // 5 < 14×0.7=9.8 → below
    expect(buildDashboardContext({ ...base, current_streak: 5 })).toContain('below')
  })
})

describe('buildGymContext', () => {
  it('includes exercise and set data', () => {
    const ctx = buildGymContext({
      exercise: 'Bench Press', sets: 4, reps: 8,
      weight: 80, unit: 'kg', currentVolume: 2560, mode: 'apex',
    })
    expect(ctx).toContain('Bench Press')
    expect(ctx).toContain('4 sets × 8 reps @ 80kg')
  })

  it('shows positive delta', () => {
    const ctx = buildGymContext({
      exercise: 'Squat', sets: 3, reps: 5, weight: 100, unit: 'kg',
      previousVolume: 1200, currentVolume: 1500, mode: 'apex',
    })
    expect(ctx).toContain('+300')
  })

  it('shows negative delta', () => {
    const ctx = buildGymContext({
      exercise: 'Deadlift', sets: 2, reps: 3, weight: 140, unit: 'kg',
      previousVolume: 1000, currentVolume: 840, mode: 'haven',
    })
    expect(ctx).toContain('-160')
  })

  it('omits vs line when no previous volume', () => {
    const ctx = buildGymContext({
      exercise: 'Pull-ups', sets: 3, reps: 10,
      unit: 'kg', currentVolume: 0, mode: 'apex',
    })
    expect(ctx).not.toContain('vs last session')
  })
})

describe('buildLexiconContext', () => {
  it('includes word, verdict, score, xp', () => {
    const ctx = buildLexiconContext({
      word: 'ephemeral', definition: 'Short-lived',
      sentence: 'The ephemeral light faded.',
      verdict: 'correct', score: 92, xpAwarded: 150, mode: 'haven',
    })
    expect(ctx).toContain('ephemeral')
    expect(ctx).toContain('CORRECT')
    expect(ctx).toContain('92/100')
    expect(ctx).toContain('150')
  })
})
