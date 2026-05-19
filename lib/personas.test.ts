import { describe, it, expect } from 'vitest'
import {
  COMMANDER_SYSTEM,
  POET_SYSTEM,
  AMBIENT_SYSTEM,
  LEXICON_JUDGE_SYSTEM,
  getPersonaSystem,
  getPersonaName,
  getPersonaTemperature,
} from '../lib/personas'

describe('COMMANDER_SYSTEM', () => {
  it('is a non-empty string over 500 chars', () => {
    expect(typeof COMMANDER_SYSTEM).toBe('string')
    expect(COMMANDER_SYSTEM.length).toBeGreaterThan(500)
  })

  it('contains Commander identity', () => {
    expect(COMMANDER_SYSTEM).toContain('Commander')
    expect(COMMANDER_SYSTEM).toContain('APEX')
  })

  it('explicitly forbids filler phrases', () => {
    expect(COMMANDER_SYSTEM).toContain('Never use')
    expect(COMMANDER_SYSTEM).toContain("Great!")
  })

  it('specifies 120 word maximum', () => {
    expect(COMMANDER_SYSTEM).toContain('120 words')
  })

  it('specifies active voice and present tense', () => {
    expect(COMMANDER_SYSTEM).toContain('Present tense')
    expect(COMMANDER_SYSTEM).toContain('Active voice')
  })

  it('forbids starting with I', () => {
    expect(COMMANDER_SYSTEM).toContain('Never start a response with "I"')
  })

  it('specifies plain text formatting', () => {
    expect(COMMANDER_SYSTEM).toContain('Plain text only')
  })
})

describe('POET_SYSTEM', () => {
  it('is a non-empty string over 500 chars', () => {
    expect(typeof POET_SYSTEM).toBe('string')
    expect(POET_SYSTEM.length).toBeGreaterThan(500)
  })

  it('contains Poet identity', () => {
    expect(POET_SYSTEM).toContain('Poet')
    expect(POET_SYSTEM).toContain('HAVEN')
  })

  it('explicitly forbids bullet points', () => {
    expect(POET_SYSTEM).toContain('Never use bullet points')
  })

  it('specifies 200 word maximum', () => {
    expect(POET_SYSTEM).toContain('200 words')
  })

  it('forbids the word boundaries', () => {
    expect(POET_SYSTEM).toContain('"boundaries"')
  })

  it('specifies italic serif formatting context', () => {
    expect(POET_SYSTEM).toContain('Instrument Serif')
  })

  it('forbids action plans', () => {
    expect(POET_SYSTEM).toContain("numbered action plan")
  })
})

describe('AMBIENT_SYSTEM', () => {
  it('specifies exactly one sentence', () => {
    expect(AMBIENT_SYSTEM).toContain('Exactly one sentence')
  })

  it('specifies 12 word maximum', () => {
    expect(AMBIENT_SYSTEM).toContain('12 words')
  })

  it('forbids questions', () => {
    expect(AMBIENT_SYSTEM).toContain('No questions')
  })

  it('forbids starting with I', () => {
    expect(AMBIENT_SYSTEM).toContain('"I"')
  })

  it('provides correct examples', () => {
    expect(AMBIENT_SYSTEM).toContain('EXAMPLES OF CORRECT OUTPUT')
    expect(AMBIENT_SYSTEM).toContain('EXAMPLES OF WRONG OUTPUT')
  })

  it('forbids no-punctuation at end', () => {
    expect(AMBIENT_SYSTEM).toContain('No punctuation at the end')
  })
})

describe('LEXICON_JUDGE_SYSTEM', () => {
  it('specifies JSON-only output', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('valid JSON only')
  })

  it('defines all three verdict values', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('"correct"')
    expect(LEXICON_JUDGE_SYSTEM).toContain('"incorrect"')
    expect(LEXICON_JUDGE_SYSTEM).toContain('"partial"')
  })

  it('defines XP amounts correctly', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('150 XP')
    expect(LEXICON_JUDGE_SYSTEM).toContain('50 XP')
    expect(LEXICON_JUDGE_SYSTEM).toContain('0 XP')
  })

  it('specifies 15 word reasoning limit', () => {
    expect(LEXICON_JUDGE_SYSTEM).toContain('15 words')
  })
})

describe('getPersonaSystem', () => {
  it('returns COMMANDER for apex', () => {
    expect(getPersonaSystem('apex')).toBe(COMMANDER_SYSTEM)
  })

  it('returns POET for haven', () => {
    expect(getPersonaSystem('haven')).toBe(POET_SYSTEM)
  })
})

describe('getPersonaName', () => {
  it('returns commander for apex', () => {
    expect(getPersonaName('apex')).toBe('commander')
  })

  it('returns poet for haven', () => {
    expect(getPersonaName('haven')).toBe('poet')
  })
})

describe('getPersonaTemperature', () => {
  it('ambient always returns 0.6 regardless of mode', () => {
    expect(getPersonaTemperature('apex',  'ambient')).toBe(0.6)
    expect(getPersonaTemperature('haven', 'ambient')).toBe(0.6)
  })

  it('lexicon always returns 0.2 — judge consistency', () => {
    expect(getPersonaTemperature('apex',  'lexicon')).toBe(0.2)
    expect(getPersonaTemperature('haven', 'lexicon')).toBe(0.2)
  })

  it('oracle apex returns 0.3', () => {
    expect(getPersonaTemperature('apex', 'oracle')).toBe(0.3)
  })

  it('oracle haven returns 0.85', () => {
    expect(getPersonaTemperature('haven', 'oracle')).toBe(0.85)
  })

  it('haven always >= apex for same surface', () => {
    const surfaces = ['oracle', 'gym', 'journal'] as const
    surfaces.forEach(s => {
      expect(getPersonaTemperature('haven', s))
        .toBeGreaterThanOrEqual(getPersonaTemperature('apex', s))
    })
  })
})
