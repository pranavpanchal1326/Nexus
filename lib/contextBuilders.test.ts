import { describe, it, expect } from 'vitest'
import {
  buildJournalContext,
  buildDashboardContext,
  buildGymContext,
  buildLexiconContext,
} from './contextBuilders'

describe('buildJournalContext', () => {
  it('includes word count and mode', () => {
    const ctx = buildJournalContext({
      content:    'This is a test entry with some meaningful content.',
      wordCount:  9,
      mode:       'apex',
      entryCount: 3,
    })
    expect(ctx).toContain('APEX')
    expect(ctx).toContain('9')
    expect(ctx).toContain('Entry number: 4')
  })

  it('truncates long content to last 400 chars', () => {
    const longContent = 'a'.repeat(500)
    const ctx = buildJournalContext({
      content:    longContent,
      wordCount:  500,
      mode:       'haven',
      entryCount: 0,
    })
    expect(ctx).toContain('...')
    // Excerpt should not contain the full 500-char string
    const excerptLine = ctx.split('\n').find(l => l.startsWith('Entry excerpt'))
    expect(excerptLine!.length).toBeLessThan(450)
  })

  it('short content not truncated', () => {
    const ctx = buildJournalContext({
      content:    'Short entry.',
      wordCount:  2,
      mode:       'apex',
      entryCount: 0,
    })
    expect(ctx).not.toContain('...')
    expect(ctx).toContain('Short entry.')
  })
})

describe('buildDashboardContext', () => {
  it('includes all activity counts', () => {
    const ctx = buildDashboardContext({
      current_streak: 7,
      longest_streak: 14,
      cognitive_xp:   1200,
      journal_count:  12,
      gym_count:      8,
      duel_count:     24,
      oracle_count:   5,
      mode:           'apex',
    })
    expect(ctx).toContain('7 days')
    expect(ctx).toContain('1200')
    expect(ctx).toContain('12')
    expect(ctx).toContain('8')
    expect(ctx).toContain('24')
  })

  it('includes streak vs personal best analysis', () => {
    // streak 10 > 70% of longest (14 × 0.7 = 9.8) → above
    const ctx = buildDashboardContext({
      current_streak: 10,
      longest_streak: 14,
      cognitive_xp:   0,
      journal_count:  0,
      gym_count:      0,
      duel_count:     0,
      oracle_count:   0,
      mode:           'apex',
    })
    expect(ctx).toContain('above')
  })

  it('detects below personal best', () => {
    // streak 5 < 70% of longest (14 × 0.7 = 9.8) → below
    const ctx = buildDashboardContext({
      current_streak: 5,
      longest_streak: 14,
      cognitive_xp:   0,
      journal_count:  0,
      gym_count:      0,
      duel_count:     0,
      oracle_count:   0,
      mode:           'haven',
    })
    expect(ctx).toContain('below')
  })
})

describe('buildGymContext', () => {
  it('includes exercise and set data', () => {
    const ctx = buildGymContext({
      exercise:      'Bench Press',
      sets:          4,
      reps:          8,
      weight:        80,
      unit:          'kg',
      currentVolume: 2560,
      mode:          'apex',
    })
    expect(ctx).toContain('Bench Press')
    expect(ctx).toContain('4 sets × 8 reps @ 80kg')
    expect(ctx).toContain('2560')
  })

  it('shows positive delta vs previous session', () => {
    const ctx = buildGymContext({
      exercise:        'Squat',
      sets:            3,
      reps:            5,
      weight:          100,
      unit:            'kg',
      previousVolume:  1200,
      currentVolume:   1500,
      mode:            'apex',
    })
    expect(ctx).toContain('+300')
    expect(ctx).toContain('+25.0%')
  })

  it('shows negative delta vs previous session', () => {
    const ctx = buildGymContext({
      exercise:       'Deadlift',
      sets:           2,
      reps:           3,
      weight:         140,
      unit:           'kg',
      previousVolume: 1000,
      currentVolume:  840,
      mode:           'haven',
    })
    expect(ctx).toContain('-160')
    expect(ctx).toContain('-16.0%')
  })

  it('omits previous volume when not provided', () => {
    const ctx = buildGymContext({
      exercise:      'Pull-ups',
      sets:          3,
      reps:          10,
      unit:          'kg',
      currentVolume: 0,
      mode:          'apex',
    })
    expect(ctx).not.toContain('vs last session')
  })
})

describe('buildLexiconContext', () => {
  it('includes word, sentence, and verdict', () => {
    const ctx = buildLexiconContext({
      word:       'ephemeral',
      definition: 'Lasting for a very short time',
      sentence:   'The ephemeral beauty of the sunrise lasted only minutes.',
      verdict:    'correct',
      score:      92,
      xpAwarded: 150,
      mode:       'haven',
    })
    expect(ctx).toContain('ephemeral')
    expect(ctx).toContain('CORRECT')
    expect(ctx).toContain('92/100')
    expect(ctx).toContain('150')
  })
})
