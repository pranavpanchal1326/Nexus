/**
 * NEXUS v2.0 — Phase 4A Unit Tests
 *
 * Tests persona prompts, selector functions, temperature logic,
 * and all Zod validation schemas.
 *
 * Run: npx vitest run lib/personas.test.ts
 * All 28 tests must pass.
 */
import { describe, it, expect } from 'vitest'

// server-only is mocked via vitest.config.ts alias → tests/unit/__mocks__/server-only.ts
import {
  COMMANDER_SYSTEM,
  POET_SYSTEM,
  AMBIENT_SYSTEM,
  LEXICON_JUDGE_SYSTEM,
  getPersonaSystem,
  getPersonaName,
  getPersonaTemperature,
} from '@/lib/personas'

import {
  ChatRequestSchema,
  GymLogCreateSchema,
  LexiconEvaluateSchema,
  parseRequest,
} from '@/types/api'

// ─── COMMANDER_SYSTEM ─────────────────────────────────────────────────────────

describe('COMMANDER_SYSTEM', () => {
  it('is a non-empty string', () => {
    expect(typeof COMMANDER_SYSTEM).toBe('string')
    expect(COMMANDER_SYSTEM.length).toBeGreaterThan(100)
  })

  it('contains Commander identity markers', () => {
    expect(COMMANDER_SYSTEM).toContain('Commander')
    expect(COMMANDER_SYSTEM).toContain('APEX')
  })

  it('explicitly forbids encouragement phrases', () => {
    expect(COMMANDER_SYSTEM).toContain('Great!')
    expect(COMMANDER_SYSTEM).toContain('NEVER VIOLATE')
  })

  it('specifies maximum 120 word response', () => {
    expect(COMMANDER_SYSTEM).toContain('120 words')
  })

  it('does not reference Poet by name', () => {
    // HAVEN appears once as "HAVEN's domain" — that is acceptable
    expect(COMMANDER_SYSTEM).not.toContain('Poet')
  })
})

// ─── POET_SYSTEM ──────────────────────────────────────────────────────────────

describe('POET_SYSTEM', () => {
  it('is a non-empty string', () => {
    expect(typeof POET_SYSTEM).toBe('string')
    expect(POET_SYSTEM.length).toBeGreaterThan(100)
  })

  it('contains Poet identity markers', () => {
    expect(POET_SYSTEM).toContain('Poet')
    expect(POET_SYSTEM).toContain('HAVEN')
  })

  it('explicitly forbids bullet points', () => {
    expect(POET_SYSTEM).toContain('bullet points')
  })

  it('specifies maximum 200 word response', () => {
    expect(POET_SYSTEM).toContain('200 words')
  })

  it('forbids the word boundaries', () => {
    expect(POET_SYSTEM).toContain('"boundaries"')
  })
})

// ─── AMBIENT_SYSTEM ───────────────────────────────────────────────────────────

describe('AMBIENT_SYSTEM', () => {
  it('specifies maximum 12 words', () => {
    expect(AMBIENT_SYSTEM).toContain('12 words')
  })

  it('forbids questions', () => {
    expect(AMBIENT_SYSTEM).toContain('questions')
  })

  it('forbids starting with I', () => {
    expect(AMBIENT_SYSTEM).toContain('"I"')
  })

  it('provides both correct and wrong examples', () => {
    expect(AMBIENT_SYSTEM).toContain('EXAMPLES OF CORRECT OUTPUT')
    expect(AMBIENT_SYSTEM).toContain('EXAMPLES OF WRONG OUTPUT')
  })
})

// ─── LEXICON_JUDGE_SYSTEM ─────────────────────────────────────────────────────

describe('LEXICON_JUDGE_SYSTEM', () => {
  it('specifies JSON output format', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('valid JSON only')
  })

  it('defines all three verdict values', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('"correct"')
    expect(LEXICON_JUDGE_SYSTEM).toContain('"incorrect"')
    expect(LEXICON_JUDGE_SYSTEM).toContain('"partial"')
  })

  it('defines XP amounts', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('150 XP')
    expect(LEXICON_JUDGE_SYSTEM).toContain('50 XP')
    expect(LEXICON_JUDGE_SYSTEM).toContain('0 XP')
  })
})

// ─── getPersonaSystem ─────────────────────────────────────────────────────────

describe('getPersonaSystem', () => {
  it('returns COMMANDER_SYSTEM for apex', () => {
    expect(getPersonaSystem('apex')).toBe(COMMANDER_SYSTEM)
  })

  it('returns POET_SYSTEM for haven', () => {
    expect(getPersonaSystem('haven')).toBe(POET_SYSTEM)
  })
})

// ─── getPersonaName ───────────────────────────────────────────────────────────

