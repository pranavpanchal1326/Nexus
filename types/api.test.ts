import { describe, it, expect } from 'vitest'
import {
  ChatRequestSchema,
  AmbientRequestSchema,
  GymLogCreateSchema,
  LexiconEvaluateSchema,
  LexiconJudgeResponseSchema,
  parseRequest,
} from '../types/api'

describe('ChatRequestSchema', () => {
  it('accepts valid apex request', () => {
    expect(ChatRequestSchema.safeParse({
      message: 'Status report.', mode: 'apex', history: [],
    }).success).toBe(true)
  })

  it('accepts valid haven request with history', () => {
    expect(ChatRequestSchema.safeParse({
      message: 'How am I doing?',
      mode:    'haven',
      history: [{ role: 'user', content: 'Hello' }],
    }).success).toBe(true)
  })

  it('rejects empty message', () => {
    expect(ChatRequestSchema.safeParse({
      message: '', mode: 'apex', history: [],
    }).success).toBe(false)
  })

  it('rejects message over 4000 chars', () => {
    expect(ChatRequestSchema.safeParse({
      message: 'a'.repeat(4001), mode: 'apex', history: [],
    }).success).toBe(false)
  })

  it('rejects invalid mode', () => {
    expect(ChatRequestSchema.safeParse({
      message: 'Hello', mode: 'invalid', history: [],
    }).success).toBe(false)
  })

  it('rejects history over 40 messages', () => {
    expect(ChatRequestSchema.safeParse({
      message: 'Hello',
      mode:    'apex',
      history: Array.from({ length: 41 }, () => ({ role: 'user', content: 'x' })),
    }).success).toBe(false)
  })

  it('defaults history to empty array', () => {
    const result = ChatRequestSchema.safeParse({ message: 'Hello', mode: 'apex' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.history).toEqual([])
  })
})

describe('GymLogCreateSchema', () => {
  it('accepts valid gym log', () => {
    expect(GymLogCreateSchema.safeParse({
      exercise: 'Bench Press', sets: 4, reps: 8, weight: 80, unit: 'kg',
    }).success).toBe(true)
  })

  it('defaults unit to kg', () => {
    const result = GymLogCreateSchema.safeParse({
      exercise: 'Pull-ups', sets: 3, reps: 10,
    })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.unit).toBe('kg')
  })

  it('rejects negative sets', () => {
    expect(GymLogCreateSchema.safeParse({
      exercise: 'Squat', sets: -1, reps: 5,
    }).success).toBe(false)
  })

  it('rejects zero reps', () => {
    expect(GymLogCreateSchema.safeParse({
      exercise: 'Row', sets: 3, reps: 0,
    }).success).toBe(false)
  })

  it('accepts optional weight and notes', () => {
    expect(GymLogCreateSchema.safeParse({
      exercise: 'Dips', sets: 3, reps: 12,
      weight: 20, unit: 'kg', notes: 'Felt strong',
    }).success).toBe(true)
  })
})

describe('LexiconEvaluateSchema', () => {
  it('accepts valid evaluation', () => {
    expect(LexiconEvaluateSchema.safeParse({
      word:     'ephemeral',
      sentence: 'The morning light was ephemeral.',
      mode:     'haven',
    }).success).toBe(true)
  })

  it('rejects sentence under 3 characters', () => {
    expect(LexiconEvaluateSchema.safeParse({
      word: 'test', sentence: 'ab', mode: 'apex',
    }).success).toBe(false)
  })

  it('rejects sentence over 500 characters', () => {
    expect(LexiconEvaluateSchema.safeParse({
      word: 'test', sentence: 'a'.repeat(501), mode: 'apex',
    }).success).toBe(false)
  })
})

describe('LexiconJudgeResponseSchema', () => {
  it('accepts correct verdict', () => {
    expect(LexiconJudgeResponseSchema.safeParse({
      verdict: 'correct', score: 95, reasoning: 'Perfect usage.', xp_awarded: 150,
    }).success).toBe(true)
  })

  it('accepts partial verdict', () => {
    expect(LexiconJudgeResponseSchema.safeParse({
      verdict: 'partial', score: 60, reasoning: 'Close.', xp_awarded: 50,
    }).success).toBe(true)
  })

  it('rejects invalid xp_awarded', () => {
    expect(LexiconJudgeResponseSchema.safeParse({
      verdict: 'correct', score: 90, reasoning: 'Good.', xp_awarded: 75,
    }).success).toBe(false)
  })

  it('rejects score over 100', () => {
    expect(LexiconJudgeResponseSchema.safeParse({
      verdict: 'correct', score: 101, reasoning: 'Good.', xp_awarded: 150,
    }).success).toBe(false)
  })
})

describe('parseRequest', () => {
  it('returns success on valid data', () => {
    const result = parseRequest(ChatRequestSchema, {
      message: 'Hello', mode: 'apex', history: [],
    })
    expect(result.success).toBe(true)
  })

  it('returns error string on invalid data', () => {
    const result = parseRequest(ChatRequestSchema, { message: '', mode: 'apex' })
    expect(result.success).toBe(false)
    if (!result.success) expect(typeof result.error).toBe('string')
  })
})

describe('AmbientRequestSchema', () => {
  it('accepts valid ambient request', () => {
    expect(AmbientRequestSchema.safeParse({
      surface: 'journal', context: 'Some context', mode: 'haven',
    }).success).toBe(true)
  })

  it('rejects invalid surface', () => {
    expect(AmbientRequestSchema.safeParse({
      surface: 'invalid', context: 'ctx', mode: 'apex',
    }).success).toBe(false)
  })

  it('rejects empty context', () => {
    expect(AmbientRequestSchema.safeParse({
      surface: 'dashboard', context: '', mode: 'apex',
    }).success).toBe(false)
  })
})
