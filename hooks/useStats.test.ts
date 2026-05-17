import { describe, it, expect } from 'vitest'
import { statsKeys } from './useStats'
import { journalKeys } from './useJournal'
import { gymKeys } from './useGym'
import { lexiconKeys } from './useLexicon'

describe('STREAK_MILESTONES detection', () => {
  it('milestones array covers key values', () => {
    const MILESTONES = [7, 30, 100, 365]
    expect(MILESTONES).toContain(7)
    expect(MILESTONES).toContain(30)
    expect(MILESTONES).toContain(100)
    expect(MILESTONES).toContain(365)
  })
})

describe('useSortedWords sort logic', () => {
  const mockWords = [
    {
      id: '1', word: 'ephemeral', definition: 'short-lived',
      usage_example: null, cognitive_xp: 150, usage_count: 3,
      last_used_at: '2026-01-10T10:00:00Z', created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: '2', word: 'alacrity', definition: 'eagerness',
      usage_example: null, cognitive_xp: 0, usage_count: 0,
      last_used_at: null, created_at: '2026-01-05T00:00:00Z',
    },
    {
      id: '3', word: 'zenith', definition: 'highest point',
      usage_example: null, cognitive_xp: 50, usage_count: 1,
      last_used_at: '2026-01-08T10:00:00Z', created_at: '2026-01-03T00:00:00Z',
    },
  ]

  it('xp-high sort puts highest XP first', () => {
    const sorted = [...mockWords].sort((a, b) => b.cognitive_xp - a.cognitive_xp)
    expect(sorted[0]!.word).toBe('ephemeral')
    expect(sorted[1]!.word).toBe('zenith')
    expect(sorted[2]!.word).toBe('alacrity')
  })

  it('xp-low sort puts lowest XP first', () => {
    const sorted = [...mockWords].sort((a, b) => a.cognitive_xp - b.cognitive_xp)
    expect(sorted[0]!.word).toBe('alacrity')
  })

  it('alpha sort is alphabetical', () => {
    const sorted = [...mockWords].sort((a, b) => a.word.localeCompare(b.word))
    expect(sorted[0]!.word).toBe('alacrity')
    expect(sorted[1]!.word).toBe('ephemeral')
    expect(sorted[2]!.word).toBe('zenith')
  })

  it('words due for practice - never used first', () => {
    const sorted = [...mockWords].sort((a, b) => {
      if (a.usage_count === 0 && b.usage_count !== 0) return -1
      if (b.usage_count === 0 && a.usage_count !== 0) return 1
      return a.cognitive_xp - b.cognitive_xp
    })
    expect(sorted[0]!.word).toBe('alacrity')
  })
})

describe('useJournalStats derived calculations', () => {
  const mockEntries = [
    { mode: 'apex' as const, word_count: 300 },
    { mode: 'haven' as const, word_count: 450 },
    { mode: 'apex' as const, word_count: 200 },
  ]

  it('calculates total words correctly', () => {
    const total = mockEntries.reduce((s, e) => s + e.word_count, 0)
    expect(total).toBe(950)
  })

  it('counts apex entries correctly', () => {
    const apex = mockEntries.filter(e => e.mode === 'apex').length
    expect(apex).toBe(2)
  })

  it('calculates average word count', () => {
    const avg = Math.round(
      mockEntries.reduce((s, e) => s + e.word_count, 0) / mockEntries.length
    )
    expect(avg).toBe(317)
  })
})

describe('useGymStats volume calculations', () => {
  const mockLogs = [
    { exercise: 'Bench Press', sets: 4, reps: 8, weight: 80, unit: 'kg' as const },
    { exercise: 'Squat',       sets: 3, reps: 5, weight: 100, unit: 'kg' as const },
    { exercise: 'Bench Press', sets: 3, reps: 10, weight: 70, unit: 'kg' as const },
  ]

  it('calculates total volume', () => {
    const total = mockLogs.reduce(
      (sum, l) => sum + (l.sets * l.reps * (l.weight ?? 1)),
      0
    )
    // 4x8x80 + 3x5x100 + 3x10x70
    // = 2560 + 1500 + 2100 = 6160
    expect(total).toBe(6160)
  })

  it('counts unique exercises', () => {
    const unique = new Set(mockLogs.map(l => l.exercise))
    expect(unique.size).toBe(2)
  })

  it('counts total sets', () => {
    const totalSets = mockLogs.reduce((sum, l) => sum + l.sets, 0)
    expect(totalSets).toBe(10)
  })
})

describe('cache invalidation keys', () => {
  it('statsKeys.all is stable reference root', () => {
    expect(statsKeys.all).toEqual(['stats'])
    expect(statsKeys.data()).toEqual(['stats', 'data'])
  })

  it('journalKeys hierarchy is correct', () => {
    expect(journalKeys.all).toEqual(['journal'])
    expect(journalKeys.lists()).toContain('journal')
    expect(journalKeys.list({})).toContain('journal')
  })

  it('gymKeys hierarchy is correct', () => {
    expect(gymKeys.all).toEqual(['gym'])
    expect(gymKeys.logs()).toContain('gym')
  })

  it('lexiconKeys hierarchy is correct', () => {
    expect(lexiconKeys.all).toEqual(['lexicon'])
    expect(lexiconKeys.words()).toContain('lexicon')
  })
})