describe('getPersonaName', () => {
  it('returns commander for apex', () => {
    expect(getPersonaName('apex')).toBe('commander')
  })

  it('returns poet for haven', () => {
    expect(getPersonaName('haven')).toBe('poet')
  })
})

// ─── getPersonaTemperature ────────────────────────────────────────────────────

describe('getPersonaTemperature', () => {
  it('ambient surface always returns 0.6', () => {
    expect(getPersonaTemperature('apex',  'ambient')).toBe(0.6)
    expect(getPersonaTemperature('haven', 'ambient')).toBe(0.6)
  })

  it('lexicon surface always returns 0.2 — judge consistency', () => {
    expect(getPersonaTemperature('apex',  'lexicon')).toBe(0.2)
    expect(getPersonaTemperature('haven', 'lexicon')).toBe(0.2)
  })

  it('oracle apex returns 0.3 — Commander precision', () => {
    expect(getPersonaTemperature('apex', 'oracle')).toBe(0.3)
  })

  it('oracle haven returns 0.85 — Poet expression', () => {
    expect(getPersonaTemperature('haven', 'oracle')).toBe(0.85)
  })

  it('haven temperature always >= apex temperature for same surface', () => {
    const surfaces = ['oracle', 'gym', 'journal'] as const
    surfaces.forEach(s => {
      expect(getPersonaTemperature('haven', s))
        .toBeGreaterThanOrEqual(getPersonaTemperature('apex', s))
    })
  })
})

// ─── ChatRequestSchema ────────────────────────────────────────────────────────

describe('ChatRequestSchema', () => {
  it('accepts valid request', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Hello Commander',
      mode:    'apex',
      history: [],
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty message', () => {
    const result = ChatRequestSchema.safeParse({
      message: '',
      mode:    'apex',
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects message over 4000 chars', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'a'.repeat(4001),
      mode:    'apex',
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid mode', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Hello',
      mode:    'invalid',
      history: [],
    })
    expect(result.success).toBe(false)
  })

  it('defaults history to empty array', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Hello',
      mode:    'apex',
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.history).toEqual([])
  })

  it('rejects history over 40 messages', () => {
    const result = ChatRequestSchema.safeParse({
      message: 'Hello',
      mode:    'apex',
      history: Array.from({ length: 41 }, (_, i) => ({
        role:    'user',
        content: `Message ${i}`,
      })),
    })
    expect(result.success).toBe(false)
  })
})

// ─── GymLogCreateSchema ───────────────────────────────────────────────────────

describe('GymLogCreateSchema', () => {
  it('accepts valid gym log', () => {
    const result = GymLogCreateSchema.safeParse({
      exercise: 'Bench Press',
      sets:     4,
      reps:     8,
      weight:   80,
      unit:     'kg',
    })
    expect(result.success).toBe(true)
  })

  it('defaults unit to kg', () => {
    const result = GymLogCreateSchema.safeParse({
      exercise: 'Pull-ups',
      sets:     3,
      reps:     10,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.unit).toBe('kg')
  })

  it('rejects negative sets', () => {
    const result = GymLogCreateSchema.safeParse({
      exercise: 'Squat',
      sets:     -1,
      reps:     5,
    })
    expect(result.success).toBe(false)
  })
})

// ─── LexiconEvaluateSchema ────────────────────────────────────────────────────

describe('LexiconEvaluateSchema', () => {
  it('accepts valid evaluation request', () => {
    const result = LexiconEvaluateSchema.safeParse({
      word:     'ephemeral',
      sentence: 'The morning light was ephemeral, gone before the coffee cooled.',
      mode:     'haven',
    })
    expect(result.success).toBe(true)
  })

  it('rejects sentence under 3 characters', () => {
    const result = LexiconEvaluateSchema.safeParse({
      word:     'test',
      sentence: 'ab',
      mode:     'apex',
    })
    expect(result.success).toBe(false)
  })
})

// ─── parseRequest utility ─────────────────────────────────────────────────────

describe('parseRequest', () => {
  it('returns success: true with parsed data on valid input', () => {
    const result = parseRequest(ChatRequestSchema, {
      message: 'Valid message',
      mode:    'haven',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.message).toBe('Valid message')
      expect(result.data.mode).toBe('haven')
    }
  })

  it('returns success: false with error string on invalid input', () => {
    const result = parseRequest(ChatRequestSchema, {
      message: '',
      mode:    'apex',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(typeof result.error).toBe('string')
      expect(result.error.length).toBeGreaterThan(0)
    }
  })

  it('formats multiple Zod errors into single string', () => {
    const result = parseRequest(ChatRequestSchema, {
      message: '',
      mode:    'invalid_mode',
    })
    expect(result.success).toBe(false)
  })
})
